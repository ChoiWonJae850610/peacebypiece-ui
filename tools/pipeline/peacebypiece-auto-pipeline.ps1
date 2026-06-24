# ==========================================
# PeaceByPiece Patch Auto Pipeline
# Encoding: UTF-8 with BOM
# ==========================================
# 목적
# - incoming_patch 폴더에 들어온 "개별 파일 패치"를 프로젝트에 반영한다.
# - zip을 쓰지 않는다.
# - commit-meta.md를 작업 단위의 기준 파일로 사용한다.
#
# 입력 구조
#   incoming_patch\commit-meta.md
#   incoming_patch\lib__admin__history__presentation.ts
#   incoming_patch\components__admin__PartnerList.tsx
#
# 파일명 규칙
#   lib__admin__history__presentation.ts
#     -> lib\admin\history\presentation.ts
#
# 핵심 안전 규칙
# - commit-meta.md가 있어도, 수정/추가 파일 목록에 적힌 파일이 모두 도착하기 전에는 작업하지 않는다.
# - 파일이 덜 도착한 상태면 최대 5분만 기다린 뒤 failed_patch로 이동한다.
# - package.json / package-lock.json은 commit-meta.md에서 명시 허용된 경우에만 자동 변경을 허용한다.
# - node_modules / .git / .next 는 항상 자동 변경 금지이며 즉시 failed_patch 처리한다.
# - git commit/push를 먼저 수행하고, build는 검증용으로만 실행한다.
# ==========================================

param(
    [switch]$CreateLocalRepoHandoff,
    [string]$VerificationResultPath = "",
    [string]$VerificationProfile = ""
)

$PipelineCommonPath = Join-Path $PSScriptRoot "pipeline-common.ps1"
$PipelinePatchProcessingPath = Join-Path $PSScriptRoot "pipeline-patch-processing.ps1"
$DownloadWatcherScriptPath = Join-Path $PSScriptRoot "download-watcher.ps1"

foreach ($requiredScript in @($PipelineCommonPath, $PipelinePatchProcessingPath, $DownloadWatcherScriptPath)) {
    if (-not (Test-Path -LiteralPath $requiredScript)) {
        throw "Pipeline 구성 스크립트를 찾을 수 없습니다: $requiredScript"
    }
}

. $PipelineCommonPath
. $PipelinePatchProcessingPath

# ==========================================
# 9. 초기화 함수
# ==========================================

function InitializePipeline {
    EnsureDirectory -Path $PatchDownloadDir
    EnsureDirectory -Path $PatchSuccessDir
    EnsureDirectory -Path $PatchFailedDir
    EnsureDirectory -Path $BuildZipDir
    EnsureDirectory -Path $LogDir
    EnsureDirectory -Path $RepoStatusDir
    EnsureDirectory -Path $NewestResultDIr
    EnsureDirectory -Path (Split-Path -Parent $WatcherPidFile)
    EnsureDirectory -Path (Split-Path -Parent $WatcherStateFile)
    EnsureDirectory -Path (Split-Path -Parent $WatcherLogFile)
    EnsureDirectory -Path (Split-Path -Parent $RuntimeOptionsFile)

    if (-not (Test-Path -LiteralPath $RuntimeOptionsFile)) {
        SaveRuntimeOptions -NPMBuildValue $script:NPMBuild
    }
    RefreshRuntimeOptions
}



function ClearDirectoryContents {
    param([string]$Path)

    EnsureDirectory -Path $Path

    Get-ChildItem -LiteralPath $Path -Force -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item -LiteralPath $_.FullName -Recurse -Force
    }

    LogInfo "Folder flushed: $Path"
}

function FlushOutputFolders {
    Write-Host ""
    Write-Host "========================================================="
    LogWarn "산출물 폴더를 비웁니다."
    LogInfo "대상 1: $BuildZipDir"
    LogInfo "대상 2: $LogDir"
    LogInfo "대상 3: $RepoStatusDir"
    Write-Host "========================================================="

    ClearDirectoryContents -Path $BuildZipDir
    ClearDirectoryContents -Path $LogDir
    ClearDirectoryContents -Path $RepoStatusDir

    Write-Host ""
    LogInfo "Flush folders 완료. 아무 키나 누르면 메인 메뉴로 돌아갑니다."
    [Console]::ReadKey($true) | Out-Null
}


# ==========================================
# 9-1. npm run dev 토글 함수
# ==========================================

function GetDevServerProcess {
    if (-not (Test-Path -LiteralPath $DevServerPidFile)) {
        return $null
    }

    try {
        $pidText = (Get-Content -LiteralPath $DevServerPidFile -Raw -ErrorAction Stop).Trim()

        if ([string]::IsNullOrWhiteSpace($pidText)) {
            Remove-Item -LiteralPath $DevServerPidFile -Force -ErrorAction SilentlyContinue
            return $null
        }

        $processId = [int]$pidText
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

        if ($null -eq $process) {
            Remove-Item -LiteralPath $DevServerPidFile -Force -ErrorAction SilentlyContinue
            return $null
        }

        return $process
    }
    catch {
        Remove-Item -LiteralPath $DevServerPidFile -Force -ErrorAction SilentlyContinue
        return $null
    }
}

function GetDevServerStatusText {
    $process = GetDevServerProcess

    if ($null -eq $process) {
        return "OFF"
    }

    return "ON"
}

function GetNPMBuildStatusText {
    if ($script:NPMBuild) {
        return "ON"
    }

    return "OFF"
}

function StartDevServerBackground {
    $runningProcess = GetDevServerProcess

    if ($null -ne $runningProcess) {
        LogWarn "npm run dev가 이미 실행 중입니다. PID: $($runningProcess.Id)"
        Start-Sleep -Seconds 1
        return
    }

    if (-not (Test-Path -LiteralPath $ProjectDir)) {
        LogError "프로젝트 루트 경로를 찾을 수 없습니다: $ProjectDir"
        Start-Sleep -Seconds 2
        return
    }

    try {
        $pidDir = Split-Path -Parent $DevServerPidFile
        EnsureDirectory -Path $pidDir

        $argumentList = "/c cd /d `"$ProjectDir`" && npm run dev"
        $process = Start-Process -FilePath "cmd.exe" -ArgumentList $argumentList -WindowStyle Hidden -PassThru

        $process.Id | Set-Content -LiteralPath $DevServerPidFile -Encoding UTF8
        LogInfo "npm run dev를 백그라운드로 시작했습니다. PID: $($process.Id)"
    }
    catch {
        LogError "npm run dev 시작 실패: $($_.Exception.Message)"
    }

    Start-Sleep -Seconds 1
}

function StopDevServerBackground {
    $runningProcess = GetDevServerProcess

    if ($null -eq $runningProcess) {
        Remove-Item -LiteralPath $DevServerPidFile -Force -ErrorAction SilentlyContinue
        LogWarn "종료할 npm run dev 프로세스가 없습니다."
        Start-Sleep -Seconds 1
        return
    }

    try {
        $processId = $runningProcess.Id
        taskkill /PID $processId /T /F | Out-Null
        Remove-Item -LiteralPath $DevServerPidFile -Force -ErrorAction SilentlyContinue
        LogInfo "npm run dev를 종료했습니다. PID: $processId"
    }
    catch {
        LogError "npm run dev 종료 실패: $($_.Exception.Message)"
    }

    Start-Sleep -Seconds 1
}

function ToggleDevServerBackground {
    $runningProcess = GetDevServerProcess

    if ($null -eq $runningProcess) {
        StartDevServerBackground
        return
    }

    StopDevServerBackground
}

function ToggleNPMBuildOption {
    RefreshRuntimeOptions
    $script:NPMBuild = -not $script:NPMBuild
    SaveRuntimeOptions -NPMBuildValue $script:NPMBuild

    if ($script:NPMBuild) {
        LogInfo "NPM Build 옵션: ON"
    }
    else {
        LogWarn "NPM Build 옵션: OFF"
    }

    Start-Sleep -Seconds 1
}


# ==========================================
# 9-2. DB/API Smoke Test 실행 함수
# ==========================================

function LoadEnvLocalForSmokeTest {
    $envPath = Join-Path $ProjectDir ".env.local"

    if (-not (Test-Path -LiteralPath $envPath)) {
        LogError ".env.local 파일을 찾을 수 없습니다: $envPath"
        return $false
    }

    try {
        $lines = Get-Content -LiteralPath $envPath -Encoding UTF8 -ErrorAction Stop

        foreach ($line in $lines) {
            $trimmed = $line.Trim()

            if ([string]::IsNullOrWhiteSpace($trimmed)) {
                continue
            }

            if ($trimmed.StartsWith("#")) {
                continue
            }

            $parts = $trimmed -split "=", 2

            if ($parts.Count -ne 2) {
                continue
            }

            $key = $parts[0].Trim()
            $value = $parts[1].Trim()

            if ([string]::IsNullOrWhiteSpace($key)) {
                continue
            }

            if ($key -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') {
                continue
            }

            if ($value.Length -ge 2) {
                if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
            }

            [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        }

        LogInfo ".env.local 로딩 완료"

        if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
            LogWarn "DATABASE_URL 환경변수가 비어 있습니다. 테스트가 실패할 수 있습니다."
        }
        else {
            LogInfo "DATABASE_URL 감지됨"
        }

        return $true
    }
    catch {
        LogError ".env.local 로딩 실패: $($_.Exception.Message)"
        return $false
    }
}

function SanitizeResultFileNamePart {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return "unknown"
    }

    $sanitized = [regex]::Replace($Value.Trim(), '[\\/:*?"<>|\s]+', '-')
    $sanitized = $sanitized.Trim('-')

    if ([string]::IsNullOrWhiteSpace($sanitized)) {
        return "unknown"
    }

    return $sanitized
}

function GetUniqueOutputPath {
    param(
        [string]$Directory,
        [string]$FileNameWithoutExtension,
        [string]$Extension
    )

    $candidate = Join-Path $Directory "$FileNameWithoutExtension$Extension"
    if (-not (Test-Path -LiteralPath $candidate)) {
        return $candidate
    }

    $timestamp = GetTimestamp
    $candidate = Join-Path $Directory "$FileNameWithoutExtension-$timestamp$Extension"
    if (-not (Test-Path -LiteralPath $candidate)) {
        return $candidate
    }

    $counter = 2
    while ($true) {
        $candidate = Join-Path $Directory "$FileNameWithoutExtension-$timestamp-$counter$Extension"
        if (-not (Test-Path -LiteralPath $candidate)) {
            return $candidate
        }
        $counter++
    }
}

function ConvertToZipEntryName {
    param([string]$RelativePath)

    return (($RelativePath -replace '\\', '/') -replace '^\./', '')
}

function GetZipEntrySegments {
    param([string]$RelativePath)

    $entryName = (ConvertToZipEntryName -RelativePath $RelativePath).Trim('/')
    if ([string]::IsNullOrWhiteSpace($entryName)) {
        return @()
    }

    return @($entryName -split '/')
}

function GetLocalRepoRelativePath {
    param([string]$FullPath)

    $basePath = [System.IO.Path]::GetFullPath($ProjectDir).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
    $targetPath = [System.IO.Path]::GetFullPath($FullPath)
    $baseUri = New-Object System.Uri($basePath)
    $targetUri = New-Object System.Uri($targetPath)
    $relativeUri = $baseUri.MakeRelativeUri($targetUri)
    $relativePath = [System.Uri]::UnescapeDataString($relativeUri.ToString())
    return ($relativePath -replace '/', [System.IO.Path]::DirectorySeparatorChar)
}

function TestLocalRepoExportExcludedPath {
    param([string]$RelativePath)

    $entryName = (ConvertToZipEntryName -RelativePath $RelativePath).TrimStart('/')
    $segments = @(GetZipEntrySegments -RelativePath $entryName)
    $lowerSegments = @($segments | ForEach-Object { $_.ToLowerInvariant() })
    $leaf = [System.IO.Path]::GetFileName($entryName).ToLowerInvariant()

    if ($leaf -eq ".env.example") {
        return $false
    }

    $excludedSegments = @(
        ".git",
        "node_modules",
        ".next",
        ".wrangler",
        "artifacts",
        ".tmp",
        "test-results",
        "playwright-report",
        "reports"
    )

    foreach ($segment in $lowerSegments) {
        if ($excludedSegments -contains $segment) {
            return $true
        }
    }

    if ($leaf -eq ".env" -or $leaf.StartsWith(".env.")) {
        return $true
    }

    if ($leaf -like "*.zip" -or $leaf -like "repo-state-*.txt" -or $leaf -like "build-result-*.txt" -or $leaf -like "*.tsbuildinfo") {
        return $true
    }

    if ($leaf -in @(".ds_store", "thumbs.db", "desktop.ini")) {
        return $true
    }

    $backupOrTempPatterns = @(
        "*.bak",
        "*.backup",
        "*.old",
        "*.orig",
        "*.tmp",
        "*.temp",
        "*~",
        "* - copy.*",
        "* copy.*",
        "*.copy.*"
    )

    foreach ($pattern in $backupOrTempPatterns) {
        if ($leaf -like $pattern) {
            return $true
        }
    }

    return $false
}

function GetLocalRepoExportExcludeSummary {
    return @(
        "any path segment named .git",
        "any path segment named node_modules",
        "any path segment named .next",
        "any path segment named .wrangler",
        "any path segment named artifacts",
        "any path segment named .tmp",
        "any path segment named test-results",
        "any path segment named playwright-report",
        "any path segment named reports",
        "*.tsbuildinfo",
        ".env, .env.* except .env.example",
        "generated ZIP files",
        "repo-state-*.txt",
        "build-result-*.txt",
        "backup/temp/copy files",
        "OS temporary files"
    )
}

function TestSuspiciousSecretExportCandidate {
    param([string]$RelativePath)

    $entryName = ConvertToZipEntryName -RelativePath $RelativePath
    $lower = $entryName.ToLowerInvariant()
    $leaf = [System.IO.Path]::GetFileName($lower)

    if ($lower -match '(^|/)(docs|tests|test|__tests__|fixtures|mocks|examples?)/') {
        return $false
    }

    if ($leaf -match '(example|sample|template|mock|dummy)') {
        return $false
    }

    if ($leaf -in @("secrets.json", "secret.json", "tokens.json", "token.json", "credentials.json", "credential.json")) {
        return $true
    }

    if (($leaf -match "(^|[-_.])(secret|token|credential|credentials)([-_.]|`$)") -and ($leaf -match "\.(json|txt|ya?ml|psd1|ps1|config)(`$)")) {
        return $true
    }

    if ($leaf -match '^(id_rsa|id_dsa|id_ecdsa|id_ed25519)(\.pub)?$') {
        return $true
    }

    if ($leaf -match '\.(pem|pfx|p12|key)$') {
        return $true
    }

    return $false
}

function TestLikelyTextFile {
    param([string]$Path)

    $sampleSize = [Math]::Min(4096, (Get-Item -LiteralPath $Path).Length)
    if ($sampleSize -le 0) {
        return $true
    }

    $stream = [System.IO.File]::OpenRead($Path)
    try {
        $buffer = New-Object byte[] $sampleSize
        $read = $stream.Read($buffer, 0, $sampleSize)
        for ($i = 0; $i -lt $read; $i++) {
            if ($buffer[$i] -eq 0) {
                return $false
            }
        }
        return $true
    }
    finally {
        $stream.Dispose()
    }
}

function TestSecretContentScanExemptPath {
    param([string]$RelativePath)

    $entryName = ConvertToZipEntryName -RelativePath $RelativePath
    $lower = $entryName.ToLowerInvariant()
    $leaf = [System.IO.Path]::GetFileName($lower)

    if ($lower -match '(^|/)(docs|tests|test|__tests__|fixtures|mocks|examples?|보관문서|audits)/') {
        return $true
    }

    if ($leaf -match '(example|sample|placeholder|dummy|test|mock|fixture|contract)') {
        return $true
    }

    return $false
}

function TestSuspiciousSecretContent {
    param(
        [string]$Path,
        [string]$RelativePath
    )

    if (TestSecretContentScanExemptPath -RelativePath $RelativePath) {
        return $false
    }

    if (-not (TestLikelyTextFile -Path $Path)) {
        return $false
    }

    $fileInfo = Get-Item -LiteralPath $Path
    if ($fileInfo.Length -gt 1048576) {
        return $false
    }

    $content = Get-Content -LiteralPath $Path -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if ([string]::IsNullOrWhiteSpace($content)) {
        return $false
    }

    $secretPatterns = @(
        "-----BEGIN (RSA |DSA |EC |OPENSSH |)PRIVATE KEY-----",
        "(?i)\bBearer\s+[A-Za-z0-9._~+/=-]{32,}",
        "\bAKIA[0-9A-Z]{16}\b",
        '(?i)\bcloudflare[_-]?(api[_-]?)?token\b\s*[:=]\s*[\x22\x27][A-Za-z0-9_\-\.]{24,}[\x22\x27]',
        "(?i)(postgres|postgresql|mysql|mongodb)://[^/\s:@]+:[^@\s]+@",
        '(?i)\b(secret|api[_-]?key|access[_-]?token|auth[_-]?token|password|passwd|pwd|credential)\b\s*[:=]\s*[\x22\x27](?!\s*(example|sample|placeholder|dummy|test|mock|changeme|your-|<))[A-Za-z0-9_\-./+=@$!%*#?&]{16,}[\x22\x27]'
    )

    foreach ($pattern in $secretPatterns) {
        if ($content -match $pattern) {
            return $true
        }
    }

    return $false
}

function GetLocalRepoExportCandidateFiles {
    $gitFiles = @(InvokeLocalRepoGitOutput -Arguments @("ls-files", "-co", "--exclude-standard"))
    if ($LASTEXITCODE -ne 0) {
        throw "git ls-files 후보 목록 생성 실패"
    }

    $seen = @{}
    $files = New-Object System.Collections.Generic.List[object]

    foreach ($gitFile in $gitFiles) {
        $entryName = ConvertToZipEntryName -RelativePath ([string]$gitFile)
        if ([string]::IsNullOrWhiteSpace($entryName)) {
            continue
        }

        if ($seen.ContainsKey($entryName.ToLowerInvariant())) {
            continue
        }

        if (TestLocalRepoExportExcludedPath -RelativePath $entryName) {
            continue
        }

        $fullPath = Join-Path $ProjectDir ($entryName -replace '/', [System.IO.Path]::DirectorySeparatorChar)
        if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
            continue
        }

        $seen[$entryName.ToLowerInvariant()] = $true
        $files.Add([pscustomobject]@{
            FullName = [System.IO.Path]::GetFullPath($fullPath)
            EntryName = $entryName
        })
    }

    return $files.ToArray()
}

function InvokeLocalRepoGitOutput {
    param([string[]]$Arguments)

    return @(git `
        -c color.ui=false `
        -c core.pager=cat `
        -c core.quotepath=false `
        -c i18n.logOutputEncoding=utf-8 `
        -C $ProjectDir @Arguments 2>&1)
}

function GetPackageJsonVersionForLocalRepoExport {
    $packageJsonPath = Join-Path $ProjectDir "package.json"
    if (-not (Test-Path -LiteralPath $packageJsonPath)) {
        return "package.json 없음"
    }

    try {
        $packageJson = Get-Content -LiteralPath $packageJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
        return [string]$packageJson.version
    }
    catch {
        return "package.json version 확인 오류: $($_.Exception.Message)"
    }
}

function GetCanonicalPowerShellTrackedState {
    $relativePath = "tools/pipeline/peacebypiece-auto-pipeline.ps1"
    InvokeLocalRepoGitOutput -Arguments @("ls-files", "--error-unmatch", $relativePath) | Out-Null
    if ($LASTEXITCODE -eq 0) {
        return "tracked: $relativePath"
    }

    return "not tracked: $relativePath"
}

function AddRepoStateSection {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Title,
        [string[]]$Values,
        [string]$EmptyText = "(none)"
    )

    $Lines.Add($Title)
    if ($null -eq $Values -or $Values.Count -eq 0) {
        $Lines.Add($EmptyText)
    }
    else {
        foreach ($value in $Values) {
            $Lines.Add([string]$value)
        }
    }
    $Lines.Add("")
}

function GetLocalRepoVerificationField {
    param(
        [string[]]$Lines,
        [string]$Name
    )

    $prefix = "$Name`:"
    $line = $Lines | Where-Object { ([string]$_).StartsWith($prefix) } | Select-Object -First 1
    if ($null -eq $line) {
        return ""
    }

    return ([string]$line).Substring($prefix.Length).Trim()
}

function GetLocalRepoVerificationCommandResult {
    param(
        [string[]]$Lines,
        [string]$ResultName
    )

    $line = $Lines | Where-Object { ([string]$_).StartsWith("$ResultName`:") } | Select-Object -First 1
    if ($null -eq $line) {
        return [pscustomobject]@{
            Passed = ""
            Command = ""
            FindingCount = ""
            HighRiskCount = ""
        }
    }

    $text = [string]$line
    $passedMatch = [regex]::Match($text, 'Passed=([^;]+)')
    $commandMatch = [regex]::Match($text, 'Command=([^;]+)')
    $findingCountMatch = [regex]::Match($text, 'FindingCount=([^;]*)')
    $highRiskCountMatch = [regex]::Match($text, 'HighRiskCount=([^;]*)')

    $passed = if ($passedMatch.Success) { $passedMatch.Groups[1].Value.Trim() } else { "" }
    $command = if ($commandMatch.Success) { $commandMatch.Groups[1].Value.Trim() } else { "" }
    $findingCount = if ($findingCountMatch.Success) { $findingCountMatch.Groups[1].Value.Trim() } else { "" }
    $highRiskCount = if ($highRiskCountMatch.Success) { $highRiskCountMatch.Groups[1].Value.Trim() } else { "" }

    return [pscustomobject]@{
        Passed = $passed
        Command = $command
        FindingCount = $findingCount
        HighRiskCount = $highRiskCount
    }
}

function GetLocalRepoVerificationSummary {
    param(
        [string]$ResultPath,
        [string]$ProfileName
    )

    if ([string]::IsNullOrWhiteSpace($ResultPath) -or -not (Test-Path -LiteralPath $ResultPath -PathType Leaf)) {
        return [pscustomobject]@{
            Path = ""
            Profile = $ProfileName
            Result = "not provided"
            HeadHash = ""
            BuildPassed = ""
            BuildCommand = ""
            ExecutedAt = ""
            MutationFindingCount = ""
            MutationHighRiskCount = ""
            ContractSummary = "not provided"
        }
    }

    $lines = @(Get-Content -LiteralPath $ResultPath -Encoding UTF8)
    $build = GetLocalRepoVerificationCommandResult -Lines $lines -ResultName "npm run build"
    $mutation = GetLocalRepoVerificationCommandResult -Lines $lines -ResultName "npm run audit:wafl-mutations"
    $contracts = @($lines | Where-Object {
        $text = [string]$_
        $text -match 'contract:' -and $text -match 'Passed=True'
    })

    return [pscustomobject]@{
        Path = $ResultPath
        Profile = if ([string]::IsNullOrWhiteSpace($ProfileName)) { GetLocalRepoVerificationField -Lines $lines -Name "Profile" } else { $ProfileName }
        Result = if (($lines -join "`n") -match 'VERIFY_SAFE_RESULT:\s*(PASS|FAIL|CHECK_ONLY)') { $matches[1] } else { "unknown" }
        HeadHash = GetLocalRepoVerificationField -Lines $lines -Name "HeadHash"
        BuildPassed = $build.Passed
        BuildCommand = $build.Command
        ExecutedAt = GetLocalRepoVerificationField -Lines $lines -Name "ExecutedAt"
        MutationFindingCount = $mutation.FindingCount
        MutationHighRiskCount = $mutation.HighRiskCount
        ContractSummary = if ($contracts.Count -eq 0) { "none" } else { ($contracts | ForEach-Object { ([string]$_).Split(":")[0] }) -join ", " }
    }
}

function NewLocalRepoBuildResultFile {
    param(
        [string]$Version,
        [object]$VerificationSummary
    )

    EnsureDirectory -Path $RepoStatusDir
    $safeVersion = SanitizeResultFileNamePart -Value $Version
    $timestamp = GetTimestamp
    $buildResultPath = GetUniqueOutputPath -Directory $RepoStatusDir -FileNameWithoutExtension "build-result-$safeVersion-$timestamp" -Extension ".txt"
    $headHash = InvokeLocalRepoGitOutput -Arguments @("rev-parse", "HEAD") | Select-Object -First 1
    $statusShort = @(InvokeLocalRepoGitOutput -Arguments @("status", "--short"))

    $lines = New-Object System.Collections.Generic.List[string]
    AddRepoStateSection -Lines $lines -Title "APP_VERSION:" -Values @($Version)
    AddRepoStateSection -Lines $lines -Title "Branch:" -Values @(InvokeLocalRepoGitOutput -Arguments @("branch", "--show-current"))
    AddRepoStateSection -Lines $lines -Title "HEAD Hash:" -Values @([string]$headHash)
    AddRepoStateSection -Lines $lines -Title "Verification Profile:" -Values @([string]$VerificationSummary.Profile)
    AddRepoStateSection -Lines $lines -Title "Verification Result Path:" -Values @([string]$VerificationSummary.Path)
    AddRepoStateSection -Lines $lines -Title "Build Result:" -Values @($(if ($VerificationSummary.BuildPassed -eq "True") { "PASS" } elseif ($VerificationSummary.BuildPassed -eq "False") { "FAIL" } else { "unknown" }))
    AddRepoStateSection -Lines $lines -Title "Build Command:" -Values @([string]$VerificationSummary.BuildCommand)
    AddRepoStateSection -Lines $lines -Title "Executed At:" -Values @([string]$VerificationSummary.ExecutedAt)
    AddRepoStateSection -Lines $lines -Title "Mutation Audit Finding Count:" -Values @([string]$VerificationSummary.MutationFindingCount)
    AddRepoStateSection -Lines $lines -Title "Mutation Audit High Risk Count:" -Values @([string]$VerificationSummary.MutationHighRiskCount)
    AddRepoStateSection -Lines $lines -Title "Contract Test Summary:" -Values @([string]$VerificationSummary.ContractSummary)
    AddRepoStateSection -Lines $lines -Title "Package/Lockfile Changed:" -Values @("false")
    AddRepoStateSection -Lines $lines -Title "DB Migration:" -Values @("none")
    AddRepoStateSection -Lines $lines -Title "DB/R2 Executed:" -Values @("false")
    AddRepoStateSection -Lines $lines -Title "Final Git Status --short:" -Values $statusShort -EmptyText "clean"

    [System.IO.File]::WriteAllLines($buildResultPath, $lines, [System.Text.Encoding]::UTF8)
    return $buildResultPath
}

function NewLocalRepoStateFile {
    param(
        [string]$Version,
        [string]$ZipPath,
        [long]$ZipSizeBytes,
        [bool]$WorkingTreeClean,
        [object]$VerificationSummary,
        [string]$BuildResultPath
    )

    EnsureDirectory -Path $RepoStatusDir
    $safeVersion = SanitizeResultFileNamePart -Value $Version
    $timestamp = GetTimestamp
    $repoStatePath = GetUniqueOutputPath -Directory $RepoStatusDir -FileNameWithoutExtension "repo-state-$safeVersion-$timestamp" -Extension ".txt"

    $statusShort = @(InvokeLocalRepoGitOutput -Arguments @("status", "--short"))
    $staged = @($statusShort | Where-Object {
        $_.Length -ge 2 -and $_.Substring(0, 2) -ne "??" -and $_.Substring(0, 1) -ne " "
    })
    $unstaged = @($statusShort | Where-Object {
        $_.Length -ge 2 -and $_.Substring(0, 2) -ne "??" -and $_.Substring(1, 1) -ne " "
    })
    $untracked = @($statusShort | Where-Object { $_.StartsWith("??") })

    $aheadBehind = @(InvokeLocalRepoGitOutput -Arguments @("rev-list", "--left-right", "--count", "origin/master...HEAD"))
    $aheadBehindText = if ($aheadBehind.Count -gt 0 -and ([string]$aheadBehind[0]) -match '^\s*(\d+)\s+(\d+)\s*$') {
        "ahead $($matches[2]), behind $($matches[1])"
    }
    else {
        ($aheadBehind | Out-String).Trim()
    }

    $lines = New-Object System.Collections.Generic.List[string]

    if (-not $WorkingTreeClean) {
        $lines.Add("WARNING: WORKING TREE IS NOT CLEAN")
        $lines.Add("")
    }

    AddRepoStateSection -Lines $lines -Title "Generated At:" -Values @((Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
    AddRepoStateSection -Lines $lines -Title "Repository Path:" -Values @($ProjectDir)
    AddRepoStateSection -Lines $lines -Title "Branch:" -Values @(InvokeLocalRepoGitOutput -Arguments @("branch", "--show-current"))
    AddRepoStateSection -Lines $lines -Title "HEAD Hash:" -Values @(InvokeLocalRepoGitOutput -Arguments @("rev-parse", "HEAD"))
    AddRepoStateSection -Lines $lines -Title "HEAD Commit Message:" -Values @(InvokeLocalRepoGitOutput -Arguments @("log", "-1", "--pretty=%s"))
    AddRepoStateSection -Lines $lines -Title "Origin Master Hash:" -Values @(InvokeLocalRepoGitOutput -Arguments @("rev-parse", "origin/master"))
    AddRepoStateSection -Lines $lines -Title "Ahead / Behind:" -Values @($aheadBehindText)
    AddRepoStateSection -Lines $lines -Title "Working Tree Clean:" -Values @($(if ($WorkingTreeClean) { "true" } else { "false" }))
    AddRepoStateSection -Lines $lines -Title "Git Status --short:" -Values $statusShort -EmptyText "clean"
    AddRepoStateSection -Lines $lines -Title "Staged:" -Values $staged
    AddRepoStateSection -Lines $lines -Title "Unstaged:" -Values $unstaged
    AddRepoStateSection -Lines $lines -Title "Untracked:" -Values $untracked
    AddRepoStateSection -Lines $lines -Title "Recent Commits (5):" -Values @(InvokeLocalRepoGitOutput -Arguments @("log", "--oneline", "-5"))
    AddRepoStateSection -Lines $lines -Title "APP_VERSION:" -Values @($Version)
    AddRepoStateSection -Lines $lines -Title "package.json Version:" -Values @((GetPackageJsonVersionForLocalRepoExport))
    AddRepoStateSection -Lines $lines -Title "Canonical PowerShell Tracked State:" -Values @((GetCanonicalPowerShellTrackedState))
    AddRepoStateSection -Lines $lines -Title "Generated ZIP:" -Values @($ZipPath)
    AddRepoStateSection -Lines $lines -Title "ZIP Size Bytes:" -Values @([string]$ZipSizeBytes)
    AddRepoStateSection -Lines $lines -Title "Verification Result Path:" -Values @([string]$VerificationSummary.Path)
    AddRepoStateSection -Lines $lines -Title "Verification Profile:" -Values @([string]$VerificationSummary.Profile)
    AddRepoStateSection -Lines $lines -Title "Build Result:" -Values @($(if ($VerificationSummary.BuildPassed -eq "True") { "PASS" } elseif ($VerificationSummary.BuildPassed -eq "False") { "FAIL" } else { "unknown" }))
    AddRepoStateSection -Lines $lines -Title "Build Result Path:" -Values @($BuildResultPath)
    AddRepoStateSection -Lines $lines -Title "Mutation Audit Finding Count:" -Values @([string]$VerificationSummary.MutationFindingCount)
    AddRepoStateSection -Lines $lines -Title "Mutation Audit High Risk Count:" -Values @([string]$VerificationSummary.MutationHighRiskCount)
    AddRepoStateSection -Lines $lines -Title "DB Migration:" -Values @("none")
    AddRepoStateSection -Lines $lines -Title "DB/R2 Executed:" -Values @("false")
    AddRepoStateSection -Lines $lines -Title "Exclude Rule Summary:" -Values (GetLocalRepoExportExcludeSummary)

    [System.IO.File]::WriteAllLines($repoStatePath, $lines, [System.Text.Encoding]::UTF8)
    return $repoStatePath
}

function TestLocalRepoExportZip {
    param(
        [string]$ZipPath,
        [string[]]$ExpectedEntries
    )

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    try {
        $entryNames = @($archive.Entries | ForEach-Object { $_.FullName })
        $lowerEntryNames = @($entryNames | ForEach-Object { $_.ToLowerInvariant() })

        foreach ($entryName in $entryNames) {
            if (TestLocalRepoExportExcludedPath -RelativePath $entryName) {
                throw "ZIP 내부 제외 경로 발견: $entryName"
            }
        }

        foreach ($expectedEntry in $ExpectedEntries) {
            $normalized = (ConvertToZipEntryName -RelativePath $expectedEntry).ToLowerInvariant()
            if ($lowerEntryNames -notcontains $normalized) {
                throw "ZIP 내부 필수 파일 없음: $expectedEntry"
            }
        }

        return $true
    }
    finally {
        $archive.Dispose()
    }
}

function TestLocalRepoExportZipContract {
    param(
        [string]$ZipPath,
        [string[]]$ExpectedEntries
    )

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    try {
        $entryNames = @($archive.Entries | ForEach-Object { $_.FullName })
        $lowerEntryNames = @($entryNames | ForEach-Object { $_.ToLowerInvariant() })
        $blockedSegments = @(".git", "node_modules", ".next", ".wrangler", "artifacts", ".tmp", "test-results", "playwright-report", "reports")

        foreach ($entryName in $entryNames) {
            $segments = @($entryName.Trim("/") -split "/" | ForEach-Object { $_.ToLowerInvariant() })
            foreach ($segment in $segments) {
                if ($blockedSegments -contains $segment) {
                    throw "ZIP contract 실패: 중첩 제외 세그먼트 포함($entryName)"
                }
            }

            $leaf = [System.IO.Path]::GetFileName($entryName).ToLowerInvariant()
            if ($leaf -ne ".env.example" -and ($leaf -eq ".env" -or $leaf.StartsWith(".env."))) {
                throw "ZIP contract 실패: env 파일 포함($entryName)"
            }

            if ($leaf -like "*.zip" -or $leaf -like "repo-state-*.txt" -or $leaf -like "build-result-*.txt" -or $leaf -like "*.tsbuildinfo") {
                throw "ZIP contract 실패: 생성물 포함($entryName)"
            }
        }

        if ($lowerEntryNames -notcontains ".env.example") {
            throw "ZIP contract 실패: .env.example 누락"
        }

        foreach ($expectedEntry in $ExpectedEntries) {
            $normalized = (ConvertToZipEntryName -RelativePath $expectedEntry).ToLowerInvariant()
            if ($lowerEntryNames -notcontains $normalized) {
                throw "ZIP contract 실패: 필수 파일 누락($expectedEntry)"
            }
        }

        return $true
    }
    finally {
        $archive.Dispose()
    }
}

function PublishLocalRepoHandoffNewestSet {
    param(
        [string]$ZipPath,
        [string]$RepoStatePath,
        [string]$BuildResultPath,
        [string]$Version,
        [string]$HeadHash
    )

    EnsureDirectory -Path $NewestResultDIr
    Get-ChildItem -LiteralPath $NewestResultDIr -Force -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item -LiteralPath $_.FullName -Recurse -Force
    }

    foreach ($sourcePath in @($ZipPath, $RepoStatePath, $BuildResultPath)) {
        if ([string]::IsNullOrWhiteSpace($sourcePath) -or -not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
            throw "4. Newest publication source missing: $sourcePath"
        }
        $item = Get-Item -LiteralPath $sourcePath
        if ($item.Length -le 0) {
            throw "4. Newest publication source is empty: $sourcePath"
        }
        Copy-Item -LiteralPath $sourcePath -Destination (Join-Path $NewestResultDIr $item.Name) -Force
    }

    $newestZip = Get-ChildItem -LiteralPath $NewestResultDIr -File -Filter "peacebypiece-ui-$Version*.zip" -ErrorAction SilentlyContinue
    $newestRepoState = Get-ChildItem -LiteralPath $NewestResultDIr -File -Filter "repo-state-$Version-*.txt" -ErrorAction SilentlyContinue
    $newestBuildResult = Get-ChildItem -LiteralPath $NewestResultDIr -File -Filter "build-result-$Version-*.txt" -ErrorAction SilentlyContinue

    if ($newestZip.Count -ne 1 -or $newestRepoState.Count -ne 1 -or $newestBuildResult.Count -ne 1) {
        throw "4. Newest set contract failed. ZIP=$($newestZip.Count) repo-state=$($newestRepoState.Count) build-result=$($newestBuildResult.Count)"
    }

    foreach ($textPath in @($newestRepoState[0].FullName, $newestBuildResult[0].FullName)) {
        $content = Get-Content -LiteralPath $textPath -Raw -Encoding UTF8
        if ($content -notmatch [regex]::Escape($Version)) {
            throw "4. Newest APP_VERSION mismatch: $textPath"
        }
        if ($content -notmatch [regex]::Escape($HeadHash)) {
            throw "4. Newest HEAD mismatch: $textPath"
        }
    }
}

function NewLocalRepositoryHandoff {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Stop"

    try {
    Write-Host ""
    Write-Host "========================================================="
    Write-Host "현재 저장소 ZIP + repo-state 생성" -ForegroundColor Cyan
    Write-Host "========================================================="
    LogInfo "read/export-only 메뉴입니다. Build, 다운로드, Git 변경, DB/R2 접근을 수행하지 않습니다."

    $initialStatusShort = @(InvokeLocalRepoGitOutput -Arguments @("status", "--short"))
    $workingTreeClean = $initialStatusShort.Count -eq 0

    if (-not $workingTreeClean) {
        LogWarn "WARNING: WORKING TREE IS NOT CLEAN"
    }

    $version = SanitizeResultFileNamePart -Value (GetProjectAppVersionForTestResult)
    EnsureDirectory -Path $BuildZipDir
    EnsureDirectory -Path $RepoStatusDir

    $zipPath = GetUniqueOutputPath -Directory $BuildZipDir -FileNameWithoutExtension "peacebypiece-ui-$version" -Extension ".zip"
    $candidateFiles = @(GetLocalRepoExportCandidateFiles)
    $exportFiles = New-Object System.Collections.Generic.List[object]
    $suspiciousSecretPaths = New-Object System.Collections.Generic.List[string]

    foreach ($file in $candidateFiles) {
        $entryName = ConvertToZipEntryName -RelativePath $file.EntryName

        if (TestLocalRepoExportExcludedPath -RelativePath $entryName) {
            continue
        }

        if (TestSuspiciousSecretExportCandidate -RelativePath $entryName) {
            $suspiciousSecretPaths.Add($entryName)
            continue
        }

        if (TestSuspiciousSecretContent -Path $file.FullName -RelativePath $entryName) {
            $suspiciousSecretPaths.Add($entryName)
            continue
        }

        $exportFiles.Add([pscustomobject]@{
            FullName = $file.FullName
            EntryName = $entryName
        })
    }

    if ($suspiciousSecretPaths.Count -gt 0) {
        LogError "secret/token 의심 파일이 ZIP 후보에서 발견되어 생성을 중단합니다."
        foreach ($path in $suspiciousSecretPaths) {
            Write-Host " - $path"
        }
        return $null
    }

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zipStream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
    $archive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($file in $exportFiles) {
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $archive,
                $file.FullName,
                $file.EntryName,
                [System.IO.Compression.CompressionLevel]::Optimal
            ) | Out-Null
        }
    }
    finally {
        $archive.Dispose()
        $zipStream.Dispose()
    }

    $requiredEntries = @(
        "AGENTS.md",
        "lib/constants/version.ts",
        "docs/codex-current-state.md",
        "tools/pipeline/peacebypiece-auto-pipeline.ps1",
        "package.json"
    )
    TestLocalRepoExportZip -ZipPath $zipPath -ExpectedEntries $requiredEntries | Out-Null
    TestLocalRepoExportZipContract -ZipPath $zipPath -ExpectedEntries $requiredEntries | Out-Null

    $zipItem = Get-Item -LiteralPath $zipPath
    $verificationSummary = GetLocalRepoVerificationSummary -ResultPath $VerificationResultPath -ProfileName $VerificationProfile
    $buildResultPath = NewLocalRepoBuildResultFile -Version $version -VerificationSummary $verificationSummary
    $repoStatePath = NewLocalRepoStateFile -Version $version -ZipPath $zipPath -ZipSizeBytes $zipItem.Length -WorkingTreeClean $workingTreeClean -VerificationSummary $verificationSummary -BuildResultPath $buildResultPath

    $repoStateContent = Get-Content -LiteralPath $repoStatePath -Raw -Encoding UTF8
    foreach ($requiredText in @("Generated At:", "Repository Path:", "Branch:", "HEAD Hash:", "APP_VERSION:", "Generated ZIP:", "Verification Result Path:", "Build Result:", "Exclude Rule Summary:")) {
        if ($repoStateContent -notmatch [regex]::Escape($requiredText)) {
            throw "repo-state 내용 검사 실패: $requiredText"
        }
    }

    $finalStatusShort = @(InvokeLocalRepoGitOutput -Arguments @("status", "--short"))
    $gitStatusUnchanged = (($initialStatusShort -join "`n") -eq ($finalStatusShort -join "`n"))
    if (-not $gitStatusUnchanged) {
        LogWarn "생성 후 Git working tree 상태가 시작 시점과 달라졌습니다."
    }

    $headHash = [string](InvokeLocalRepoGitOutput -Arguments @("rev-parse", "HEAD") | Select-Object -First 1)
    PublishLocalRepoHandoffNewestSet -ZipPath $zipPath -RepoStatePath $repoStatePath -BuildResultPath $buildResultPath -Version $version -HeadHash $headHash

    Write-Host ""
    LogInfo "ZIP 전체 경로: $zipPath"
    LogInfo "repo-state 전체 경로: $repoStatePath"
    LogInfo "build-result 전체 경로: $buildResultPath"
    LogInfo "4. Newest 경로: $NewestResultDIr"
    LogInfo "ZIP 크기: $($zipItem.Length) bytes"
    LogInfo "APP_VERSION: $version"
    LogInfo "Git clean 여부: $workingTreeClean"
    LogInfo "ChatGPT 업로드 파일 1: $(Split-Path -Leaf $zipPath)"
    LogInfo "ChatGPT 업로드 파일 2: $(Split-Path -Leaf $repoStatePath)"
    LogInfo "ChatGPT 업로드 파일 3: $(Split-Path -Leaf $buildResultPath)"

    Write-Host ""
    Write-Host "Enter를 누르면 개발 / 테스트 도구 메뉴로 돌아갑니다."
    if (-not $CreateLocalRepoHandoff) {
        [Console]::ReadLine() | Out-Null
    }

    return [pscustomobject]@{
        ZipPath = $zipPath
        RepoStatePath = $repoStatePath
        BuildResultPath = $buildResultPath
        ZipSizeBytes = $zipItem.Length
        AppVersion = $version
        GitClean = $workingTreeClean
        GitStatusUnchanged = $gitStatusUnchanged
    }
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
}

function GetProjectAppVersionForTestResult {
    $candidatePaths = @(
        (Join-Path $ProjectDir "lib\constants\app.ts"),
        (Join-Path $ProjectDir "lib\constants\version.ts")
    )

    foreach ($candidatePath in $candidatePaths) {
        if (-not (Test-Path -LiteralPath $candidatePath)) {
            continue
        }

        try {
            $content = ReadUtf8Text -Path $candidatePath
            $pattern = '(?m)^\s*export\s+const\s+APP_VERSION\s*=\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]\s*;?'
            $match = [regex]::Match($content, $pattern)

            if ($match.Success) {
                return $match.Groups[1].Value.Trim()
            }
        }
        catch {
            continue
        }
    }

    return "unknown-version"
}

function WaitForDeveloperToolsMenu {
    Write-Host ""
    Write-Host "========================================================="
    Write-Host "Enter를 누르면 개발 / 테스트 도구 메뉴로 돌아갑니다."
    [Console]::ReadLine() | Out-Null
}

function InvokeProjectCommandWithResultFile {
    param(
        [string]$Title,
        [string]$Label,
        [string]$NpmCommand,
        [bool]$LoadEnvLocal = $false,
        [bool]$PauseAfter = $true
    )

    cls
    Write-Host "========================================================="
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "========================================================="

    if (-not (Test-Path -LiteralPath $ProjectDir)) {
        LogError "프로젝트 루트 경로를 찾을 수 없습니다: $ProjectDir"
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 1
    }

    if ($LoadEnvLocal) {
        $envLoaded = LoadEnvLocalForSmokeTest

        if (-not $envLoaded) {
            if ($PauseAfter) { WaitForDeveloperToolsMenu }
            return 1
        }
    }

    EnsureDirectory -Path $NewestResultDIr

    $versionForFile = SanitizeResultFileNamePart -Value (GetProjectAppVersionForTestResult)
    $labelForFile = SanitizeResultFileNamePart -Value $Label
    $timestamp = GetTimestamp
    $runningFileName = "Running_${labelForFile}_${versionForFile}-${timestamp}.txt"
    $runningFilePath = Join-Path $NewestResultDIr $runningFileName

    @(
        "Test: $Title",
        "Command: $NpmCommand",
        "ProjectVersion: $versionForFile",
        "StartedAt: $timestamp",
        "ProjectDir: $ProjectDir",
        ""
    ) | Set-Content -LiteralPath $runningFilePath -Encoding UTF8

    Write-Host ""
    LogInfo "$NpmCommand 실행 중..."
    LogInfo "결과 파일: $runningFilePath"
    Write-Host ""

    Push-Location $ProjectDir

    try {
        $cmdLine = "chcp 65001 > nul & $NpmCommand >> `"$runningFilePath`" 2>&1"
        & cmd.exe /d /c $cmdLine
        $testExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    $finishedTimestamp = GetTimestamp
    Add-Content -LiteralPath $runningFilePath -Encoding UTF8 -Value ""
    Add-Content -LiteralPath $runningFilePath -Encoding UTF8 -Value "FinishedAt: $finishedTimestamp"
    Add-Content -LiteralPath $runningFilePath -Encoding UTF8 -Value "ExitCode: $testExitCode"

    if ($testExitCode -eq 0) {
        $statusPrefix = "OK"
    }
    else {
        $statusPrefix = "Failed"
    }

    $resultFileName = "${statusPrefix}_${labelForFile}_${versionForFile}-${timestamp}.txt"
    $resultFilePath = Join-Path $NewestResultDIr $resultFileName
    Move-Item -LiteralPath $runningFilePath -Destination $resultFilePath -Force

    Write-Host ""

    if ($testExitCode -eq 0) {
        LogInfo "$Title 완료. ExitCode: $testExitCode"
    }
    else {
        LogError "$Title 실패. ExitCode: $testExitCode"
    }

    LogInfo "결과 파일 저장 완료: $resultFilePath"

    Write-Host ""
    Write-Host "========================================================="
    Write-Host "검사 결과 출력"
    Write-Host "========================================================="
    Get-Content -LiteralPath $resultFilePath -Encoding UTF8 | ForEach-Object { Write-Host $_ }

    if ($PauseAfter) {
        WaitForDeveloperToolsMenu
    }

    return [int]$testExitCode
}

function RunWaflUiSourceAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "WAFL UI Source Audit" -Label "Audit" -NpmCommand "npm run audit:wafl-ui" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function RunWaflMutationAsyncAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "WAFL Mutation Async Audit" -Label "Mutation_Audit" -NpmCommand "npm run audit:wafl-mutations" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function RunDbApiE2ETest {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "DB/API E2E Test" -Label "E2E" -NpmCommand "npm run test:e2e" -LoadEnvLocal $true -PauseAfter $PauseAfter)
}

function RunDbApiSmokeTest {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "DB/API Smoke Test" -Label "Smoke" -NpmCommand "npm run test:smoke:db-api" -LoadEnvLocal $true -PauseAfter $PauseAfter)
}

function RunDbApiPermissionsTest {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "DB/API Permissions Test" -Label "Permissions" -NpmCommand "npm run test:permissions" -LoadEnvLocal $true -PauseAfter $PauseAfter)
}

function RunFunctionsDbContractTest {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Functions DB Contract Test" -Label "Functions_DB_Contract" -NpmCommand "npm run test:functions:db-contract" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function RunFunctionsCoreE2ETest {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Functions Core E2E Test" -Label "Functions_Core_E2E" -NpmCommand "npm run test:e2e:functions-core" -LoadEnvLocal $true -PauseAfter $PauseAfter)
}

function RunFunctionsResponsiveE2ETest {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Functions Responsive E2E Test" -Label "Functions_Responsive_E2E" -NpmCommand "npm run test:e2e:functions-responsive" -LoadEnvLocal $true -PauseAfter $PauseAfter)
}

function RunFunctionsTestDataSummary {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Functions Test Data Summary" -Label "Functions_Data_Summary" -NpmCommand "npm run test:data:functions" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function RunFunctionsSeedDryRun {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Functions Seed Dry-run" -Label "Functions_Seed_DryRun" -NpmCommand "npm run test:data:functions:seed" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function RunFunctionsCleanupDryRun {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Functions Cleanup Dry-run" -Label "Functions_Cleanup_DryRun" -NpmCommand "npm run test:data:functions:cleanup" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function RunFunctionsPerformanceTest {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Functions Performance Baseline" -Label "Functions_Performance" -NpmCommand "npm run test:functions:performance" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function RunFunctionsStorageContractTest {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Functions Storage Contract Test" -Label "Functions_Storage_Contract" -NpmCommand "npm run test:functions:storage" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function RunFunctionsStorageReconcileDryRun {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Functions R2 Usage Reconcile Dry-run" -Label "Functions_R2_Reconcile_DryRun" -NpmCommand "npm run test:functions:storage:reconcile" -LoadEnvLocal $true -PauseAfter $PauseAfter)
}

function RunFunctionsPdfContractTest {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Functions PDF Contract Test" -Label "Functions_PDF_Contract" -NpmCommand "npm run test:functions:pdf-contract" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function RunFunctionsPdfMockReport {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Functions PDF Mock Report" -Label "Functions_PDF_Mock" -NpmCommand "npm run test:functions:pdf-mock" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function RunFunctionsEnvironmentSafetyAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Functions Environment Safety Audit" -Label "Functions_Environment_Audit" -NpmCommand "npm run test:functions:environment" -LoadEnvLocal $true -PauseAfter $PauseAfter)
}

function RunSimulatorR2Plan {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Simulator R2 Plan" -Label "Simulator_R2_Plan" -NpmCommand "npm run simulator:r2:plan" -LoadEnvLocal $true -PauseAfter $PauseAfter)
}

function RunSimulatorR2LocalGenerate {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Simulator R2 Local Generate" -Label "Simulator_R2_Local_Generate" -NpmCommand "npm run simulator:r2:generate" -LoadEnvLocal $true -PauseAfter $PauseAfter)
}

function RunSimulatorR2LocalCleanup {
    param([bool]$PauseAfter = $true)

    cls
    Write-Host "========================================================="
    Write-Host "Simulator R2 Local Cleanup" -ForegroundColor Yellow
    Write-Host "========================================================="
    LogWarn "다음 로컬 임시 폴더만 삭제합니다."
    Write-Host "- .tmp/simulator/r2/files"
    Write-Host "- .tmp/simulator/r2/manifests"
    Write-Host "DB와 실제 R2 객체는 변경하지 않습니다."
    $confirm = Read-Host "계속하려면 CLEAN LOCAL R2 를 입력하세요"
    if ($confirm -ne "CLEAN LOCAL R2") {
        LogWarn "Simulator R2 Local Cleanup 실행을 취소했습니다."
        Start-Sleep -Seconds 1
        return $false
    }

    return (InvokeProjectCommandWithResultFile -Title "Simulator R2 Local Cleanup" -Label "Simulator_R2_Local_Cleanup" -NpmCommand "npm run simulator:r2:cleanup-local" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}


function RunSimulatorAdapterContract {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Simulator Adapter Contract" -Label "Simulator_Adapter_Contract" -NpmCommand "npm run simulator:adapter:contract" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function RunSimulatorAdapterPlan {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Simulator Adapter Plan" -Label "Simulator_Adapter_Plan" -NpmCommand "npm run simulator:adapter:plan" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function RunSimulatorDbAdapterContract {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Simulator DB Adapter Contract" -Label "Simulator_DB_Adapter_Contract" -NpmCommand "npm run simulator:db:contract" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function ConfirmFunctionsDataExecute {
    param(
        [string]$ActionName,
        [string]$ConfirmText
    )

    cls
    Write-Host "========================================================="
    Write-Host $ActionName -ForegroundColor Yellow
    Write-Host "========================================================="
    LogWarn "이 작업은 dev/test 전용이며 실제 테스트 데이터를 변경할 수 있습니다."
    LogWarn "production 환경에서는 실행하면 안 됩니다."
    LogWarn "계속하려면 $ConfirmText 을 정확히 입력하세요."
    $confirm = Read-Host "확인 입력"

    if ($confirm -ne $ConfirmText) {
        LogWarn "$ActionName 실행을 취소했습니다."
        Start-Sleep -Seconds 1
        return $false
    }

    return $true
}

function RunFunctionsSeedExecute {
    if (-not (ConfirmFunctionsDataExecute -ActionName "Simulator DB Seed Execute" -ConfirmText "SEED WAF-FN")) {
        return
    }

    $previousEnable = $env:WAFL_SIMULATOR_ENABLE_DB_MUTATION
    $previousConfirm = $env:WAFL_SIMULATOR_CONFIRM
    $previousApprovedFingerprint = $env:WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT
    $previousTestPrefix = $env:WAFL_FUNCTIONS_TEST_PREFIX
    try {
        $approvedFingerprint = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        if ([string]::IsNullOrWhiteSpace($approvedFingerprint)) {
            throw "pipeline.config.psd1에 Simulator.ApprovedDbFingerprint가 설정되지 않았습니다."
        }
        $env:WAFL_SIMULATOR_ENABLE_DB_MUTATION = "1"
        $env:WAFL_SIMULATOR_CONFIRM = "SEED WAF-FN"
        $env:WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT = $approvedFingerprint
        $env:WAFL_FUNCTIONS_TEST_PREFIX = [string]$PipelineConfig.Simulator.TestPrefix
        InvokeProjectCommandWithResultFile -Title "Simulator DB Seed Execute" -Label "Simulator_DB_Seed_Execute" -NpmCommand "npm run simulator:db:seed:execute" -LoadEnvLocal $true -PauseAfter $true | Out-Null
    }
    finally {
        if ($null -eq $previousEnable) { Remove-Item Env:WAFL_SIMULATOR_ENABLE_DB_MUTATION -ErrorAction SilentlyContinue } else { $env:WAFL_SIMULATOR_ENABLE_DB_MUTATION = $previousEnable }
        if ($null -eq $previousConfirm) { Remove-Item Env:WAFL_SIMULATOR_CONFIRM -ErrorAction SilentlyContinue } else { $env:WAFL_SIMULATOR_CONFIRM = $previousConfirm }
        if ($null -eq $previousApprovedFingerprint) { Remove-Item Env:WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT = $previousApprovedFingerprint }
        if ($null -eq $previousTestPrefix) { Remove-Item Env:WAFL_FUNCTIONS_TEST_PREFIX -ErrorAction SilentlyContinue } else { $env:WAFL_FUNCTIONS_TEST_PREFIX = $previousTestPrefix }
    }
}

function RunFunctionsCleanupExecute {
    if (-not (ConfirmFunctionsDataExecute -ActionName "Simulator DB Cleanup Execute" -ConfirmText "CLEANUP WAF-FN")) {
        return
    }

    $previousEnable = $env:WAFL_SIMULATOR_ENABLE_DB_MUTATION
    $previousConfirm = $env:WAFL_SIMULATOR_CONFIRM
    $previousApprovedFingerprint = $env:WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT
    $previousTestPrefix = $env:WAFL_FUNCTIONS_TEST_PREFIX
    try {
        $approvedFingerprint = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        if ([string]::IsNullOrWhiteSpace($approvedFingerprint)) {
            throw "pipeline.config.psd1에 Simulator.ApprovedDbFingerprint가 설정되지 않았습니다."
        }
        $env:WAFL_SIMULATOR_ENABLE_DB_MUTATION = "1"
        $env:WAFL_SIMULATOR_CONFIRM = "CLEANUP WAF-FN"
        $env:WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT = $approvedFingerprint
        $env:WAFL_FUNCTIONS_TEST_PREFIX = [string]$PipelineConfig.Simulator.TestPrefix
        InvokeProjectCommandWithResultFile -Title "Simulator DB Cleanup Execute" -Label "Simulator_DB_Cleanup_Execute" -NpmCommand "npm run simulator:db:cleanup:execute" -LoadEnvLocal $true -PauseAfter $true | Out-Null
    }
    finally {
        if ($null -eq $previousEnable) { Remove-Item Env:WAFL_SIMULATOR_ENABLE_DB_MUTATION -ErrorAction SilentlyContinue } else { $env:WAFL_SIMULATOR_ENABLE_DB_MUTATION = $previousEnable }
        if ($null -eq $previousConfirm) { Remove-Item Env:WAFL_SIMULATOR_CONFIRM -ErrorAction SilentlyContinue } else { $env:WAFL_SIMULATOR_CONFIRM = $previousConfirm }
        if ($null -eq $previousApprovedFingerprint) { Remove-Item Env:WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT = $previousApprovedFingerprint }
        if ($null -eq $previousTestPrefix) { Remove-Item Env:WAFL_FUNCTIONS_TEST_PREFIX -ErrorAction SilentlyContinue } else { $env:WAFL_FUNCTIONS_TEST_PREFIX = $previousTestPrefix }
    }
}

function ConfirmDevServerStoppedForBuild {
    $runningProcess = GetDevServerProcess

    if ($null -eq $runningProcess) {
        return $true
    }

    Write-Host ""
    LogWarn "npm run dev가 실행 중입니다. PID: $($runningProcess.Id)"
    $answer = Read-Host "dev 서버를 종료하고 빌드하시겠습니까? (Y/N)"

    if ($answer -notmatch '^[Yy]$') {
        LogWarn "수동 빌드를 취소했습니다."
        return $false
    }

    StopDevServerBackground
    return ($null -eq (GetDevServerProcess))
}

function RunManualNpmBuild {
    param([bool]$PauseAfter = $true)

    cls
    Write-Host "========================================================="
    Write-Host "NPM Build" -ForegroundColor Cyan
    Write-Host "========================================================="

    if (-not (Test-Path -LiteralPath $ProjectDir)) {
        LogError "프로젝트 루트 경로를 찾을 수 없습니다: $ProjectDir"
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 1
    }

    if (-not (ConfirmDevServerStoppedForBuild)) {
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 1
    }

    $version = SanitizeResultFileNamePart -Value (GetProjectAppVersionForTestResult)
    $exitCode = InvokeNpmBuild -Version $version -CopyLogToNewest $true -ThrowOnFailure $false

    if ($PauseAfter) {
        WaitForDeveloperToolsMenu
    }

    return [int]$exitCode
}

function RunAllQualityChecks {
    cls
    Write-Host "========================================================="
    Write-Host "전체 검사" -ForegroundColor Cyan
    Write-Host "========================================================="
    Write-Host "1. WAFL UI Source Audit"
    Write-Host "2. WAFL Mutation Async Audit"
    Write-Host "3. NPM Build"
    Write-Host "4. DB/API Smoke Test"
    Write-Host "5. DB/API Permissions Test"
    Write-Host "6. DB/API E2E Test"
    Write-Host "========================================================="
    Write-Host ""

    $auditExitCode = RunWaflUiSourceAudit -PauseAfter $false
    if ($auditExitCode -ne 0) {
        LogError "전체 검사 중단: WAFL UI Source Audit 실패"
        WaitForDeveloperToolsMenu
        return
    }

    $mutationAuditExitCode = RunWaflMutationAsyncAudit -PauseAfter $false
    if ($mutationAuditExitCode -ne 0) {
        LogError "전체 검사 중단: WAFL Mutation Async Audit 실패"
        WaitForDeveloperToolsMenu
        return
    }

    $buildExitCode = RunManualNpmBuild -PauseAfter $false
    if ($buildExitCode -ne 0) {
        LogError "전체 검사 중단: NPM Build 실패 또는 취소"
        WaitForDeveloperToolsMenu
        return
    }

    $smokeExitCode = RunDbApiSmokeTest -PauseAfter $false
    if ($smokeExitCode -ne 0) {
        LogError "전체 검사 중단: DB/API Smoke Test 실패"
        WaitForDeveloperToolsMenu
        return
    }

    $permissionsExitCode = RunDbApiPermissionsTest -PauseAfter $false
    if ($permissionsExitCode -ne 0) {
        LogError "전체 검사 중단: DB/API Permissions Test 실패"
        WaitForDeveloperToolsMenu
        return
    }

    $e2eExitCode = RunDbApiE2ETest -PauseAfter $false
    if ($e2eExitCode -ne 0) {
        LogError "전체 검사 실패: DB/API E2E Test 실패"
        WaitForDeveloperToolsMenu
        return
    }

    Write-Host ""
    LogInfo "전체 검사가 모두 통과했습니다."
    WaitForDeveloperToolsMenu
}


# ==========================================
# 9-3. Reset Database Schema 실행 함수
# ==========================================

function ResolveProjectSqlFilePath {
    param([string]$InputPath)

    if ([string]::IsNullOrWhiteSpace($InputPath)) {
        return $null
    }

    $trimmedPath = $InputPath.Trim().Trim('"').Trim("'")

    if ([string]::IsNullOrWhiteSpace($trimmedPath)) {
        return $null
    }

    if ([System.IO.Path]::IsPathRooted($trimmedPath)) {
        return $trimmedPath
    }

    return (Join-Path $ProjectDir $trimmedPath)
}

function GetDefaultFullResetSqlPath {
    $candidatePaths = @(
        (Join-Path $ProjectDir "db\schema\full_reset.sql")
    )

    foreach ($candidatePath in $candidatePaths) {
        if (Test-Path -LiteralPath $candidatePath) {
            return $candidatePath
        }
    }

    return $candidatePaths[0]
}

function QuoteCmdArgument {
    param([string]$Value)

    if ($null -eq $Value) {
        return '""'
    }

    return '"' + ($Value -replace '"', '\"') + '"'
}

function InvokeResetDatabaseSchema {
    cls
    Write-Host "========================================================="
    Write-Host "Reset Database Schema"
    Write-Host "========================================================="

    if (-not (Test-Path -LiteralPath $ProjectDir)) {
        LogError "프로젝트 루트 경로를 찾을 수 없습니다: $ProjectDir"
        Write-Host ""
        Write-Host "Enter를 누르면 개발 / 테스트 도구 메뉴로 돌아갑니다."
        [Console]::ReadLine() | Out-Null
        return
    }

    $envLoaded = LoadEnvLocalForSmokeTest

    if (-not $envLoaded) {
        Write-Host ""
        Write-Host "Enter를 누르면 개발 / 테스트 도구 메뉴로 돌아갑니다."
        [Console]::ReadLine() | Out-Null
        return
    }

    if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
        LogError "DATABASE_URL 환경변수가 비어 있어 Reset Database Schema를 실행할 수 없습니다."
        Write-Host ""
        Write-Host "Enter를 누르면 개발 / 테스트 도구 메뉴로 돌아갑니다."
        [Console]::ReadLine() | Out-Null
        return
    }

    $runnerPath = Join-Path $ProjectDir "scripts\run-sql-files.mjs"

    if (-not (Test-Path -LiteralPath $runnerPath)) {
        LogError "SQL 실행 스크립트를 찾을 수 없습니다: $runnerPath"
        LogWarn "scripts\run-sql-files.mjs 파일을 프로젝트에 추가한 뒤 다시 실행하세요."
        Write-Host ""
        Write-Host "Enter를 누르면 개발 / 테스트 도구 메뉴로 돌아갑니다."
        [Console]::ReadLine() | Out-Null
        return
    }

    $nodeCheckOutput = & cmd.exe /d /c "node --version" 2>&1

    if ($LASTEXITCODE -ne 0) {
        LogError "node 명령을 실행할 수 없습니다. Node.js 설치 또는 PATH를 확인하세요."
        Write-Host $nodeCheckOutput
        Write-Host ""
        Write-Host "Enter를 누르면 개발 / 테스트 도구 메뉴로 돌아갑니다."
        [Console]::ReadLine() | Out-Null
        return
    }

    $sqlFiles = New-Object System.Collections.Generic.List[string]
    $sqlFiles.Add((GetDefaultFullResetSqlPath))

    $defaultAdditionalSqlPaths = @(
        "db\test\scenario_seed.sql",
        "db\test\scenario_google_login_seed.sql",
        "db\seed\system_admin_bootstrap_kty872.sql"
    )

    foreach ($defaultAdditionalSqlPath in $defaultAdditionalSqlPaths) {
        $resolvedPath = ResolveProjectSqlFilePath -InputPath $defaultAdditionalSqlPath

        if (-not [string]::IsNullOrWhiteSpace($resolvedPath)) {
            $sqlFiles.Add($resolvedPath)
        }
    }

    Write-Host ""
    Write-Host "기본 실행 SQL: db\full_reset.sql"
    Write-Host "고정 추가 실행 SQL:"

    foreach ($defaultAdditionalSqlPath in $defaultAdditionalSqlPaths) {
        Write-Host "- $defaultAdditionalSqlPath"
    }

    Write-Host ""
    Write-Host "실행 대상 SQL 파일:"

    foreach ($sqlFile in $sqlFiles) {
        Write-Host "- $sqlFile"
    }

    $missingSqlFiles = @()

    foreach ($sqlFile in $sqlFiles) {
        if (-not (Test-Path -LiteralPath $sqlFile)) {
            $missingSqlFiles += $sqlFile
        }
    }

    if ($missingSqlFiles.Count -gt 0) {
        Write-Host ""
        LogError "존재하지 않는 SQL 파일이 있습니다."

        foreach ($missingSqlFile in $missingSqlFiles) {
            LogError "Missing: $missingSqlFile"
        }

        Write-Host ""
        Write-Host "Enter를 누르면 개발 / 테스트 도구 메뉴로 돌아갑니다."
        [Console]::ReadLine() | Out-Null
        return
    }

    Write-Host ""
    LogWarn "주의: DB schema/data reset이 실행됩니다."
    LogWarn "production 또는 검증 불명확 대상은 차단됩니다."
    LogWarn "계속하려면 RESET WAF-FN SCHEMA 를 정확히 입력하세요."
    $confirm = Read-Host "확인 입력"

    $runtimeForReset = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtimeForReset)) {
        $runtimeForReset = [string]$env:NODE_ENV
    }

    $testPrefixForReset = [string]$env:WAFL_FUNCTIONS_TEST_PREFIX
    if ([string]::IsNullOrWhiteSpace($testPrefixForReset)) {
        $testPrefixForReset = [string]$PipelineConfig.Simulator.TestPrefix
    }
    $guardResult = TestResetDatabaseSchemaGuard `
        -Runtime $runtimeForReset `
        -DatabaseUrl $env:DATABASE_URL `
        -ApprovedDbFingerprint ([string]$PipelineConfig.Simulator.ApprovedDbFingerprint) `
        -TestPrefix $testPrefixForReset `
        -AllowedRuntimes ([string[]]$PipelineConfig.Simulator.AllowedRuntimes) `
        -Confirmation $confirm `
        -ExpectedPrefix ([string]$PipelineConfig.Simulator.TestPrefix)

    Write-Host ""
    Write-Host "Reset guard verification"
    Write-Host "- Runtime: $($guardResult.Runtime)"
    Write-Host "- Target verification: $($guardResult.TargetVerification)"
    Write-Host "- Approved fingerprint match: $($guardResult.ApprovedFingerprintMatch)"
    Write-Host "- Prefix: $($guardResult.Prefix)"
    Write-Host "- Destructive: $($guardResult.Destructive)"
    Write-Host "- Production: $($guardResult.Production)"

    if (-not $guardResult.Passed) {
        LogWarn "Reset Database Schema 실행을 취소했습니다."
        LogWarn "검증 실패로 destructive SQL runner를 호출하지 않았습니다. ExitCode: $($guardResult.ExitCode)"
        Start-Sleep -Seconds 1
        return
    }

    EnsureDirectory -Path $NewestResultDIr

    $versionForFile = SanitizeResultFileNamePart -Value (GetProjectAppVersionForTestResult)
    $timestamp = GetTimestamp
    $runningFileName = "Running_ResetSchema_${versionForFile}-${timestamp}.txt"
    $runningFilePath = Join-Path $NewestResultDIr $runningFileName

    @(
        "Task: Reset Database Schema",
        "Command: node scripts/run-sql-files.mjs <sql files>",
        "ProjectVersion: $versionForFile",
        "StartedAt: $timestamp",
        "ProjectDir: $ProjectDir",
        "Guard:",
        "- Runtime: $($guardResult.Runtime)",
        "- Target verification: $($guardResult.TargetVerification)",
        "- Approved fingerprint match: $($guardResult.ApprovedFingerprintMatch)",
        "- Prefix: $($guardResult.Prefix)",
        "- Destructive: $($guardResult.Destructive)",
        "- Production: $($guardResult.Production)",
        "SqlFiles:",
        ($sqlFiles | ForEach-Object { "- $_" }),
        ""
    ) | Set-Content -LiteralPath $runningFilePath -Encoding UTF8

    Write-Host ""
    LogInfo "Reset Database Schema 실행 중..."
    LogInfo "결과 파일: $runningFilePath"
    Write-Host ""

    Push-Location $ProjectDir

    try {
        $quotedRunnerPath = QuoteCmdArgument -Value $runnerPath
        $quotedSqlFiles = ($sqlFiles | ForEach-Object { QuoteCmdArgument -Value $_ }) -join ' '
        $cmdLine = "chcp 65001 > nul & node $quotedRunnerPath $quotedSqlFiles >> `"$runningFilePath`" 2>&1"
        & cmd.exe /d /c $cmdLine
        $resetExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    $finishedTimestamp = GetTimestamp
    Add-Content -LiteralPath $runningFilePath -Encoding UTF8 -Value ""
    Add-Content -LiteralPath $runningFilePath -Encoding UTF8 -Value "FinishedAt: $finishedTimestamp"
    Add-Content -LiteralPath $runningFilePath -Encoding UTF8 -Value "ExitCode: $resetExitCode"

    if ($resetExitCode -eq 0) {
        $statusPrefix = "OK"
    }
    else {
        $statusPrefix = "Failed"
    }

    $resultFileName = "${statusPrefix}_ResetSchema_${versionForFile}-${timestamp}.txt"
    $resultFilePath = Join-Path $NewestResultDIr $resultFileName
    Move-Item -LiteralPath $runningFilePath -Destination $resultFilePath -Force

    Write-Host ""

    if ($resetExitCode -eq 0) {
        LogInfo "Reset Database Schema 완료. ExitCode: $resetExitCode"
    }
    else {
        LogError "Reset Database Schema 실패. ExitCode: $resetExitCode"
    }

    LogInfo "결과 파일 저장 완료: $resultFilePath"

    Write-Host ""
    Write-Host "========================================================="
    Write-Host "Reset Database Schema 결과 출력"
    Write-Host "========================================================="
    Get-Content -LiteralPath $resultFilePath -Encoding UTF8 | ForEach-Object { Write-Host $_ }

    Write-Host ""
    Write-Host "========================================================="
    Write-Host "Enter를 누르면 개발 / 테스트 도구 메뉴로 돌아갑니다."
    [Console]::ReadLine() | Out-Null
}


# ==========================================
# 10. 메인 화면 / 메인 while 루프
# ==========================================

function ShowDeveloperToolsMenu {
    while ($true) {
        cls
        Write-Host "========================================================="
        Write-Host "개발 / 테스트 도구" -ForegroundColor Cyan
        Write-Host "========================================================="
        Write-Host "[기존 핵심 검사]"
        Write-Host " 1. WAFL UI Source Audit                         [안전]"
        Write-Host " 2. NPM Build                                    [로컬 빌드]"
        Write-Host " 3. DB/API E2E Test                              [환경 필요]"
        Write-Host " 4. DB/API Smoke Test                            [환경 필요]"
        Write-Host " 5. DB/API Permissions Test                      [환경 필요]"
        Write-Host " 6. WAFL Mutation Async Audit                    [안전]"
        Write-Host " 7. 현재 저장소 ZIP + repo-state 생성            [read/export-only]"
        Write-Host " 8. 전체 검사 (기존 1~6 연속 실행)              [비파괴]"
        Write-Host " 9. Reset Database Schema                        [파괴적/이중 확인]"
        Write-Host ""
        Write-Host "[/functions 안전 검사·리포트]"
        Write-Host "10. Functions DB Contract Test                   [안전]"
        Write-Host "11. Functions Core E2E Test                      [환경 필요]"
        Write-Host "12. Functions Responsive E2E Test                [환경 필요]"
        Write-Host "13. Functions Test Data Summary                  [안전]"
        Write-Host "14. Functions Seed Dry-run                       [안전/변경 없음]"
        Write-Host "15. Functions Cleanup Dry-run                    [안전/변경 없음]"
        Write-Host "16. Functions Performance Baseline               [조건부 안전]"
        Write-Host "17. Functions Storage Contract Test              [안전]"
        Write-Host "18. Functions R2 Usage Reconcile Dry-run         [DEV/TEST]"
        Write-Host "19. Functions PDF Contract Test                  [안전]"
        Write-Host "20. Functions PDF Mock Report                    [안전/로컬 파일]"
        Write-Host "23. Functions Environment Safety Audit           [안전/설정 검사]"
        Write-Host ""
        Write-Host "[Simulator · 테스트 환경 준비]"
        Write-Host "24. Simulator R2 Plan                            [안전/변경 없음]"
        Write-Host "25. Simulator R2 Local Generate                  [안전/로컬 .tmp]"
        Write-Host "26. Simulator R2 Local Cleanup                   [로컬 삭제/확인]"
        Write-Host "27. Simulator Adapter Contract                   [안전/변경 없음]"
        Write-Host "28. Simulator Adapter Plan                       [안전/계획만]"
        Write-Host "29. Simulator DB Adapter Contract                [안전/변경 없음]"
        Write-Host ""
        Write-Host "[/functions 데이터 변경 작업]"
        Write-Host "21. Simulator DB Seed Execute                    [주의/DEV·TEST]"
        Write-Host "22. Simulator DB Cleanup Execute                 [파괴적/DEV·TEST]"
        Write-Host ""
        Write-Host " 0. 상위 메뉴로"
        Write-Host "========================================================="
        $choice = (Read-Host "번호를 입력하세요 (최대 2자리)").Trim()

        if ($choice -notmatch '^\d{1,2}$') {
            Write-Host "잘못된 입력입니다. 0~29 범위의 한 자리 또는 두 자리 숫자를 입력하세요."
            Start-Sleep -Seconds 1
            continue
        }

        switch ([int]$choice) {
            1  { RunWaflUiSourceAudit | Out-Null }
            2  { RunManualNpmBuild | Out-Null }
            3  { RunDbApiE2ETest | Out-Null }
            4  { RunDbApiSmokeTest | Out-Null }
            5  { RunDbApiPermissionsTest | Out-Null }
            6  { RunWaflMutationAsyncAudit | Out-Null }
            7  { NewLocalRepositoryHandoff | Out-Null }
            8  { RunAllQualityChecks }
            9  { InvokeResetDatabaseSchema }
            10 { RunFunctionsDbContractTest | Out-Null }
            11 { RunFunctionsCoreE2ETest | Out-Null }
            12 { RunFunctionsResponsiveE2ETest | Out-Null }
            13 { RunFunctionsTestDataSummary | Out-Null }
            14 { RunFunctionsSeedDryRun | Out-Null }
            15 { RunFunctionsCleanupDryRun | Out-Null }
            16 { RunFunctionsPerformanceTest | Out-Null }
            17 { RunFunctionsStorageContractTest | Out-Null }
            18 { RunFunctionsStorageReconcileDryRun | Out-Null }
            19 { RunFunctionsPdfContractTest | Out-Null }
            20 { RunFunctionsPdfMockReport | Out-Null }
            21 { RunFunctionsSeedExecute }
            22 { RunFunctionsCleanupExecute }
            23 { RunFunctionsEnvironmentSafetyAudit | Out-Null }
            24 { RunSimulatorR2Plan | Out-Null }
            25 { RunSimulatorR2LocalGenerate | Out-Null }
            26 { RunSimulatorR2LocalCleanup | Out-Null }
            27 { RunSimulatorAdapterContract | Out-Null }
            28 { RunSimulatorAdapterPlan | Out-Null }
            29 { RunSimulatorDbAdapterContract | Out-Null }
            0  { return }
            default {
                Write-Host "등록되지 않은 메뉴 번호입니다. 0~29 범위의 표시된 번호를 입력하세요."
                Start-Sleep -Seconds 1
            }
        }
    }
}

function GetDownloadWatcherProcess {
    if (-not (Test-Path -LiteralPath $WatcherPidFile)) {
        return $null
    }

    try {
        $pidText = (Get-Content -LiteralPath $WatcherPidFile -Raw -ErrorAction Stop).Trim()
        if ($pidText -notmatch '^\d+$') {
            Remove-Item -LiteralPath $WatcherPidFile -Force -ErrorAction SilentlyContinue
            return $null
        }

        $processId = [int]$pidText
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($null -eq $process) {
            Remove-Item -LiteralPath $WatcherPidFile -Force -ErrorAction SilentlyContinue
            return $null
        }

        try {
            $cimProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction Stop
            $commandLine = [string]$cimProcess.CommandLine
            if ($commandLine -notlike '*download-watcher.ps1*') {
                LogWarn "저장된 PID가 다운로드 watcher가 아니므로 상태를 초기화합니다. PID: $processId"
                Remove-Item -LiteralPath $WatcherPidFile -Force -ErrorAction SilentlyContinue
                return $null
            }
        }
        catch {
            # CIM 조회가 제한된 환경에서는 살아 있는 PID와 상태 파일을 기준으로 판단한다.
        }

        return $process
    }
    catch {
        Remove-Item -LiteralPath $WatcherPidFile -Force -ErrorAction SilentlyContinue
        return $null
    }
}

function GetDownloadWatcherStatusText {
    if ($null -eq (GetDownloadWatcherProcess)) {
        return 'OFF'
    }

    return 'ON'
}

function GetCurrentPowerShellExecutable {
    try {
        $currentProcess = Get-Process -Id $PID -ErrorAction Stop
        if (-not [string]::IsNullOrWhiteSpace($currentProcess.Path)) {
            return $currentProcess.Path
        }
    }
    catch {
    }

    $pwsh = Get-Command pwsh.exe -ErrorAction SilentlyContinue
    if ($null -ne $pwsh) {
        return $pwsh.Source
    }

    $powershell = Get-Command powershell.exe -ErrorAction SilentlyContinue
    if ($null -ne $powershell) {
        return $powershell.Source
    }

    throw 'PowerShell 실행 파일을 찾을 수 없습니다.'
}

function StartDownloadWatcherBackground {
    $running = GetDownloadWatcherProcess
    if ($null -ne $running) {
        LogWarn "다운로드 감시가 이미 실행 중입니다. PID: $($running.Id)"
        Start-Sleep -Seconds 1
        return
    }

    try {
        $powerShellExecutable = GetCurrentPowerShellExecutable
        $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$DownloadWatcherScriptPath`" -Background"
        $process = Start-Process -FilePath $powerShellExecutable -ArgumentList $arguments -WindowStyle Hidden -PassThru
        $process.Id | Set-Content -LiteralPath $WatcherPidFile -Encoding UTF8
        Start-Sleep -Milliseconds 700

        $verified = GetDownloadWatcherProcess
        if ($null -eq $verified) {
            throw 'watcher 프로세스가 시작 직후 종료되었습니다. download-watcher.log를 확인하세요.'
        }

        LogInfo "다운로드 감시를 백그라운드로 시작했습니다. PID: $($verified.Id)"
    }
    catch {
        Remove-Item -LiteralPath $WatcherPidFile -Force -ErrorAction SilentlyContinue
        LogError "다운로드 감시 시작 실패: $($_.Exception.Message)"
    }

    Start-Sleep -Seconds 1
}

function StopDownloadWatcherBackground {
    $running = GetDownloadWatcherProcess
    if ($null -eq $running) {
        Remove-Item -LiteralPath $WatcherPidFile -Force -ErrorAction SilentlyContinue
        LogWarn '종료할 다운로드 감시 프로세스가 없습니다.'
        Start-Sleep -Seconds 1
        return
    }

    try {
        $processId = $running.Id
        taskkill /PID $processId /T /F | Out-Null
        Remove-Item -LiteralPath $WatcherPidFile -Force -ErrorAction SilentlyContinue
        WriteWatcherLog "[STOP_REQUEST] pid=$processId requestedBy=main-menu"
        WriteWatcherState -ProcessId $processId -Status 'stopped' -StartedAt '' -LastMessage 'stopped by main menu'
        LogInfo "다운로드 감시를 종료했습니다. PID: $processId"
    }
    catch {
        LogError "다운로드 감시 종료 실패: $($_.Exception.Message)"
    }

    Start-Sleep -Seconds 1
}

function ToggleDownloadWatcherBackground {
    if ($null -eq (GetDownloadWatcherProcess)) {
        StartDownloadWatcherBackground
        return
    }

    StopDownloadWatcherBackground
}

function ShowMainMenu {
    while ($true) {
        cls
        RefreshRuntimeOptions
        Write-Host "========================================================="
        WritePipelineTitle
        Write-Host "========================================================="
        $watcherStatus = GetDownloadWatcherStatusText
        $devServerStatus = GetDevServerStatusText
        $npmBuildStatus = GetNPMBuildStatusText

        WriteToggleMenuLine -Prefix "1. Download 폴더 감시 시작/종료 토글" -Status $watcherStatus
        WriteToggleMenuLine -Prefix "2. npm run dev 시작/종료 토글" -Status $devServerStatus
        WriteToggleMenuLine -Prefix "3. 패치 적용 후 자동 Build 토글" -Status $npmBuildStatus
        Write-Host "4. Flush folders - 산출물 폴더 비우기"
        Write-Host "5. 개발 / 테스트 도구"
        Write-Host "0. 종료"
        Write-Host "========================================================="
        Write-Host "번호를 입력하세요: " -NoNewline

        $key = [Console]::ReadKey($true)
        Write-Host $key.KeyChar

        switch ($key.KeyChar) {
            '1' { return "toggle-watch" }
            '2' { return "toggle-dev" }
            '3' { return "toggle-npm-build" }
            '4' { return "flush" }
            '5' { return "developer-tools-menu" }
            '0' { return "exit" }
            default {
                Write-Host "잘못된 입력입니다. 1, 2, 3, 4, 5 또는 0을 입력하세요."
                Start-Sleep -Seconds 1
            }
        }
    }
}

function MainLoop {
    while ($true) {
        $selectedMode = ShowMainMenu

        if ($selectedMode -eq "exit") {
            LogInfo "프로그램을 종료합니다. 다운로드 감시와 npm run dev는 현재 상태를 유지합니다."
            break
        }

        if ($selectedMode -eq "toggle-watch") {
            ToggleDownloadWatcherBackground
            continue
        }

        if ($selectedMode -eq "toggle-dev") {
            ToggleDevServerBackground
            continue
        }

        if ($selectedMode -eq "toggle-npm-build") {
            ToggleNPMBuildOption
            continue
        }

        if ($selectedMode -eq "flush") {
            FlushOutputFolders
            continue
        }

        if ($selectedMode -eq "developer-tools-menu") {
            ShowDeveloperToolsMenu
            continue
        }
    }
}


# ==========================================
# 11. 프로그램 시작점
# ==========================================

InitializePipeline
if ($CreateLocalRepoHandoff) {
    NewLocalRepositoryHandoff | Out-Null
}
else {
    MainLoop
}
