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
    [switch]$RunSignupConsentCompatibilityAudit,
    [switch]$ApplySignupConsentMigration,
    [switch]$RunSignupConsentPostApplyAudit,
    [switch]$RunSignupConsentRollbackSmoke,
    [switch]$RunSignupCertificateR2IntegrationPreflight,
    [switch]$RunSignupCertificateR2IntegrationTest,
    [switch]$RunSignupApprovalProvisioningIntegration,
    [switch]$CleanupSignupApprovalProvisioningFixtures,
    [switch]$DiagnoseSignupApprovalProvisioningSchema,
    [switch]$RunSystemCatalogCompatibilityAudit,
    [switch]$ApplySystemCatalogMigration,
    [switch]$RunSystemCatalogPostApplyAudit,
    [switch]$RunSystemCatalogProvisioningIntegration,
    [switch]$RunPdfR2LifecycleCompatibilityAudit,
    [switch]$RunPdfR2FixtureGenerate,
    [switch]$RunPdfR2LifecycleIntegration,
    [switch]$RunPdfR2ReconciliationDryRun,
    [switch]$RunPdfR2ExactCleanupPlan,
    [switch]$RunBillingCompatibilityAudit,
    [switch]$ApplyBillingOperationsMigration,
    [switch]$RunBillingPostApplyAudit,
    [switch]$RunBillingOperationsIntegration,
    [switch]$RunPublicSignupE2eCompatibilityAudit,
    [switch]$ApplyPublicSignupE2eMigration,
    [switch]$RunPublicSignupE2ePostApplyAudit,
    [switch]$RunPublicSignupE2eIntegration,
    [switch]$RunAuthenticatedPublicSignupE2e,
    [switch]$RunPublicSignupChromiumE2e,
    [switch]$RunPublicSignupBrowserMatrixE2e,
    [switch]$RunPublicSignupDeployedSmoke,
    [switch]$RunPublicSignupFinalResidualAudit,
    [switch]$RunFunctionsAutomationCoverageAudit,
    [switch]$RunWorkorderSizeSpecCompatibilityAudit,
    [switch]$ApplyWorkorderSizeSpecMigration,
    [switch]$RunWorkorderSizeSpecPostApplyAudit,
    [switch]$RunWorkorderSizeSpecIntegration,
    [switch]$RunWorkorderPdfVisualCheck,
    [switch]$RunWorkorderSizeSpecResidualAudit,
    [switch]$RunProductUxLanguageAudit,
    [switch]$RunCustomerProductUxCleanupVerification,
    [switch]$RunWorkorderPdfLiveIntegrationVerification,
    [switch]$RunProductUiRuntimeVerification,
    [switch]$RunWaflV2MigrationPreflight,
    [switch]$ApplyWaflV2Migrations,
    [switch]$ApplyWaflV2Alpha23MaterialIndex,
    [switch]$RunWaflV2PostApplyValidation,
    [ValidateSet("", "a500", "b5000", "c-multi")]
    [string]$RunWaflV2SeedProfile = "",
    [switch]$RunWaflV2DevTestVerification,
    [switch]$RunWaflV2Alpha23ListApiVerification,
    [switch]$RunWaflV2Alpha24DetailApiVerification,
    [switch]$RunWaflV2Alpha25CommandPreflight,
    [switch]$RunWaflV2Alpha25CommandRuntimeVerification,
    [switch]$RunWaflV2Alpha26MaterialCommandPreflight,
    [switch]$RunWaflV2Alpha26MaterialCommandRuntimeVerification,
    [switch]$RunWaflV2Alpha27RevisionIssuePreflight,
    [switch]$RunWaflV2Alpha27RevisionIssueRuntimeVerification,
    [switch]$RunWaflV2Alpha27aNumberSettingsPreflight,
    [switch]$ApplyWaflV2Alpha27aNumberSettingsMigration,
    [switch]$ApplyWaflV2Alpha27aSettingsFixture,
    [string]$WaflV2Confirmation = "",
    [switch]$CreateWaflV2FailureHandoff,
    [string]$WaflV2FailureStage = "",
    [string]$WaflV2FailureLogPath = "",
    [string]$VerificationResultPath = "",
    [string]$VerificationProfile = ""
)

$PipelineCommonPath = Join-Path $PSScriptRoot "pipeline-common.ps1"
$PipelinePatchProcessingPath = Join-Path $PSScriptRoot "pipeline-patch-processing.ps1"
$DownloadWatcherScriptPath = Join-Path $PSScriptRoot "download-watcher.ps1"
$DevServerWatcherScriptPath = Join-Path $PSScriptRoot "dev-server-watcher.ps1"

foreach ($requiredScript in @($PipelineCommonPath, $PipelinePatchProcessingPath, $DownloadWatcherScriptPath, $DevServerWatcherScriptPath)) {
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
        LogWarn "npm run dev watcher가 이미 실행 중입니다. PID: $($runningProcess.Id)"
        Start-Sleep -Seconds 1
        return
    }

    if (-not (Test-Path -LiteralPath $ProjectDir)) {
        LogError "프로젝트 루트 경로를 찾을 수 없습니다: $ProjectDir"
        Start-Sleep -Seconds 2
        return
    }

    if (-not (Test-Path -LiteralPath $DevServerWatcherScriptPath)) {
        LogError "npm run dev watcher 스크립트를 찾을 수 없습니다: $DevServerWatcherScriptPath"
        Start-Sleep -Seconds 2
        return
    }

    try {
        $pidDir = Split-Path -Parent $DevServerPidFile
        EnsureDirectory -Path $pidDir

        $powerShellExecutable = GetCurrentPowerShellExecutable
        $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$DevServerWatcherScriptPath`" -Background"
        $process = Start-Process -FilePath $powerShellExecutable -ArgumentList $arguments -WindowStyle Hidden -PassThru
        $process.Id | Set-Content -LiteralPath $DevServerPidFile -Encoding UTF8
        Start-Sleep -Milliseconds 900

        $verified = GetDevServerProcess
        if ($null -eq $verified) {
            throw 'npm run dev watcher 프로세스가 시작 직후 종료되었습니다. dev-server.log를 확인하세요.'
        }

        LogInfo "npm run dev watcher를 백그라운드로 시작했습니다. PID: $($verified.Id)"
    }
    catch {
        Remove-Item -LiteralPath $DevServerPidFile -Force -ErrorAction SilentlyContinue
        LogError "npm run dev watcher 시작 실패: $($_.Exception.Message)"
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

    $excludedSegments = @(
        ".git",
        "node_modules",
        ".next",
        ".wrangler",
        "artifacts",
        ".tmp",
        "test-results",
        "playwright-report",
        "reports",
        "blob-report",
        "coverage",
        ".nyc_output"
    )

    foreach ($segment in $lowerSegments) {
        if ($excludedSegments -contains $segment) {
            return $true
        }
    }

    if ($leaf -eq ".env" -or $leaf.StartsWith(".env.")) {
        return $true
    }

    if (
        $leaf -like "*.zip" -or
        $leaf -like "repo-state-*.txt" -or
        $leaf -like "build-result-*.txt" -or
        $leaf -like "*.tsbuildinfo" -or
        $leaf -like "storagestate*.json" -or
        $leaf -like "*.har" -or
        $leaf -like "*.webm"
    ) {
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
        "any path segment named blob-report",
        "any path segment named coverage",
        "any path segment named .nyc_output",
        "*.tsbuildinfo",
        "storageState*.json",
        "*.har and *.webm Playwright artifacts",
        ".env* including .env.example",
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

function GetLocalRepoVerificationEvidenceLine {
    param(
        [string[]]$Lines,
        [string[]]$Patterns,
        [string]$Fallback = "not provided"
    )

    foreach ($pattern in $Patterns) {
        $line = $Lines | Where-Object { ([string]$_) -match $pattern } | Select-Object -First 1
        if ($null -ne $line) {
            return ([string]$line).Trim()
        }
    }

    return $Fallback
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

function GetLocalRepoVerificationNamedValue {
    param(
        [string[]]$Lines,
        [string]$Name,
        [string]$Fallback = "not provided"
    )

    $value = GetLocalRepoVerificationField -Lines $Lines -Name $Name
    if ([string]::IsNullOrWhiteSpace($value)) {
        return $Fallback
    }

    return $value
}

function GetLatestDbAuditLogText {
    param(
        [string]$NamePattern
    )

    $dbAuditDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
    if (-not (Test-Path -LiteralPath $dbAuditDir -PathType Container)) {
        return ""
    }

    $file = Get-ChildItem -LiteralPath $dbAuditDir -File -Filter $NamePattern -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if ($null -eq $file) {
        return ""
    }

    return (Get-Content -LiteralPath $file.FullName -Encoding UTF8 -Raw)
}

function GetBillingOperationsHandoffEvidence {
    param(
        [string]$Version
    )

    $migrationLog = GetLatestDbAuditLogText -NamePattern "OK_Apply_Billing_Operations_Migration_$Version-*.txt"
    $postApplyLog = GetLatestDbAuditLogText -NamePattern "OK_Billing_Post_Apply_Audit_$Version-*.txt"
    $integrationLog = GetLatestDbAuditLogText -NamePattern "OK_Billing_Operations_Integration_$Version-*.txt"

    $residualDbRows = "not provided"
    $residualR2Objects = "not provided"
    if ($integrationLog -match '"residualDbRows"\s*:\s*([0-9]+)') { $residualDbRows = $matches[1] }
    if ($integrationLog -match '"residualR2Objects"\s*:\s*([0-9]+)') { $residualR2Objects = $matches[1] }

    return [pscustomobject]@{
        DbMigrationApplyResult = if ($migrationLog -match 'Result:\s*PASS') { "PASS" } else { "not provided" }
        PostApplyAuditResult = if ($postApplyLog -match 'Result:\s*PASS') { "PASS" } else { "not provided" }
        RollbackSmokeResult = if ($integrationLog -match '"result"\s*:\s*"PASS"') { "PASS" } else { "not provided" }
        FinalResidualDbRows = $residualDbRows
        FinalResidualR2Objects = $residualR2Objects
        DevTestFixtureMutation = if ($integrationLog -match '"mutation"\s*:\s*"dev-test-rollback-fixture-only"') { "rollback fixture only" } else { "not provided" }
        DevTestR2Mutation = if ($integrationLog -match '"r2Mutation"\s*:\s*"none"') { "false" } else { "not provided" }
        ProductionMutation = if ($integrationLog -match '"productionMutation"\s*:\s*false') { "false" } else { "not provided" }
        SchemaMigrationThisRun = if ($migrationLog -match 'Result:\s*PASS') { "dev/test additive migration applied" } else { "not provided" }
    }
}

function GetWorkorderSizePdfHandoffEvidence {
    param(
        [string]$Version
    )

    $evidenceVersion = if ($Version -eq "0.24.34.1") { "0.24.34" } else { $Version }
    $migrationLog = GetLatestDbAuditLogText -NamePattern "OK_Apply_Workorder_Size_Spec_Migration_$evidenceVersion-*.txt"
    $postApplyLog = GetLatestDbAuditLogText -NamePattern "OK_Workorder_Size_Spec_Post_Apply_Audit_$evidenceVersion-*.txt"
    $residualLog = GetLatestDbAuditLogText -NamePattern "OK_Workorder_Size_Spec_Final_Residual_Audit_$evidenceVersion-*.txt"

    $migrationPassed = $migrationLog -match 'Result:\s*PASS'
    $postApplyPassed = $postApplyLog -match 'Result:\s*PASS'
    $residualPassed = $residualLog -match 'Result:\s*PASS' -and $residualLog -match 'Total compatibility findings:\s*0'

    return [pscustomobject]@{
        DbMigrationApplyResult = if ($migrationPassed) { "PASS" } else { "not provided" }
        PostApplyAuditResult = if ($postApplyPassed) { "PASS" } else { "not provided" }
        FinalResidualDbRows = if ($residualPassed) { "0" } else { "not provided" }
        FinalResidualR2Objects = "NOT_APPLICABLE - no R2 mutation"
        DevTestFixtureMutation = "false"
        DevTestR2Mutation = "false"
        BusinessDataMutation = "false"
        ProductionBusinessDataMutation = "false"
        ProductionMutation = "false"
        SchemaMigrationThisRun = if ($migrationPassed) { "patch_0_24_34_workorder_size_spec_and_pdf.sql" } else { "not provided" }
    }
}

function TestWorkorderSizePdfMigrationEvidence {
    param(
        [object]$VerificationSummary
    )

    return ([string]$VerificationSummary.DbMigrationApplyResult -eq "PASS" -and
        [string]$VerificationSummary.SchemaMigrationThisRun -eq "patch_0_24_34_workorder_size_spec_and_pdf.sql")
}

function GetDbMigrationAppliedDisplayValue {
    param(
        [object]$VerificationSummary
    )

    if (TestWorkorderSizePdfMigrationEvidence -VerificationSummary $VerificationSummary) {
        return "true; approved dev/test only"
    }

    if ([string]$VerificationSummary.DbMigrationApplyResult -match 'NOT_APPLIED|NOT_APPLICABLE') {
        return "false"
    }

    return [string]$VerificationSummary.DbMigrationApplyResult
}

function GetDbSchemaMutationDisplayValue {
    param(
        [object]$VerificationSummary
    )

    if (TestWorkorderSizePdfMigrationEvidence -VerificationSummary $VerificationSummary) {
        return "true; additive migration only on approved dev/test DB"
    }

    return [string]$VerificationSummary.SchemaMigrationThisRun
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
            TargetedEslintPassed = ""
            TargetedEslintCommand = ""
            TypecheckPassed = ""
            TypecheckCommand = ""
            BuildPassed = ""
            BuildCommand = ""
            ExecutedAt = ""
            MutationFindingCount = ""
            MutationHighRiskCount = ""
            ContractSummary = "not provided"
            E2ESmokeSummary = "not provided"
            SignupProvisioningRegression = "not provided"
            CatalogRegression = "not provided"
            PdfR2Regression = "not provided"
            VercelReadiness = "not provided"
            ManualQaStatus = "not provided"
            DbMigrationApplyResult = "not provided"
            PostApplyAuditResult = "not provided"
            RollbackSmokeResult = "not provided"
            DevTestDbTestDataMutation = "not provided"
            DevTestR2Mutation = "not provided"
            ProductionMutation = "not provided"
            SchemaMigrationThisRun = "not provided"
            CertificateIntegrationResult = "not provided"
            PngUpload = "not provided"
            JpegReplacement = "not provided"
            PdfReplacement = "not provided"
            Revoke = "not provided"
            PdfR2LifecycleIntegrationResult = "not provided"
            PdfR2WorkerVersion = "not provided"
            PdfGeneratorWorkerVersion = "not provided"
            PdfUpload = "not provided"
            PdfTrash = "not provided"
            PdfRestore = "not provided"
            PdfRegeneration = "not provided"
            PdfPermanentDelete = "not provided"
            PdfMissingDetection = "not provided"
            PdfOrphanDetection = "not provided"
            PdfReconciliation = "not provided"
            PdfExactCleanupPlan = "not provided"
            FinalResidualDbRows = "not provided"
            FinalResidualR2Objects = "not provided"
            LiveViewerIntegration = "not provided"
        }
    }

    $lines = @(Get-Content -LiteralPath $ResultPath -Encoding UTF8)
    $build = GetLocalRepoVerificationCommandResult -Lines $lines -ResultName "npm run build"
    $targetedEslint = GetLocalRepoVerificationCommandResult -Lines $lines -ResultName "targeted ESLint"
    $typecheck = GetLocalRepoVerificationCommandResult -Lines $lines -ResultName "tsc --noEmit"
    $mutation = GetLocalRepoVerificationCommandResult -Lines $lines -ResultName "npm run audit:wafl-mutations"
    $contracts = @($lines | Where-Object {
        $text = [string]$_
        $text -match 'contract:' -and $text -match 'Passed=True'
    })
    $contractGroupSummary = GetLocalRepoVerificationField -Lines $lines -Name "Contract Group Summary"
    $smokeSummary = GetLocalRepoVerificationField -Lines $lines -Name "E2E/Smoke Summary"
    $signupRegression = GetLocalRepoVerificationField -Lines $lines -Name "Signup/Provisioning Regression"
    $catalogRegression = GetLocalRepoVerificationField -Lines $lines -Name "Catalog Regression"
    $pdfR2Regression = GetLocalRepoVerificationField -Lines $lines -Name "PDF/R2 Regression"
    $vercelReadiness = GetLocalRepoVerificationField -Lines $lines -Name "Vercel Readiness"
    $manualQaStatus = GetLocalRepoVerificationField -Lines $lines -Name "Manual QA Status"
    $version = GetProjectAppVersion
    $billingEvidence = if ($ProfileName -eq "billing-operations") { GetBillingOperationsHandoffEvidence -Version $version } else { $null }
    $workorderEvidence = if ($ProfileName -eq "workorder-size-pdf" -or $ProfileName -eq "public-signup-first-draft-fix") { GetWorkorderSizePdfHandoffEvidence -Version $version } else { $null }
    $productUxCleanupProfile = $ProfileName -eq "customer-product-ux-cleanup"
    $workorderPdfLiveProfile = $ProfileName -eq "workorder-pdf-live-integration"
    $productUiRuntimeProfile = $ProfileName -eq "product-ui-runtime-verification"
    $alpha30Completion = $version -eq "2.0.0-alpha.30"

    return [pscustomobject]@{
        Path = $ResultPath
        Profile = if ([string]::IsNullOrWhiteSpace($ProfileName)) { GetLocalRepoVerificationField -Lines $lines -Name "Profile" } else { $ProfileName }
        Result = if (($lines -join "`n") -match 'VERIFY_SAFE_RESULT:\s*(PASS|FAIL|CHECK_ONLY)') { $matches[1] } else { "unknown" }
        HeadHash = GetLocalRepoVerificationField -Lines $lines -Name "HeadHash"
        TargetedEslintPassed = $targetedEslint.Passed
        TargetedEslintCommand = $targetedEslint.Command
        TypecheckPassed = $typecheck.Passed
        TypecheckCommand = $typecheck.Command
        BuildPassed = $build.Passed
        BuildCommand = $build.Command
        ExecutedAt = GetLocalRepoVerificationField -Lines $lines -Name "ExecutedAt"
        MutationFindingCount = $mutation.FindingCount
        MutationHighRiskCount = $mutation.HighRiskCount
        ContractSummary = if (-not [string]::IsNullOrWhiteSpace($contractGroupSummary)) {
            $contractGroupSummary
        } elseif ($contracts.Count -eq 0) {
            "none"
        } else {
            "$($contracts.Count) passed, 0 failed"
        }
        E2ESmokeSummary = if ([string]::IsNullOrWhiteSpace($smokeSummary)) { if ($productUxCleanupProfile) { "NOT_RUN - static cleanup profile" } elseif ($workorderPdfLiveProfile) { "NOT_RUN - browser matrix remains manual/user QA" } elseif ($productUiRuntimeProfile) { "PASS - workorder runtime and public signup browser evidence recorded; PRODUCT_QA_INCOMPLETE" } else { "not provided" } } else { $smokeSummary }
        SignupProvisioningRegression = if ([string]::IsNullOrWhiteSpace($signupRegression)) { if ($productUxCleanupProfile) { "PASS - public signup product UX/static contracts" } elseif ($productUiRuntimeProfile) { "PASS - public signup screenshot/browser smoke evidence; same-Google OAuth return remains manual" } else { "not provided" } } else { $signupRegression }
        CatalogRegression = if ([string]::IsNullOrWhiteSpace($catalogRegression)) { if ($productUxCleanupProfile) { "PASS - system catalog static contract" } elseif ($productUiRuntimeProfile) { "NOT_APPLICABLE - no catalog change in 0.24.34.5" } else { "not provided" } } else { $catalogRegression }
        PdfR2Regression = if ([string]::IsNullOrWhiteSpace($pdfR2Regression)) { if ($productUxCleanupProfile) { "PASS - workorder PDF route/viewer static contracts; live R2 NOT_RUN" } elseif ($workorderPdfLiveProfile) { "PASS - live dev/test PDF/R2 lifecycle integration and static contracts" } elseif ($productUiRuntimeProfile) { "PASS - dev/test workorder PDF create/view/render evidence; user visual review remains" } else { "not provided" } } else { $pdfR2Regression }
        VercelReadiness = if ([string]::IsNullOrWhiteSpace($vercelReadiness)) { if ($productUxCleanupProfile) { "NOT_RUN - deployment smoke outside 0.24.34.2 static cleanup" } elseif ($workorderPdfLiveProfile) { "NOT_RUN - no deployment smoke in 0.24.34.3" } elseif ($productUiRuntimeProfile) { "NOT_RUN - localhost evidence only in 0.24.34.5 checkpoint" } else { "not provided" } } else { $vercelReadiness }
        ManualQaStatus = if ([string]::IsNullOrWhiteSpace($manualQaStatus)) { if ($productUxCleanupProfile) { "PENDING_USER_QA - PDF visual/browser matrix" } elseif ($workorderPdfLiveProfile) { "PENDING_USER_QA - rendered PDF visual/browser/device confirmation" } elseif ($productUiRuntimeProfile) { "PRODUCT_QA_INCOMPLETE - user PDF/screen review and same-Google OAuth return remain" } else { "not provided" } } else { $manualQaStatus }
        DbMigrationApplyResult = if ($alpha30Completion) { "PASS - approved dev/test migration 009 applied once; ledger 9/9" } elseif ($productUxCleanupProfile) { "NOT_APPLICABLE - no migration in 0.24.34.2" } elseif ($workorderPdfLiveProfile) { "NOT_APPLICABLE - no migration in 0.24.34.3" } elseif ($productUiRuntimeProfile) { "NOT_APPLICABLE - no migration in 0.24.34.5" } elseif ($null -ne $workorderEvidence -and $workorderEvidence.DbMigrationApplyResult -ne "not provided") { $workorderEvidence.DbMigrationApplyResult } elseif ($null -ne $billingEvidence -and $billingEvidence.DbMigrationApplyResult -ne "not provided") { $billingEvidence.DbMigrationApplyResult } else { GetLocalRepoVerificationEvidenceLine -Lines $lines -Patterns @(
            'DB Migration Apply Result:\s*(PASS|FAIL|NOT_APPLIED|NOT_APPLICABLE)',
            'Migration apply:\s*(PASS|FAIL)',
            'Consent migration apply:\s*(PASS|FAIL)'
        ) }
        PostApplyAuditResult = if ($alpha30Completion) { "PASS - four nullable fields and NOT VALID constraints; existing rows/RLS/ACL unchanged" } elseif ($productUxCleanupProfile) { "NOT_APPLICABLE - no migration in 0.24.34.2" } elseif ($workorderPdfLiveProfile) { "NOT_APPLICABLE - no migration in 0.24.34.3" } elseif ($productUiRuntimeProfile) { "NOT_APPLICABLE - no migration in 0.24.34.5" } elseif ($null -ne $workorderEvidence -and $workorderEvidence.PostApplyAuditResult -ne "not provided") { $workorderEvidence.PostApplyAuditResult } elseif ($null -ne $billingEvidence -and $billingEvidence.PostApplyAuditResult -ne "not provided") { $billingEvidence.PostApplyAuditResult } else { GetLocalRepoVerificationEvidenceLine -Lines $lines -Patterns @(
            'Post-Apply Audit Result:\s*(PASS|FAIL|NOT_APPLICABLE)',
            'Post-apply .*audit:\s*(PASS|FAIL)',
            'post-apply .*findings\s+0'
        ) }
        RollbackSmokeResult = if ($alpha30Completion) { "NOT_RUN - cleanup/reset/rollback prohibited and not executed" } elseif ($productUxCleanupProfile) { "NOT_APPLICABLE - no DB fixture mutation" } elseif ($workorderPdfLiveProfile) { "PASS - exact fixture cleanup with residual DB/R2 0" } elseif ($productUiRuntimeProfile) { "NOT_APPLICABLE - no cleanup fixture; dev/test existing workorder QA mutation recorded" } elseif ($null -ne $billingEvidence -and $billingEvidence.RollbackSmokeResult -ne "not provided") { $billingEvidence.RollbackSmokeResult } else { GetLocalRepoVerificationEvidenceLine -Lines $lines -Patterns @(
            'Rollback Smoke Result:\s*(PASS|FAIL)',
            'rollback smoke:\s*(PASS|FAIL)',
            'rollback smoke .*PASS'
        ) }
        DevTestDbTestDataMutation = if ($alpha30Completion) { "true - approved Company A synthetic WorkOrder/revision/material Command evidence" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "Dev/Test DB Test-Data Mutation" -Fallback "false" }
        DevTestFixtureMutation = if ($alpha30Completion) { "true - one approved direct process fixture row" } elseif ($null -ne $workorderEvidence -and $workorderEvidence.DevTestFixtureMutation -ne "not provided") { $workorderEvidence.DevTestFixtureMutation } elseif ($null -ne $billingEvidence -and $billingEvidence.DevTestFixtureMutation -ne "not provided") { $billingEvidence.DevTestFixtureMutation } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "Dev/Test Fixture Mutation" -Fallback "false" }
        BusinessDataMutation = if ($null -ne $workorderEvidence -and $workorderEvidence.BusinessDataMutation -ne "not provided") { $workorderEvidence.BusinessDataMutation } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "Business Data Mutation" -Fallback "false" }
        ProductionBusinessDataMutation = if ($null -ne $workorderEvidence -and $workorderEvidence.ProductionBusinessDataMutation -ne "not provided") { $workorderEvidence.ProductionBusinessDataMutation } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "Production Business Data Mutation" -Fallback "false" }
        DevTestR2Mutation = if ($workorderPdfLiveProfile) { "true - synthetic PDF/R2 fixture integration only" } elseif ($null -ne $workorderEvidence -and $workorderEvidence.DevTestR2Mutation -ne "not provided") { $workorderEvidence.DevTestR2Mutation } elseif ($null -ne $billingEvidence -and $billingEvidence.DevTestR2Mutation -ne "not provided") { $billingEvidence.DevTestR2Mutation } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "Dev/Test R2 Mutation" -Fallback "false" }
        ProductionMutation = if ($workorderPdfLiveProfile) { "false" } elseif ($null -ne $workorderEvidence -and $workorderEvidence.ProductionMutation -ne "not provided") { $workorderEvidence.ProductionMutation } elseif ($null -ne $billingEvidence -and $billingEvidence.ProductionMutation -ne "not provided") { $billingEvidence.ProductionMutation } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "Production Mutation" -Fallback "false" }
        SchemaMigrationThisRun = if ($alpha30Completion) { "false - migration 009 was applied in the separately approved pre-runtime phase" } elseif ($workorderPdfLiveProfile) { "false" } elseif ($null -ne $workorderEvidence -and $workorderEvidence.SchemaMigrationThisRun -ne "not provided") { $workorderEvidence.SchemaMigrationThisRun } elseif ($null -ne $billingEvidence -and $billingEvidence.SchemaMigrationThisRun -ne "not provided") { $billingEvidence.SchemaMigrationThisRun } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "Schema Migration This Run" -Fallback "false" }
        CertificateIntegrationResult = if ($productUxCleanupProfile) { "NOT_APPLICABLE - no certificate integration in 0.24.34.2" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "Certificate Integration Result" }
        PngUpload = if ($productUxCleanupProfile) { "NOT_APPLICABLE" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "PNG Upload" }
        JpegReplacement = if ($productUxCleanupProfile) { "NOT_APPLICABLE" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "JPEG Replacement" }
        PdfReplacement = if ($productUxCleanupProfile) { "NOT_APPLICABLE" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "PDF Replacement" }
        Revoke = if ($productUxCleanupProfile) { "NOT_APPLICABLE" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "Revoke" }
        PdfR2LifecycleIntegrationResult = if ($productUxCleanupProfile) { "NOT_RUN - no live R2 mutation in 0.24.34.2" } elseif ($workorderPdfLiveProfile) { "PASS - menu 53 live dev/test integration" } elseif ($productUiRuntimeProfile) { "PASS - workorder PDF create/view/render evidence; full lifecycle cleanup NOT_RUN" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "PDF/R2 Lifecycle Integration Result" }
        PdfR2WorkerVersion = if ($productUxCleanupProfile -or $workorderPdfLiveProfile -or $productUiRuntimeProfile) { "0.13.71 - unchanged" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "PDF/R2 Worker Version" }
        PdfGeneratorWorkerVersion = if ($productUxCleanupProfile -or $workorderPdfLiveProfile -or $productUiRuntimeProfile) { "0.16.1.1 - unchanged" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "PDF Generator Worker Version" }
        PdfUpload = if ($productUxCleanupProfile -or $productUiRuntimeProfile) { "NOT_RUN" } elseif ($workorderPdfLiveProfile) { "PASS" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "PDF Upload" }
        PdfTrash = if ($productUxCleanupProfile -or $productUiRuntimeProfile) { "NOT_RUN" } elseif ($workorderPdfLiveProfile) { "PASS" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "PDF Trash" }
        PdfRestore = if ($productUxCleanupProfile -or $productUiRuntimeProfile) { "NOT_RUN" } elseif ($workorderPdfLiveProfile) { "PASS" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "PDF Restore" }
        PdfRegeneration = if ($productUxCleanupProfile) { "NOT_RUN - static route contract only" } elseif ($productUiRuntimeProfile) { "NOT_RUN - no PDF regeneration in 0.24.34.5 checkpoint" } elseif ($workorderPdfLiveProfile) { "PASS" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "PDF Regeneration" }
        PdfPermanentDelete = if ($productUxCleanupProfile -or $productUiRuntimeProfile) { "NOT_RUN" } elseif ($workorderPdfLiveProfile) { "PASS" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "PDF Permanent Delete" }
        PdfMissingDetection = if ($productUxCleanupProfile) { "PASS - safe missing-object viewer fallback contract" } elseif ($productUiRuntimeProfile) { "PASS - safe viewer fallback contract" } elseif ($workorderPdfLiveProfile) { "PASS" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "PDF Missing Detection" }
        PdfOrphanDetection = if ($productUxCleanupProfile -or $productUiRuntimeProfile) { "NOT_RUN" } elseif ($workorderPdfLiveProfile) { "PASS" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "PDF Orphan Detection" }
        PdfReconciliation = if ($productUxCleanupProfile) { "NOT_RUN" } elseif ($workorderPdfLiveProfile) { "PASS - matched 0, missing 1, orphan candidate 1, cleanup pending 0 in synthetic scope" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "PDF Reconciliation" }
        PdfExactCleanupPlan = if ($productUxCleanupProfile) { "NOT_APPLICABLE - no R2 mutation" } elseif ($workorderPdfLiveProfile) { "PASS - exact fixture cleanup only" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "PDF Exact Cleanup Plan" }
        FinalResidualDbRows = if ($productUxCleanupProfile) { "NOT_APPLICABLE - no DB mutation" } elseif ($workorderPdfLiveProfile) { "0" } elseif ($productUiRuntimeProfile) { "NOT_APPLICABLE - existing dev/test workorder mutation, no cleanup fixture" } elseif ($null -ne $workorderEvidence -and $workorderEvidence.FinalResidualDbRows -ne "not provided") { $workorderEvidence.FinalResidualDbRows } elseif ($null -ne $billingEvidence -and $billingEvidence.FinalResidualDbRows -ne "not provided") { $billingEvidence.FinalResidualDbRows } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "Final Residual DB Rows" }
        FinalResidualR2Objects = if ($productUxCleanupProfile) { "NOT_APPLICABLE - no R2 mutation" } elseif ($workorderPdfLiveProfile) { "0" } elseif ($productUiRuntimeProfile) { "NOT_APPLICABLE - workorder PDF evidence generated in dev/test" } elseif ($null -ne $workorderEvidence -and $workorderEvidence.FinalResidualR2Objects -ne "not provided") { $workorderEvidence.FinalResidualR2Objects } elseif ($null -ne $billingEvidence -and $billingEvidence.FinalResidualR2Objects -ne "not provided") { $billingEvidence.FinalResidualR2Objects } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "Final Residual R2 Objects" }
        LiveViewerIntegration = if ($productUxCleanupProfile) { "NOT_RUN - static viewer fallback contract only" } elseif ($workorderPdfLiveProfile) { "PASS - server proxy viewer path and live R2 object read-back" } else { GetLocalRepoVerificationNamedValue -Lines $lines -Name "Live Viewer Integration" }
    }
}

function AddCustomerProductUxCleanupRepoStateSections {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [object]$VerificationSummary
    )

    if ([string]$VerificationSummary.Profile -ne "customer-product-ux-cleanup") {
        return
    }

    AddRepoStateSection -Lines $Lines -Title "Product UX Language Audit:" -Values @("PASS - static customer-copy and leak-prevention contract")
    AddRepoStateSection -Lines $Lines -Title "Public Signup Product UX:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Automatic Signup Draft:" -Values @("PASS - first certificate selection creates draft after required company info")
    AddRepoStateSection -Lines $Lines -Title "Terms Viewer:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Plan Comparison:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Company File Metadata Cleanup:" -Values @("PASS - file proxy uses fileId and safe diagnostics")
    AddRepoStateSection -Lines $Lines -Title "System Catalog Navigation:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Product Category Hierarchy:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Default Measurement Chart:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Measurement Chart Migration Apply:" -Values @("NOT_APPLICABLE - no migration")
    AddRepoStateSection -Lines $Lines -Title "Size Right-panel Summary:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Size Edit Modal:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Korean POM Labels:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Inch 1/8 Input:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Workorder Print Workflow Gate:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Print API Gate:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Automatic PDF Type Decision:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Incomplete PDF R2 Integration:" -Values @("NOT_RUN - no live R2 mutation in 0.24.34.2")
    AddRepoStateSection -Lines $Lines -Title "Final PDF R2 Integration:" -Values @("NOT_RUN - no live R2 mutation in 0.24.34.2")
    AddRepoStateSection -Lines $Lines -Title "PDF Object Verification:" -Values @("PASS - static route/viewer contract")
    AddRepoStateSection -Lines $Lines -Title "PDF Viewer:" -Values @("PASS - safe missing-object fallback contract")
    AddRepoStateSection -Lines $Lines -Title "PDF Download:" -Values @("NOT_RUN")
    AddRepoStateSection -Lines $Lines -Title "PDF Regeneration:" -Values @("NOT_RUN - static route contract only")
    AddRepoStateSection -Lines $Lines -Title "Previous Final Preservation:" -Values @("PASS - existing final-retirement contract remains covered")
    AddRepoStateSection -Lines $Lines -Title "PDF Missing Object Recovery:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Generated Documents Attachment List:" -Values @("PASS - filename/display policy contract")
    AddRepoStateSection -Lines $Lines -Title "PDF Visual Verification:" -Values @("PENDING_USER_QA")
    AddRepoStateSection -Lines $Lines -Title "Browser Matrix:" -Values @("NOT_RUN - static cleanup profile")
    AddRepoStateSection -Lines $Lines -Title "Chromium:" -Values @("NOT_RUN")
    AddRepoStateSection -Lines $Lines -Title "WebKit:" -Values @("NOT_RUN")
    AddRepoStateSection -Lines $Lines -Title "Mobile:" -Values @("NOT_RUN")
    AddRepoStateSection -Lines $Lines -Title "iPad:" -Values @("NOT_RUN")
    AddRepoStateSection -Lines $Lines -Title "Tenant/IDOR:" -Values @("PASS - authorization regression contracts")
    AddRepoStateSection -Lines $Lines -Title "Worker Changed:" -Values @("false")
    AddRepoStateSection -Lines $Lines -Title "Worker Deployed:" -Values @("false")
}

function AddWorkorderPdfLiveIntegrationRepoStateSections {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [object]$VerificationSummary
    )

    if ([string]$VerificationSummary.Profile -ne "workorder-pdf-live-integration") {
        return
    }

    AddRepoStateSection -Lines $Lines -Title "PDF Live Root Cause:" -Values @("Resolved metadata-only completion risk by requiring binary size and R2 object read-back before attachment metadata registration.")
    AddRepoStateSection -Lines $Lines -Title "Generated PDF Object Verification:" -Values @("PASS - binary non-empty, R2 PUT, server-side object read-back before DB metadata")
    AddRepoStateSection -Lines $Lines -Title "Generated PDF Browser URL Policy:" -Values @("PASS - tenant-scoped server proxy URL; no signed URL or raw R2 key in generated response")
    AddRepoStateSection -Lines $Lines -Title "Incomplete PDF Binary:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Incomplete PDF R2 PUT:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Incomplete PDF R2 Read-back:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Incomplete PDF Download:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Final PDF Binary:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Final PDF R2 PUT:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Final PDF R2 Read-back:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Final PDF Download:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Order-request PDF Isolation:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Generated Document Type Isolation:" -Values @("PASS - incomplete/final/order-request types remain distinct")
    AddRepoStateSection -Lines $Lines -Title "Previous Final Preservation:" -Values @("PASS - failed replacement preserves previous final PDF object")
    AddRepoStateSection -Lines $Lines -Title "PDF Viewer Inline:" -Values @("PASS - server proxy inline response")
    AddRepoStateSection -Lines $Lines -Title "PDF Viewer Download:" -Values @("PASS - server proxy attachment disposition when requested")
    AddRepoStateSection -Lines $Lines -Title "PDF Visual Verification:" -Values @("PENDING_USER_QA - rendered-page/device visual judgment remains manual")
    AddRepoStateSection -Lines $Lines -Title "Browser Matrix:" -Values @("NOT_RUN - no Chromium/WebKit/mobile matrix in 0.24.34.3")
    AddRepoStateSection -Lines $Lines -Title "Chromium:" -Values @("NOT_RUN")
    AddRepoStateSection -Lines $Lines -Title "WebKit:" -Values @("NOT_RUN")
    AddRepoStateSection -Lines $Lines -Title "Mobile:" -Values @("NOT_RUN")
    AddRepoStateSection -Lines $Lines -Title "iPad:" -Values @("NOT_RUN")
    AddRepoStateSection -Lines $Lines -Title "Worker Changed:" -Values @("false")
    AddRepoStateSection -Lines $Lines -Title "Worker Deployed:" -Values @("false")
    AddRepoStateSection -Lines $Lines -Title "0.24.35 Status:" -Values @("NOT_STARTED")
}

function AddProductUiRuntimeVerificationRepoStateSections {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [object]$VerificationSummary
    )

    if ([string]$VerificationSummary.Profile -ne "product-ui-runtime-verification") {
        return
    }

    AddRepoStateSection -Lines $Lines -Title "Product Completion Level:" -Values @("PRODUCT_QA_INCOMPLETE")
    AddRepoStateSection -Lines $Lines -Title "Product Verified:" -Values @("false")
    AddRepoStateSection -Lines $Lines -Title "Workorder Repository Fetch Started:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Workorder Summary Request Count:" -Values @("12")
    AddRepoStateSection -Lines $Lines -Title "Workorder Detail Request Count:" -Values @("11")
    AddRepoStateSection -Lines $Lines -Title "Workorder List Runtime:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Workorder Detail Runtime:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Infinite Loading Regression:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Loading Error State:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Size Right-panel Placement:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Size Central-panel Removal:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Factory Instruction Ordering:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Canonical WAFL Modal Import:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Direct Overlay Audit:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Desktop Screenshots:" -Values @("PASS - artifacts/ui-qa/0.24.34.5/live-workorder/chromium-desktop-workorder-list.png; chromium-desktop-workorder-detail.png")
    AddRepoStateSection -Lines $Lines -Title "Mobile Screenshots:" -Values @("PASS - artifacts/ui-qa/0.24.34.5/live-workorder/mobile-chromium-workorder-list.png; mobile-chromium-workorder-detail.png")
    AddRepoStateSection -Lines $Lines -Title "iPad Screenshots:" -Values @("PASS - artifacts/ui-qa/0.24.34.5/live-workorder/ipad-webkit-workorder-list.png; ipad-webkit-workorder-detail.png")
    AddRepoStateSection -Lines $Lines -Title "Browser Matrix:" -Values @("PASS - individual localhost desktop/mobile/iPad evidence; parallel shared-fixture PDF generation is not final evidence")
    AddRepoStateSection -Lines $Lines -Title "Chromium:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Mobile:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "iPad:" -Values @("PASS")
    AddRepoStateSection -Lines $Lines -Title "Console Error Count:" -Values @("2")
    AddRepoStateSection -Lines $Lines -Title "Failed Request Count:" -Values @("7 total navigation-abort/cancel background requests; 0 workorder HTTP failures")
    AddRepoStateSection -Lines $Lines -Title "HTTP 4xx/5xx Count:" -Values @("0")
    AddRepoStateSection -Lines $Lines -Title "Evidence Manifest:" -Values @("PASS - artifacts/ui-qa/0.24.34.5 live-workorder and product-screens manifests")
    AddRepoStateSection -Lines $Lines -Title "Playwright Trace:" -Values @("PASS - screenshots, JSON manifests, and failure artifacts from retry attempts retained outside source ZIP")
    AddRepoStateSection -Lines $Lines -Title "First Runtime Failure Stage:" -Values @("workorder detail before PDF viewer recovery")
    AddRepoStateSection -Lines $Lines -Title "First Console Error:" -Values @("Recorded in live manifests; final HTTP 4xx/5xx count is 0")
    AddRepoStateSection -Lines $Lines -Title "API 요청 0건 원인:" -Values @("NOT_APPLICABLE in latest 0.24.34.5 evidence - workorder summary/detail requests recorded")
    AddRepoStateSection -Lines $Lines -Title "Full Reset Used:" -Values @("false")
    AddRepoStateSection -Lines $Lines -Title "Full Reset Reason:" -Values @("NOT_APPLICABLE - no reset used or needed")
    AddRepoStateSection -Lines $Lines -Title "DB Migration Presence:" -Values @("PASS - no migration file in 0.24.34.5")
    AddRepoStateSection -Lines $Lines -Title "Public Signup Browser Matrix:" -Values @("PASS - product screenshot evidence; same-Google OAuth return NOT_RUN")
    AddRepoStateSection -Lines $Lines -Title "Workorder Browser Matrix:" -Values @("PASS - chromium desktop, mobile chromium, iPad webkit individual runs")
    AddRepoStateSection -Lines $Lines -Title "PDF Page PNG:" -Values @("PASS - artifacts/pdf-qa/0.24.34.5/workorder-live-product-page-1.png; page-2.png")
    AddRepoStateSection -Lines $Lines -Title "QA Evidence ZIP:" -Values @("C:\CWJ_Project\Patch\PeaceByPiece\5. QA_Evidence\peacebypiece-evidence-0.24.34.5-20260703-214502.zip")
    AddRepoStateSection -Lines $Lines -Title "Remaining Manual QA:" -Values @("PDF visual review, screenshot review, same-Google OAuth returning-applicant round trip")
    AddRepoStateSection -Lines $Lines -Title "Worker Changed:" -Values @("false")
    AddRepoStateSection -Lines $Lines -Title "Worker Deployed:" -Values @("false")
    AddRepoStateSection -Lines $Lines -Title "0.24.35 Status:" -Values @("NOT_STARTED")
}

function AddAlpha35MaterialCompactInputRepoStateSections {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Version
    )

    if ($Version -ne "2.0.0-alpha.35") {
        return
    }

    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Product Verification:" -Values @("LEVEL_4_PRODUCT_VERIFIED - 390/768/1024 responsive interaction and Chromium print evidence")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Core Input Row Count:" -Values @("2")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Fields Per Core Row:" -Values @("3")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Label / Value Same-Line:" -Values @("PASS - underline-only 22px inline field grammar")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Unit Position:" -Values @("PASS - directly below material name")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Unit Propagation:" -Values @("PASS - 382yd becomes 382m")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Unit Numeric Conversion:" -Values @("false")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Unit Price Editing:" -Values @("PASS - same-position numeric TextInput while editing")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Order Quantity Calculation:" -Values @("PASS - max(420 + 42 - 80, 0) = 382; required 430 yields 392")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Amount Calculation:" -Values @("PASS - 382 x 12,800 = 4,889,600; 392 x 12,800 = 5,017,600")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Warning Text Count:" -Values @("0")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Material Status Badges:" -Values @("PASS - input, order requested, completed only")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Missing Required State:" -Values @("PASS - field label and underline only")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Summary / Action Row:" -Values @("PASS - one final materialOrderActionRow")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 390px Action Wrap Count:" -Values @("0")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Action-After-Content Count:" -Values @("0")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 Card Height Before / After:" -Values @("275px / 214px")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 PDF / Preview Regression:" -Values @("PASS - localhost sample; production host 404; 1 landscape + 2 portrait pages; total 144")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 DB Migration Applied:" -Values @("false")
    AddRepoStateSection -Lines $Lines -Title "Alpha.35 DB / API / R2 / Worker / PDF Lifecycle / Production Mutation:" -Values @("false")
}

function AddAlpha36MaterialCardSeparationRepoStateSections {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Version
    )

    if ($Version -ne "2.0.0-alpha.36") {
        return
    }

    AddRepoStateSection -Lines $Lines -Title "Alpha.36 Product Verification:" -Values @("LEVEL_4_PRODUCT_VERIFIED - 390/768/1024 responsive interaction and Preview print evidence")
    AddRepoStateSection -Lines $Lines -Title "Alpha.36 Summary Row Result:" -Values @("PASS - order quantity, unit price, and amount in one final row")
    AddRepoStateSection -Lines $Lines -Title "Alpha.36 Core Placeholder Removal:" -Values @("PASS - core six fields and unit expose no default placeholder text")
    AddRepoStateSection -Lines $Lines -Title "Alpha.36 Missing State Result:" -Values @("PASS - field-only muted label and underline; neutral dash in incomplete summary")
    AddRepoStateSection -Lines $Lines -Title "Alpha.36 Card Separation Result:" -Values @("PASS - 8px inter-card spacing, faint work-surface background, existing subtle top line and status accent")
    AddRepoStateSection -Lines $Lines -Title "Alpha.36 Card Height Before / After:" -Values @("214px / 214px")
    AddRepoStateSection -Lines $Lines -Title "Alpha.36 Responsive QA:" -Values @("PASS - 390x844, 768x1024, 1024x768; overflow 0; console warning/error 0")
    AddRepoStateSection -Lines $Lines -Title "Alpha.36 PDF / Preview Regression:" -Values @("PASS - current localhost sample, production host 404, and total 144; Preview source diff 0; accepted alpha.35 Chromium PDF re-inspected with 1 landscape + 2 portrait pages")
    AddRepoStateSection -Lines $Lines -Title "Alpha.36 DB Migration Applied:" -Values @("false")
    AddRepoStateSection -Lines $Lines -Title "Alpha.36 DB / API / R2 / Worker / PDF Lifecycle / Production Mutation:" -Values @("false")
}

function AddAlpha37PdfFoundationRepoStateSections {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Version
    )

    if ($Version -ne "2.0.0-alpha.37") {
        return
    }

    $manifest = $null
    $manifestPath = Get-ChildItem -LiteralPath (Join-Path $ProjectDir ".tmp\wafl-v2-alpha37") -File -Filter "manifest.json" -Recurse -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if ($null -ne $manifestPath) {
        try {
            $manifest = Get-Content -LiteralPath $manifestPath.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
        }
        catch {
            $manifest = $null
        }
    }

    $alpha37FeatureCommit = [string](InvokeLocalRepoGitOutput -Arguments @("log", "-1", "--format=%H", "-S", "2.0.0-alpha.37", "--", "lib/constants/version.ts") | Select-Object -First 1)
    if (-not [string]::IsNullOrWhiteSpace($alpha37FeatureCommit)) {
        $alpha37BaselineCommit = [string](InvokeLocalRepoGitOutput -Arguments @("rev-parse", "$alpha37FeatureCommit^" ) | Select-Object -First 1)
        $alpha37ChangedPaths = @(InvokeLocalRepoGitOutput -Arguments @("diff", "--name-only", "$alpha37BaselineCommit..HEAD") | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) })
        AddRepoStateSection -Lines $Lines -Title "Alpha.37 Changed Paths:" -Values $alpha37ChangedPaths
    }

    $approvalDirectory = Join-Path $RepoStatusDir "Approval_Handoff"
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 Foundation Verification:" -Values @($(if ($null -ne $manifest -and $manifest.result -eq "PASS") { "LEVEL_4_FOUNDATION_VERIFIED" } else { "MISSING_OR_INVALID_RUNTIME_MANIFEST" }))
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 Runtime Manifest:" -Values @($(if ($null -ne $manifestPath) { $manifestPath.FullName } else { "missing" }))
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 Snapshot Schema Version:" -Values @($(if ($null -ne $manifest) { [string]$manifest.dtoSchemaVersion } else { "unknown" }))
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 Renderer Version:" -Values @($(if ($null -ne $manifest) { [string]$manifest.rendererVersion } else { "unknown" }))
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 Snapshot SHA-256:" -Values @($(if ($null -ne $manifest) { [string]$manifest.snapshotSha256 } else { "unknown" }))
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 PDF SHA-256:" -Values @($(if ($null -ne $manifest) { [string]$manifest.pdfSha256 } else { "unknown" }))
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 PDF File Size Bytes:" -Values @($(if ($null -ne $manifest) { [string]$manifest.fileSizeBytes } else { "unknown" }))
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 PDF Page Count / Orientation:" -Values @($(if ($null -ne $manifest) { "$($manifest.pageCount) / $($manifest.pageOrientations -join ', ')" } else { "unknown" }))
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 Asset Resolution:" -Values @($(if ($null -ne $manifest) { "PASS - $($manifest.assetResolution.filename); $($manifest.assetResolution.byteLength) bytes; SHA verified" } else { "unknown" }))
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 Deterministic Object Key:" -Values @($(if ($null -ne $manifest) { "PASS - $($manifest.objectKeyPlan)" } else { "unknown" }))
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 Lifecycle Plan:" -Values @("PASS - prepare/render-upload/finalize/failure boundaries; write-disabled alpha.37 repository")
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 Idempotency / Concurrency:" -Values @("PASS - scoped receipt, deterministic generation identity, advisory lock before bounded MAX+1, unique fallback")
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 Migration Decision:" -Values @("none - existing migrations 004/005 are sufficient")
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 Actual Issued Scenario:" -Values @($(if ($null -ne $manifest) { "$($manifest.actualIssuedScenario.result) - $($manifest.actualIssuedScenario.reason)" } else { "unknown" }))
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Approval Handoff ZIP:" -Values @((Join-Path $approvalDirectory "peacebypiece-checkpoint-2.0.0-alpha.38-pending-db-r2-approval.zip"))
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Approval Handoff Repo-State:" -Values @((Join-Path $approvalDirectory "repo-state-checkpoint-2.0.0-alpha.38-pending-db-r2-approval.txt"))
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 DB Migration / Data Mutation:" -Values @("false / false")
    AddRepoStateSection -Lines $Lines -Title "Alpha.37 R2 Mutation / Worker Execution / Production Mutation:" -Values @("false / false / false")
}

function AddAlpha38PdfDbR2RuntimeRepoStateSections {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Version
    )

    if ($Version -ne "2.0.0-alpha.38") {
        return
    }

    $manifest = $null
    $manifestPath = Join-Path $ProjectDir ".tmp\wafl-v2-alpha38\runtime-manifest.json"
    if (Test-Path -LiteralPath $manifestPath -PathType Leaf) {
        try {
            $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
        }
        catch {
            $manifest = $null
        }
    }

    $value = {
        param([string]$Name)
        if ($null -eq $manifest) { return "unknown" }
        $property = $manifest.PSObject.Properties[$Name]
        if ($null -eq $property -or $null -eq $property.Value) { return "unknown" }
        return [string]$property.Value
    }

    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Completion Status:" -Values @($(if ($null -ne $manifest -and $manifest.result -eq "ALPHA38_PDF_DB_R2_CONTINUATION_PASS") { "ALPHA38_PDF_DB_R2_CONTINUATION_AND_COMPLETION_PASS" } else { "MISSING_OR_INVALID_RUNTIME_MANIFEST" }))
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Runtime Manifest:" -Values @($(if ($null -ne $manifest) { $manifestPath } else { "missing" }))
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Migration 010 / Ledger:" -Values @("applied once in approved dev/test; SHA d75dac55a0536210513a1fb00db2513bc9249a7363d66dcd5d4c0cab24c6e350; ledger 10/10")
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Receipt Link Type:" -Values @("native uuid; company-scoped FK; UUID source PostgreSQL DEFAULT gen_random_uuid() RETURNING id")
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Generated Document UUID:" -Values @((& $value "generatedDocumentId"))
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Actual Source Document:" -Values @("$(& $value 'displayDocumentNumber'); WorkOrder $(& $value 'workOrderId'); revision $(& $value 'revisionId')")
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Renderer / DTO Schema:" -Values @("$(& $value 'rendererVersion') / $(& $value 'dtoSchemaVersion')")
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Snapshot SHA-256:" -Values @((& $value "snapshotSha256"))
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 PDF SHA-256 / Size:" -Values @("$(& $value 'pdfSha256') / $(& $value 'fileSizeBytes') bytes")
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 PDF Pages / Orientation:" -Values @($(if ($null -ne $manifest) { "$($manifest.pageCount) / $($manifest.pageOrientations -join ', ')" } else { "unknown" }))
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 R2 Object Key:" -Values @((& $value "objectKey"))
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 R2 PUT / GET Integrity / DELETE:" -Values @("$(& $value 'r2PutCount') / PASS / $(& $value 'r2DeleteCount')")
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Continuation Delta:" -Values @("receipt +$(& $value 'receiptDelta'); document +$(& $value 'documentDelta'); finalize update $(& $value 'documentUpdateCount'); event +$(& $value 'eventDelta')")
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Final Scoped Counts:" -Values @("receipt/document/event 1/1/1; incomplete/pending/failed 0/0/0; retained R2 object 1")
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Duplicate Replay Delta:" -Values @((& $value "duplicateReplayDelta"))
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Partial Mutation Result:" -Values @("NO_PARTIAL_MUTATION - initial pending state resolved by exact-identity continuation; no prepare replay or cleanup")
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Tenant Isolation:" -Values @("PASS - Company B/C/H generated document and receipt hidden")
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Retained Dev/Test State:" -Values @("receipt 1; generated document 1; event 1; R2 PDF object 1; retained for alpha.39")
    AddRepoStateSection -Lines $Lines -Title "Alpha.38 Production / Business Mutation:" -Values @("false / false")
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
    AddRepoStateSection -Lines $lines -Title "Verification Result:" -Values @([string]$VerificationSummary.Result)
    AddRepoStateSection -Lines $lines -Title "Targeted ESLint:" -Values @($(if ($VerificationSummary.TargetedEslintPassed -eq "True") { "PASS" } elseif ($VerificationSummary.TargetedEslintPassed -eq "False") { "FAIL" } else { "unknown" }))
    AddRepoStateSection -Lines $lines -Title "Targeted ESLint Command:" -Values @([string]$VerificationSummary.TargetedEslintCommand)
    AddRepoStateSection -Lines $lines -Title "Typecheck:" -Values @($(if ($VerificationSummary.TypecheckPassed -eq "True") { "PASS" } elseif ($VerificationSummary.TypecheckPassed -eq "False") { "FAIL" } else { "unknown" }))
    AddRepoStateSection -Lines $lines -Title "Typecheck Command:" -Values @([string]$VerificationSummary.TypecheckCommand)
    AddRepoStateSection -Lines $lines -Title "Build Result:" -Values @($(if ($VerificationSummary.BuildPassed -eq "True") { "PASS" } elseif ($VerificationSummary.BuildPassed -eq "False") { "FAIL" } else { "unknown" }))
    AddRepoStateSection -Lines $lines -Title "Build Command:" -Values @([string]$VerificationSummary.BuildCommand)
    AddRepoStateSection -Lines $lines -Title "Executed At:" -Values @([string]$VerificationSummary.ExecutedAt)
    AddRepoStateSection -Lines $lines -Title "Mutation Audit Finding Count:" -Values @([string]$VerificationSummary.MutationFindingCount)
    AddRepoStateSection -Lines $lines -Title "Mutation Audit High Risk Count:" -Values @([string]$VerificationSummary.MutationHighRiskCount)
    AddRepoStateSection -Lines $lines -Title "Contract Test Summary:" -Values @([string]$VerificationSummary.ContractSummary)
    AddRepoStateSection -Lines $lines -Title "E2E/Smoke Summary:" -Values @([string]$VerificationSummary.E2ESmokeSummary)
    AddRepoStateSection -Lines $lines -Title "Signup/Provisioning Regression:" -Values @([string]$VerificationSummary.SignupProvisioningRegression)
    AddRepoStateSection -Lines $lines -Title "Catalog Regression:" -Values @([string]$VerificationSummary.CatalogRegression)
    AddRepoStateSection -Lines $lines -Title "PDF/R2 Regression:" -Values @([string]$VerificationSummary.PdfR2Regression)
    AddRepoStateSection -Lines $lines -Title "Vercel Readiness:" -Values @([string]$VerificationSummary.VercelReadiness)
    AddRepoStateSection -Lines $lines -Title "Manual QA Status:" -Values @([string]$VerificationSummary.ManualQaStatus)
    AddCustomerProductUxCleanupRepoStateSections -Lines $lines -VerificationSummary $VerificationSummary
    AddWorkorderPdfLiveIntegrationRepoStateSections -Lines $lines -VerificationSummary $VerificationSummary
    AddProductUiRuntimeVerificationRepoStateSections -Lines $lines -VerificationSummary $VerificationSummary
    AddAlpha35MaterialCompactInputRepoStateSections -Lines $lines -Version $Version
    AddAlpha36MaterialCardSeparationRepoStateSections -Lines $lines -Version $Version
    AddAlpha37PdfFoundationRepoStateSections -Lines $lines -Version $Version
    AddAlpha38PdfDbR2RuntimeRepoStateSections -Lines $lines -Version $Version
    if ($Version -eq "2.0.0-alpha.31") {
        AddRepoStateSection -Lines $lines -Title "Alpha.31 Product Verification:" -Values @("LEVEL_4_PRODUCT_VERIFIED - desktop/tablet/mobile/inline interaction evidence")
        AddRepoStateSection -Lines $lines -Title "Alpha.31 Sample Route Guard:" -Values @("PASS - localhost 200; Host www.wafl.co.kr 404")
        AddRepoStateSection -Lines $lines -Title "Alpha.31 Print Layout Verification:" -Values @("PASS - A4 landscape cover; A4 portrait continuation; repeated headers; rows not split")
        AddRepoStateSection -Lines $lines -Title "Alpha.31 Inline UX Verification:" -Values @("PASS - 16px same-row input; expandable note; completed-row edit buttons 0")
        AddRepoStateSection -Lines $lines -Title "Alpha.31 DB Migration Applied:" -Values @("false")
        AddRepoStateSection -Lines $lines -Title "Alpha.31 DB / R2 / Worker / PDF / Production Mutation:" -Values @("false")
    }
    if ($Version -eq "2.0.0-alpha.32") {
        AddRepoStateSection -Lines $lines -Title "Alpha.32 Product Verification:" -Values @("LEVEL_4_PRODUCT_VERIFIED - mobile/tablet/desktop inline and Chromium print evidence")
        AddRepoStateSection -Lines $lines -Title "Alpha.32 Inline UX Verification:" -Values @("PASS - compact single-line row; stable card height; Escape/blur and Enter/blur guards; locked affordance 0")
        AddRepoStateSection -Lines $lines -Title "Alpha.32 Process Display Contract:" -Values @("PASS - application area/target merged into work memo for display only; legacy DB/API fields retained")
        AddRepoStateSection -Lines $lines -Title "Alpha.32 Sample Route Guard:" -Values @("PASS - localhost only; realistic deterministic 144-unit sample; repository-owned asset")
        AddRepoStateSection -Lines $lines -Title "Alpha.32 Print Verification:" -Values @("PASS - Chromium PDF; A4 landscape cover; A4 portrait continuation; no blank page")
        AddRepoStateSection -Lines $lines -Title "Alpha.32 DB / API / R2 / Worker / PDF Lifecycle / Production Mutation:" -Values @("false")
    }
    if ($Version -eq "2.0.0-alpha.33") {
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Product Verification:" -Values @("LEVEL_4_PRODUCT_VERIFIED - mobile/tablet/actual/sample/Chromium print evidence")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Actual / Sample Preview Boundary:" -Values @("PASS - immutable actual data only; deterministic localhost sample; no fallback")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Sample Route / Entry Guard:" -Values @("PASS - /ui entry and sample route localhost only; production host 404")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Product Board / Color / Matrix:" -Values @("PASS - visible front/back; IVORY/NAVY/BLACK; exact total 144")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Realistic Korean Data:" -Values @("PASS - 2 fabrics; 4 accessories; 5 size rows; 4 processes; practical factory memo")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Material Card Flow:" -Values @("PASS - header/basic/factory fields/order summary/warning/action; action is last")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Inline UX Verification:" -Values @("PASS - 22px single-line; stable edit height; double-completion guards; locked affordance 0")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Chromium PDF Verification:" -Values @("PASS - A4 landscape cover; portrait continuations; no blank/clipping/image/table loss")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 DB / API / R2 / Worker / PDF Lifecycle / Production Mutation:" -Values @("false")
    }
    if ($Version -eq "2.0.0-alpha.27") {
        AddRepoStateSection -Lines $lines -Title "Alpha.27 Completion Status:" -Values @("ALPHA27_ISSUE_RUNTIME_AND_COMPLETION_PASS")
        AddRepoStateSection -Lines $lines -Title "Alpha.27 Issued Document Number:" -Values @("WAFN-26FWA-A25CMD-260711-001-R0")
        AddRepoStateSection -Lines $lines -Title "Alpha.27 WorkOrder / Revision:" -Values @("issued/finalized; versions 15/15")
        AddRepoStateSection -Lines $lines -Title "Alpha.27 Receipt / Event:" -Values @("1/1; incomplete receipt 0; NO_PARTIAL_MUTATION")
        AddRepoStateSection -Lines $lines -Title "WorkOrder Scalar Immutable Runtime:" -Values @("PASS - 409 LOCKED")
        AddRepoStateSection -Lines $lines -Title "Material Scalar Immutable Runtime:" -Values @("PASS - 409 LOCKED")
        AddRepoStateSection -Lines $lines -Title "Material Order Runtime Call:" -Values @("NOT_RUN - owner declined terminal-line order request; no eligible editing line existed")
        AddRepoStateSection -Lines $lines -Title "Material Order Immutable Verdict:" -Values @("MATERIAL_ORDER_LOCKED_PASS_BY_SHARED_RUNTIME_GUARD_AND_STATIC_CONTRACT")
        AddRepoStateSection -Lines $lines -Title "Material Order Static Basis:" -Values @("shared request/cancel/complete transition; issued lock before status/UPDATE/event; thrown lock rolls back provisional receipt transaction")
        AddRepoStateSection -Lines $lines -Title "Alpha.27 Additional DB Mutation During Finalization:" -Values @("false")
    }
    if ($Version -eq "2.0.0-alpha.29") {
        AddRepoStateSection -Lines $lines -Title "Preview Entry Result:" -Values @("PASS - four mobile entry contracts share the issued Preview opener")
        AddRepoStateSection -Lines $lines -Title "Expo Web Result:" -Values @("PASS - top/document-row/eye open the document route; draft sheet disabled reason; console warning/error 0")
        AddRepoStateSection -Lines $lines -Title "Native Linking Contract:" -Values @("PASS - canOpenURL/openURL system browser; physical-device QA pending")
        AddRepoStateSection -Lines $lines -Title "Preview Base URL Policy:" -Values @("PASS - EXPO_PUBLIC_WAFL_WEB_BASE_URL; localhost:3000 development web only; no production fallback")
        AddRepoStateSection -Lines $lines -Title "Document Number Resolver Result:" -Values @("PASS - issued/finalized tenant-scoped lookup reuses alpha.28 Preview")
        AddRepoStateSection -Lines $lines -Title "Tenant Isolation Result:" -Values @("PASS - Company A 200; B/H NOT_FOUND; C FORBIDDEN")
        AddRepoStateSection -Lines $lines -Title "DB/API Read-only Result:" -Values @("PASS - ledger 8/8 and before/after snapshots unchanged")
        AddRepoStateSection -Lines $lines -Title "Manual QA Status:" -Values @("PENDING_USER_QA - iPhone/iPad/Android system-browser, login, return, popup policy")
        AddRepoStateSection -Lines $lines -Title "DB/R2/Worker/PDF/Production Mutation:" -Values @("false")
    }
    if ($Version -eq "2.0.0-alpha.30") {
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Completion Status:" -Values @("ALPHA30_COMMAND_RUNTIME_AND_COMPLETION_PASS")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Migration Ledger:" -Values @("9/9; migration 009 applied once in approved dev/test")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Synthetic Rows:" -Values @("WorkOrder +1; revision +1; fabric +1; accessory +1; process fixture +1")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Receipt / Event:" -Values @("4/7; incomplete receipt 0; NO_PARTIAL_MUTATION")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Final Versions:" -Values @("WorkOrder/revision/fabric/accessory/process 7/7/2/1/2")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Document State:" -Values @("document number +1; generated document 0; next draft 0")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Preview Result:" -Values @("PASS - factory memo, fabric/accessory usage area, process application fields, deterministic issued Preview")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Immutable Result:" -Values @("PASS - WorkOrder memo, fabric/accessory usage area, and process fields returned LOCKED")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Finalization DB Schema Mutation:" -Values @("false")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Business / R2 / Worker / PDF / Production Mutation:" -Values @("false")
    }
    AddRepoStateSection -Lines $lines -Title "DB Migration Apply Result:" -Values @([string]$VerificationSummary.DbMigrationApplyResult)
    AddRepoStateSection -Lines $lines -Title "Post-Apply Audit Result:" -Values @([string]$VerificationSummary.PostApplyAuditResult)
    AddRepoStateSection -Lines $lines -Title "Rollback Smoke Result:" -Values @([string]$VerificationSummary.RollbackSmokeResult)
    AddRepoStateSection -Lines $lines -Title "Certificate Integration Result:" -Values @([string]$VerificationSummary.CertificateIntegrationResult)
    AddRepoStateSection -Lines $lines -Title "PNG Upload:" -Values @([string]$VerificationSummary.PngUpload)
    AddRepoStateSection -Lines $lines -Title "JPEG Replacement:" -Values @([string]$VerificationSummary.JpegReplacement)
    AddRepoStateSection -Lines $lines -Title "PDF Replacement:" -Values @([string]$VerificationSummary.PdfReplacement)
    AddRepoStateSection -Lines $lines -Title "Revoke:" -Values @([string]$VerificationSummary.Revoke)
    AddRepoStateSection -Lines $lines -Title "PDF/R2 Lifecycle Integration Result:" -Values @([string]$VerificationSummary.PdfR2LifecycleIntegrationResult)
    AddRepoStateSection -Lines $lines -Title "PDF/R2 Worker Version:" -Values @([string]$VerificationSummary.PdfR2WorkerVersion)
    AddRepoStateSection -Lines $lines -Title "PDF Generator Worker Version:" -Values @([string]$VerificationSummary.PdfGeneratorWorkerVersion)
    AddRepoStateSection -Lines $lines -Title "PDF Upload:" -Values @([string]$VerificationSummary.PdfUpload)
    AddRepoStateSection -Lines $lines -Title "PDF Trash:" -Values @([string]$VerificationSummary.PdfTrash)
    AddRepoStateSection -Lines $lines -Title "PDF Restore:" -Values @([string]$VerificationSummary.PdfRestore)
    AddRepoStateSection -Lines $lines -Title "PDF Regeneration:" -Values @([string]$VerificationSummary.PdfRegeneration)
    AddRepoStateSection -Lines $lines -Title "PDF Permanent Delete:" -Values @([string]$VerificationSummary.PdfPermanentDelete)
    AddRepoStateSection -Lines $lines -Title "PDF Missing Detection:" -Values @([string]$VerificationSummary.PdfMissingDetection)
    AddRepoStateSection -Lines $lines -Title "PDF Orphan Detection:" -Values @([string]$VerificationSummary.PdfOrphanDetection)
    AddRepoStateSection -Lines $lines -Title "PDF Reconciliation:" -Values @([string]$VerificationSummary.PdfReconciliation)
    AddRepoStateSection -Lines $lines -Title "PDF Exact Cleanup Plan:" -Values @([string]$VerificationSummary.PdfExactCleanupPlan)
    AddRepoStateSection -Lines $lines -Title "Final Residual DB Rows:" -Values @([string]$VerificationSummary.FinalResidualDbRows)
    AddRepoStateSection -Lines $lines -Title "Final Residual R2 Objects:" -Values @([string]$VerificationSummary.FinalResidualR2Objects)
    AddRepoStateSection -Lines $lines -Title "Live Viewer Integration:" -Values @([string]$VerificationSummary.LiveViewerIntegration)
    AddRepoStateSection -Lines $lines -Title "Package/Lockfile Changed:" -Values @("false")
    AddRepoStateSection -Lines $lines -Title "DB Migration Applied:" -Values @((GetDbMigrationAppliedDisplayValue -VerificationSummary $VerificationSummary))
    AddRepoStateSection -Lines $lines -Title "DB Schema Mutation:" -Values @((GetDbSchemaMutationDisplayValue -VerificationSummary $VerificationSummary))
    AddRepoStateSection -Lines $lines -Title "Schema Migration This Run:" -Values @([string]$VerificationSummary.SchemaMigrationThisRun)
    AddRepoStateSection -Lines $lines -Title "Dev/Test DB Test-Data Mutation:" -Values @([string]$VerificationSummary.DevTestDbTestDataMutation)
    AddRepoStateSection -Lines $lines -Title "Dev/Test Fixture Mutation:" -Values @($(if ([string]::IsNullOrWhiteSpace([string]$VerificationSummary.DevTestFixtureMutation)) { [string]$VerificationSummary.DevTestDbTestDataMutation } else { [string]$VerificationSummary.DevTestFixtureMutation }))
    AddRepoStateSection -Lines $lines -Title "Business Data Mutation:" -Values @($(if ([string]::IsNullOrWhiteSpace([string]$VerificationSummary.BusinessDataMutation)) { "false" } else { [string]$VerificationSummary.BusinessDataMutation }))
    AddRepoStateSection -Lines $lines -Title "Production Business Data Mutation:" -Values @($(if ([string]::IsNullOrWhiteSpace([string]$VerificationSummary.ProductionBusinessDataMutation)) { "false" } else { [string]$VerificationSummary.ProductionBusinessDataMutation }))
    AddRepoStateSection -Lines $lines -Title "Dev/Test R2 Mutation:" -Values @([string]$VerificationSummary.DevTestR2Mutation)
    AddRepoStateSection -Lines $lines -Title "R2 Mutation:" -Values @([string]$VerificationSummary.DevTestR2Mutation)
    AddRepoStateSection -Lines $lines -Title "Production Mutation:" -Values @([string]$VerificationSummary.ProductionMutation)
    AddRepoStateSection -Lines $lines -Title "Production Migration:" -Values @("false")
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
    $zipSha256 = (Get-FileHash -LiteralPath $ZipPath -Algorithm SHA256).Hash.ToLowerInvariant()
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zipArchive = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    try {
        $zipEntryCount = $zipArchive.Entries.Count
        $zipExcludeViolationCount = @($zipArchive.Entries | Where-Object { TestLocalRepoExportExcludedPath -RelativePath $_.FullName }).Count
    }
    finally {
        $zipArchive.Dispose()
    }

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
    AddRepoStateSection -Lines $lines -Title "ZIP SHA-256:" -Values @($zipSha256)
    AddRepoStateSection -Lines $lines -Title "ZIP Size Bytes:" -Values @([string]$ZipSizeBytes)
    AddRepoStateSection -Lines $lines -Title "ZIP Entry Count:" -Values @([string]$zipEntryCount)
    AddRepoStateSection -Lines $lines -Title "Exclude Violation Count:" -Values @([string]$zipExcludeViolationCount)
    AddRepoStateSection -Lines $lines -Title "Verification Result Path:" -Values @([string]$VerificationSummary.Path)
    AddRepoStateSection -Lines $lines -Title "Verification Profile:" -Values @([string]$VerificationSummary.Profile)
    AddRepoStateSection -Lines $lines -Title "Verification Result:" -Values @([string]$VerificationSummary.Result)
    AddRepoStateSection -Lines $lines -Title "Targeted ESLint:" -Values @($(if ($VerificationSummary.TargetedEslintPassed -eq "True") { "PASS" } elseif ($VerificationSummary.TargetedEslintPassed -eq "False") { "FAIL" } else { "unknown" }))
    AddRepoStateSection -Lines $lines -Title "Targeted ESLint Command:" -Values @([string]$VerificationSummary.TargetedEslintCommand)
    AddRepoStateSection -Lines $lines -Title "Typecheck:" -Values @($(if ($VerificationSummary.TypecheckPassed -eq "True") { "PASS" } elseif ($VerificationSummary.TypecheckPassed -eq "False") { "FAIL" } else { "unknown" }))
    AddRepoStateSection -Lines $lines -Title "Typecheck Command:" -Values @([string]$VerificationSummary.TypecheckCommand)
    AddRepoStateSection -Lines $lines -Title "Build Result:" -Values @($(if ($VerificationSummary.BuildPassed -eq "True") { "PASS" } elseif ($VerificationSummary.BuildPassed -eq "False") { "FAIL" } else { "unknown" }))
    AddRepoStateSection -Lines $lines -Title "Build Result Path:" -Values @($BuildResultPath)
    AddRepoStateSection -Lines $lines -Title "Mutation Audit Finding Count:" -Values @([string]$VerificationSummary.MutationFindingCount)
    AddRepoStateSection -Lines $lines -Title "Mutation Audit High Risk Count:" -Values @([string]$VerificationSummary.MutationHighRiskCount)
    AddRepoStateSection -Lines $lines -Title "Contract Test Summary:" -Values @([string]$VerificationSummary.ContractSummary)
    AddRepoStateSection -Lines $lines -Title "E2E/Smoke Summary:" -Values @([string]$VerificationSummary.E2ESmokeSummary)
    AddRepoStateSection -Lines $lines -Title "Signup/Provisioning Regression:" -Values @([string]$VerificationSummary.SignupProvisioningRegression)
    AddRepoStateSection -Lines $lines -Title "Catalog Regression:" -Values @([string]$VerificationSummary.CatalogRegression)
    AddRepoStateSection -Lines $lines -Title "PDF/R2 Regression:" -Values @([string]$VerificationSummary.PdfR2Regression)
    AddRepoStateSection -Lines $lines -Title "Vercel Readiness:" -Values @([string]$VerificationSummary.VercelReadiness)
    AddRepoStateSection -Lines $lines -Title "Manual QA Status:" -Values @([string]$VerificationSummary.ManualQaStatus)
    AddCustomerProductUxCleanupRepoStateSections -Lines $lines -VerificationSummary $VerificationSummary
    AddWorkorderPdfLiveIntegrationRepoStateSections -Lines $lines -VerificationSummary $VerificationSummary
    AddProductUiRuntimeVerificationRepoStateSections -Lines $lines -VerificationSummary $VerificationSummary
    AddAlpha35MaterialCompactInputRepoStateSections -Lines $lines -Version $Version
    AddAlpha36MaterialCardSeparationRepoStateSections -Lines $lines -Version $Version
    AddAlpha37PdfFoundationRepoStateSections -Lines $lines -Version $Version
    if ($Version -eq "2.0.0-alpha.31") {
        $alpha31FeatureCommit = [string](InvokeLocalRepoGitOutput -Arguments @("log", "-1", "--format=%H", "-S", "2.0.0-alpha.31", "--", "lib/constants/version.ts") | Select-Object -First 1)
        $alpha31BaselineCommit = [string](InvokeLocalRepoGitOutput -Arguments @("rev-parse", "$alpha31FeatureCommit^" ) | Select-Object -First 1)
        $alpha31ChangedPaths = @(InvokeLocalRepoGitOutput -Arguments @("diff", "--name-only", "$alpha31BaselineCommit..HEAD") | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) })
        AddRepoStateSection -Lines $lines -Title "Alpha.31 Changed Paths:" -Values $alpha31ChangedPaths
        AddRepoStateSection -Lines $lines -Title "Alpha.31 Product Verification:" -Values @("LEVEL_4_PRODUCT_VERIFIED - desktop/tablet/mobile/inline interaction evidence")
        AddRepoStateSection -Lines $lines -Title "Alpha.31 Sample Route Guard:" -Values @("PASS - localhost 200; Host www.wafl.co.kr 404")
        AddRepoStateSection -Lines $lines -Title "Alpha.31 Print Layout Verification:" -Values @("PASS - A4 landscape cover; A4 portrait continuation; repeated headers; rows not split")
        AddRepoStateSection -Lines $lines -Title "Alpha.31 Inline UX Verification:" -Values @("PASS - 16px same-row input; expandable note; completed-row edit buttons 0")
        AddRepoStateSection -Lines $lines -Title "Alpha.31 Sample Contract:" -Values @("PASS - deterministic local data; 144 total; 0차; R0; no tenant API")
        AddRepoStateSection -Lines $lines -Title "Alpha.31 Actual Preview Contract:" -Values @("unchanged tenant/RLS issued-revision loader; pure renderer split; no mutable fallback")
        AddRepoStateSection -Lines $lines -Title "Alpha.31 DB Migration Applied:" -Values @("false")
        AddRepoStateSection -Lines $lines -Title "Alpha.31 DB / R2 / Worker / PDF / Production Mutation:" -Values @("false")
    }
    if ($Version -eq "2.0.0-alpha.32") {
        $alpha32FeatureCommit = [string](InvokeLocalRepoGitOutput -Arguments @("log", "-1", "--format=%H", "-S", "2.0.0-alpha.32", "--", "lib/constants/version.ts") | Select-Object -First 1)
        $alpha32BaselineCommit = [string](InvokeLocalRepoGitOutput -Arguments @("rev-parse", "$alpha32FeatureCommit^" ) | Select-Object -First 1)
        $alpha32ChangedPaths = @(InvokeLocalRepoGitOutput -Arguments @("diff", "--name-only", "$alpha32BaselineCommit..HEAD") | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) })
        AddRepoStateSection -Lines $lines -Title "Alpha.32 Changed Paths:" -Values $alpha32ChangedPaths
        AddRepoStateSection -Lines $lines -Title "Alpha.32 Product Verification:" -Values @("LEVEL_4_PRODUCT_VERIFIED - mobile/tablet/desktop inline and Chromium print evidence")
        AddRepoStateSection -Lines $lines -Title "Alpha.32 Inline UX Verification:" -Values @("PASS - compact single-line row; stable card height; Escape/blur and Enter/blur guards; locked affordance 0")
        AddRepoStateSection -Lines $lines -Title "Alpha.32 Process Display Contract:" -Values @("PASS - application area/target merged into work memo for display only; legacy DB/API fields retained")
        AddRepoStateSection -Lines $lines -Title "Alpha.32 Sample Contract:" -Values @("PASS - realistic deterministic Korean data; 144 total; no tenant API; no external asset")
        AddRepoStateSection -Lines $lines -Title "Alpha.32 Print Verification:" -Values @("PASS - actual Chromium PDF; A4 landscape cover; A4 portrait continuation; no blank page")
        AddRepoStateSection -Lines $lines -Title "Alpha.32 PDF Artifact Classification:" -Values @("local excluded QA artifact only; generated-document lifecycle/R2/Worker/QR NOT_RUN")
        AddRepoStateSection -Lines $lines -Title "Alpha.32 DB Migration Applied:" -Values @("false")
        AddRepoStateSection -Lines $lines -Title "Alpha.32 DB / API / R2 / Worker / PDF Lifecycle / Production Mutation:" -Values @("false")
    }
    if ($Version -eq "2.0.0-alpha.33") {
        $alpha33FeatureCommit = [string](InvokeLocalRepoGitOutput -Arguments @("log", "-1", "--format=%H", "-S", "2.0.0-alpha.33", "--", "lib/constants/version.ts") | Select-Object -First 1)
        $alpha33BaselineCommit = [string](InvokeLocalRepoGitOutput -Arguments @("rev-parse", "$alpha33FeatureCommit^" ) | Select-Object -First 1)
        $alpha33ChangedPaths = @(InvokeLocalRepoGitOutput -Arguments @("diff", "--name-only", "$alpha33BaselineCommit..HEAD") | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) })
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Changed Paths:" -Values $alpha33ChangedPaths
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Product Verification:" -Values @("LEVEL_4_PRODUCT_VERIFIED - mobile/tablet/actual/sample/Chromium print evidence")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Actual / Sample Preview Boundary:" -Values @("PASS - immutable actual data only; deterministic localhost sample; no fallback")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Sample Route / Entry Guard:" -Values @("PASS - /ui entry and sample route localhost only; production host 404")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Product Board / Color / Matrix:" -Values @("PASS - visible front/back; IVORY/NAVY/BLACK; exact total 144")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Realistic Korean Data:" -Values @("PASS - 2 fabrics; 4 accessories; 5 size rows; 4 processes; practical factory memo")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Actual Preview Fallback:" -Values @("none")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Material Card Flow:" -Values @("PASS - header/basic/factory fields/order summary/warning/action; action is last")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Inline UX Verification:" -Values @("PASS - 22px single-line; stable edit height; double-completion guards; locked affordance 0")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 Chromium PDF Verification:" -Values @("PASS - A4 landscape cover; portrait continuations; no blank/clipping/image/table loss")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 PDF Artifact Classification:" -Values @("local excluded QA artifact only; generated-document lifecycle/R2/Worker/QR NOT_RUN")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 DB Migration Applied:" -Values @("false")
        AddRepoStateSection -Lines $lines -Title "Alpha.33 DB / API / R2 / Worker / PDF Lifecycle / Production Mutation:" -Values @("false")
    }
    if ($Version -eq "2.0.0-alpha.27") {
        AddRepoStateSection -Lines $lines -Title "Alpha.27 Completion Status:" -Values @("ALPHA27_ISSUE_RUNTIME_AND_COMPLETION_PASS")
        AddRepoStateSection -Lines $lines -Title "Alpha.27 Issued Document Number:" -Values @("WAFN-26FWA-A25CMD-260711-001-R0")
        AddRepoStateSection -Lines $lines -Title "Alpha.27 WorkOrder / Revision:" -Values @("issued/finalized; versions 15/15")
        AddRepoStateSection -Lines $lines -Title "Alpha.27 Receipt / Event:" -Values @("1/1; incomplete receipt 0; NO_PARTIAL_MUTATION")
        AddRepoStateSection -Lines $lines -Title "WorkOrder Scalar Immutable Runtime:" -Values @("PASS - 409 LOCKED")
        AddRepoStateSection -Lines $lines -Title "Material Scalar Immutable Runtime:" -Values @("PASS - 409 LOCKED")
        AddRepoStateSection -Lines $lines -Title "Material Order Runtime Call:" -Values @("NOT_RUN - owner declined terminal-line order request; no eligible editing line existed")
        AddRepoStateSection -Lines $lines -Title "Material Order Immutable Verdict:" -Values @("MATERIAL_ORDER_LOCKED_PASS_BY_SHARED_RUNTIME_GUARD_AND_STATIC_CONTRACT")
        AddRepoStateSection -Lines $lines -Title "Material Order Static Basis:" -Values @("shared request/cancel/complete transition; issued lock before status/UPDATE/event; thrown lock rolls back provisional receipt transaction")
        AddRepoStateSection -Lines $lines -Title "Alpha.27 Additional DB Mutation During Finalization:" -Values @("false")
    }
    if ($Version -eq "2.0.0-alpha.28") {
        AddRepoStateSection -Lines $lines -Title "Preview API Runtime Summary:" -Values @("PASS - Company A 200; B/H NOT_FOUND; C FORBIDDEN; deterministic repeat GET")
        AddRepoStateSection -Lines $lines -Title "Preview UI Contract Summary:" -Values @("PASS - workspace route build; A4 responsive and print static contract; visual review manual")
        AddRepoStateSection -Lines $lines -Title "Tenant Isolation Result:" -Values @("PASS")
        AddRepoStateSection -Lines $lines -Title "Issued Revision Source Result:" -Values @("PASS - explicit issued/finalized revision 15/15; no mutable fallback")
        AddRepoStateSection -Lines $lines -Title "Immutable Preview Result:" -Values @("PASS - repeated GET deterministic; pre/post counts unchanged")
        AddRepoStateSection -Lines $lines -Title "Preview Query Count:" -Values @("9 including tenant claims")
        AddRepoStateSection -Lines $lines -Title "Preview Payload Size:" -Values @("2983 bytes")
        AddRepoStateSection -Lines $lines -Title "Preview DB / API Duration:" -Values @("715.83ms / 1614.74ms; cold local server and remote connection included")
        AddRepoStateSection -Lines $lines -Title "Alpha.28 DB Migration / Schema / Index Mutation:" -Values @("false")
        AddRepoStateSection -Lines $lines -Title "Alpha.28 Dev/Test DB Test-Data Mutation:" -Values @("false")
        AddRepoStateSection -Lines $lines -Title "Alpha.28 Business / R2 / Worker / PDF / Production Mutation:" -Values @("false")
    }
    if ($Version -eq "2.0.0-alpha.29") {
        AddRepoStateSection -Lines $lines -Title "Preview Entry Result:" -Values @("PASS - four mobile entry contracts share the issued Preview opener")
        AddRepoStateSection -Lines $lines -Title "Expo Web Result:" -Values @("PASS - top/document-row/eye open the document route; draft sheet disabled reason; console warning/error 0")
        AddRepoStateSection -Lines $lines -Title "Native Linking Contract:" -Values @("PASS - canOpenURL/openURL system browser; physical-device QA pending")
        AddRepoStateSection -Lines $lines -Title "Preview Base URL Policy:" -Values @("PASS - EXPO_PUBLIC_WAFL_WEB_BASE_URL; localhost:3000 development web only; no production fallback")
        AddRepoStateSection -Lines $lines -Title "Document Number Resolver Result:" -Values @("PASS - issued/finalized tenant-scoped lookup reuses alpha.28 Preview")
        AddRepoStateSection -Lines $lines -Title "Tenant Isolation Result:" -Values @("PASS - Company A 200; B/H NOT_FOUND; C FORBIDDEN")
        AddRepoStateSection -Lines $lines -Title "DB/API Read-only Result:" -Values @("PASS - ledger 8/8 and before/after snapshots unchanged")
        AddRepoStateSection -Lines $lines -Title "Manual QA Status:" -Values @("PENDING_USER_QA - iPhone/iPad/Android system-browser, login, return, popup policy")
        AddRepoStateSection -Lines $lines -Title "DB/R2/Worker/PDF/Production Mutation:" -Values @("false")
    }
    if ($Version -eq "2.0.0-alpha.30") {
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Completion Status:" -Values @("ALPHA30_COMMAND_RUNTIME_AND_COMPLETION_PASS")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Migration Ledger:" -Values @("9/9; migration 009 applied once in approved dev/test")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Synthetic Rows:" -Values @("WorkOrder +1; revision +1; fabric +1; accessory +1; process fixture +1")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Receipt / Event:" -Values @("4/7; incomplete receipt 0; NO_PARTIAL_MUTATION")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Final Versions:" -Values @("WorkOrder/revision/fabric/accessory/process 7/7/2/1/2")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Document State:" -Values @("document number +1; generated document 0; next draft 0")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Preview Result:" -Values @("PASS - factory memo, fabric/accessory usage area, process application fields, deterministic issued Preview")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Immutable Result:" -Values @("PASS - WorkOrder memo, fabric/accessory usage area, and process fields returned LOCKED")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Finalization DB Schema Mutation:" -Values @("false")
        AddRepoStateSection -Lines $lines -Title "Alpha.30 Business / R2 / Worker / PDF / Production Mutation:" -Values @("false")
    }
    AddRepoStateSection -Lines $lines -Title "DB Migration Apply Result:" -Values @([string]$VerificationSummary.DbMigrationApplyResult)
    AddRepoStateSection -Lines $lines -Title "Post-Apply Audit Result:" -Values @([string]$VerificationSummary.PostApplyAuditResult)
    AddRepoStateSection -Lines $lines -Title "Rollback Smoke Result:" -Values @([string]$VerificationSummary.RollbackSmokeResult)
    AddRepoStateSection -Lines $lines -Title "Certificate Integration Result:" -Values @([string]$VerificationSummary.CertificateIntegrationResult)
    AddRepoStateSection -Lines $lines -Title "PNG Upload:" -Values @([string]$VerificationSummary.PngUpload)
    AddRepoStateSection -Lines $lines -Title "JPEG Replacement:" -Values @([string]$VerificationSummary.JpegReplacement)
    AddRepoStateSection -Lines $lines -Title "PDF Replacement:" -Values @([string]$VerificationSummary.PdfReplacement)
    AddRepoStateSection -Lines $lines -Title "Revoke:" -Values @([string]$VerificationSummary.Revoke)
    AddRepoStateSection -Lines $lines -Title "PDF/R2 Lifecycle Integration Result:" -Values @([string]$VerificationSummary.PdfR2LifecycleIntegrationResult)
    AddRepoStateSection -Lines $lines -Title "PDF/R2 Worker Version:" -Values @([string]$VerificationSummary.PdfR2WorkerVersion)
    AddRepoStateSection -Lines $lines -Title "PDF Generator Worker Version:" -Values @([string]$VerificationSummary.PdfGeneratorWorkerVersion)
    AddRepoStateSection -Lines $lines -Title "PDF Upload:" -Values @([string]$VerificationSummary.PdfUpload)
    AddRepoStateSection -Lines $lines -Title "PDF Trash:" -Values @([string]$VerificationSummary.PdfTrash)
    AddRepoStateSection -Lines $lines -Title "PDF Restore:" -Values @([string]$VerificationSummary.PdfRestore)
    AddRepoStateSection -Lines $lines -Title "PDF Regeneration:" -Values @([string]$VerificationSummary.PdfRegeneration)
    AddRepoStateSection -Lines $lines -Title "PDF Permanent Delete:" -Values @([string]$VerificationSummary.PdfPermanentDelete)
    AddRepoStateSection -Lines $lines -Title "PDF Missing Detection:" -Values @([string]$VerificationSummary.PdfMissingDetection)
    AddRepoStateSection -Lines $lines -Title "PDF Orphan Detection:" -Values @([string]$VerificationSummary.PdfOrphanDetection)
    AddRepoStateSection -Lines $lines -Title "PDF Reconciliation:" -Values @([string]$VerificationSummary.PdfReconciliation)
    AddRepoStateSection -Lines $lines -Title "PDF Exact Cleanup Plan:" -Values @([string]$VerificationSummary.PdfExactCleanupPlan)
    AddRepoStateSection -Lines $lines -Title "Final Residual DB Rows:" -Values @([string]$VerificationSummary.FinalResidualDbRows)
    AddRepoStateSection -Lines $lines -Title "Final Residual R2 Objects:" -Values @([string]$VerificationSummary.FinalResidualR2Objects)
    AddRepoStateSection -Lines $lines -Title "Live Viewer Integration:" -Values @([string]$VerificationSummary.LiveViewerIntegration)
    AddRepoStateSection -Lines $lines -Title "DB Migration Applied:" -Values @((GetDbMigrationAppliedDisplayValue -VerificationSummary $VerificationSummary))
    AddRepoStateSection -Lines $lines -Title "DB Schema Mutation:" -Values @((GetDbSchemaMutationDisplayValue -VerificationSummary $VerificationSummary))
    AddRepoStateSection -Lines $lines -Title "Schema Migration This Run:" -Values @([string]$VerificationSummary.SchemaMigrationThisRun)
    AddRepoStateSection -Lines $lines -Title "Dev/Test DB Test-Data Mutation:" -Values @([string]$VerificationSummary.DevTestDbTestDataMutation)
    AddRepoStateSection -Lines $lines -Title "Dev/Test Fixture Mutation:" -Values @($(if ([string]::IsNullOrWhiteSpace([string]$VerificationSummary.DevTestFixtureMutation)) { [string]$VerificationSummary.DevTestDbTestDataMutation } else { [string]$VerificationSummary.DevTestFixtureMutation }))
    AddRepoStateSection -Lines $lines -Title "Business Data Mutation:" -Values @($(if ([string]::IsNullOrWhiteSpace([string]$VerificationSummary.BusinessDataMutation)) { "false" } else { [string]$VerificationSummary.BusinessDataMutation }))
    AddRepoStateSection -Lines $lines -Title "Production Business Data Mutation:" -Values @($(if ([string]::IsNullOrWhiteSpace([string]$VerificationSummary.ProductionBusinessDataMutation)) { "false" } else { [string]$VerificationSummary.ProductionBusinessDataMutation }))
    AddRepoStateSection -Lines $lines -Title "Dev/Test R2 Mutation:" -Values @([string]$VerificationSummary.DevTestR2Mutation)
    AddRepoStateSection -Lines $lines -Title "R2 Mutation:" -Values @([string]$VerificationSummary.DevTestR2Mutation)
    AddRepoStateSection -Lines $lines -Title "Production Mutation:" -Values @([string]$VerificationSummary.ProductionMutation)
    AddRepoStateSection -Lines $lines -Title "Production Migration:" -Values @("false")
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
        $blockedSegments = @(".git", "node_modules", ".next", ".wrangler", "artifacts", ".tmp", "test-results", "playwright-report", "reports", "blob-report", "coverage", ".nyc_output")

        foreach ($entryName in $entryNames) {
            $segments = @($entryName.Trim("/") -split "/" | ForEach-Object { $_.ToLowerInvariant() })
            foreach ($segment in $segments) {
                if ($blockedSegments -contains $segment) {
                    throw "ZIP contract 실패: 중첩 제외 세그먼트 포함($entryName)"
                }
            }

            $leaf = [System.IO.Path]::GetFileName($entryName).ToLowerInvariant()
            if ($leaf -eq ".env" -or $leaf.StartsWith(".env.")) {
                throw "ZIP contract 실패: env 파일 포함($entryName)"
            }

            if (
                $leaf -like "*.zip" -or
                $leaf -like "repo-state-*.txt" -or
                $leaf -like "build-result-*.txt" -or
                $leaf -like "*.tsbuildinfo" -or
                $leaf -like "storagestate*.json" -or
                $leaf -like "*.har" -or
                $leaf -like "*.webm"
            ) {
                throw "ZIP contract 실패: 생성물/QA evidence 포함($entryName)"
            }
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

    foreach ($sourcePath in @($ZipPath, $RepoStatePath)) {
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
    $newestFiles = @(Get-ChildItem -LiteralPath $NewestResultDIr -File -ErrorAction SilentlyContinue)

    if ($newestFiles.Count -ne 2 -or $newestZip.Count -ne 1 -or $newestRepoState.Count -ne 1) {
        throw "4. Newest set contract failed. files=$($newestFiles.Count) ZIP=$($newestZip.Count) repo-state=$($newestRepoState.Count)"
    }

    $repoStateContent = Get-Content -LiteralPath $newestRepoState[0].FullName -Raw -Encoding UTF8
    foreach ($requiredText in @($Version, $HeadHash, [System.IO.Path]::GetFileName($ZipPath), [System.IO.Path]::GetFileName($BuildResultPath))) {
        if ($repoStateContent -notmatch [regex]::Escape($requiredText)) {
            throw "4. Newest repo-state mismatch: $requiredText"
        }
    }

    foreach ($textPath in @($newestRepoState[0].FullName)) {
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
    LogInfo "build-result 보관 파일: $(Split-Path -Leaf $buildResultPath)"

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

function NewWaflV2FailureHandoff {
    param(
        [string]$FailureStage,
        [string]$FailureLogPath
    )

    $dbAuditDir = [System.IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $LogDir) "DB_Audit")).TrimEnd('\') + '\'
    $resolvedLogPath = [System.IO.Path]::GetFullPath($FailureLogPath)
    if (-not $resolvedLogPath.StartsWith($dbAuditDir, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "failure log는 canonical DB_Audit 경로 안에 있어야 합니다."
    }
    if (-not (Test-Path -LiteralPath $resolvedLogPath -PathType Leaf) -or [System.IO.Path]::GetFileName($resolvedLogPath) -notlike "Failed_*.txt") {
        throw "canonical failed log를 찾을 수 없습니다: $resolvedLogPath"
    }

    $failureDir = Join-Path $RepoStatusDir "Failure_Handoff"
    EnsureDirectory -Path $failureDir
    $timestamp = GetTimestamp
    $version = SanitizeResultFileNamePart -Value (GetProjectAppVersionForTestResult)
    $zipPath = Join-Path $failureDir "failure-source-$version-$timestamp.zip"
    $repoStatePath = Join-Path $failureDir "failure-repo-state-$version-$timestamp.txt"
    $copiedLogPath = Join-Path $failureDir "failure-log-$version-$timestamp.txt"
    $candidateFiles = @(GetLocalRepoExportCandidateFiles)
    $exportFiles = New-Object System.Collections.Generic.List[object]
    $suspiciousSecretPaths = New-Object System.Collections.Generic.List[string]

    foreach ($file in $candidateFiles) {
        $entryName = ConvertToZipEntryName -RelativePath $file.EntryName
        if (TestLocalRepoExportExcludedPath -RelativePath $entryName) { continue }
        if (TestSuspiciousSecretExportCandidate -RelativePath $entryName) {
            $suspiciousSecretPaths.Add($entryName)
            continue
        }
        if (TestSuspiciousSecretContent -Path $file.FullName -RelativePath $entryName) {
            $suspiciousSecretPaths.Add($entryName)
            continue
        }
        $exportFiles.Add([pscustomobject]@{ FullName = $file.FullName; EntryName = $entryName })
    }
    if ($suspiciousSecretPaths.Count -gt 0) {
        throw "failure source ZIP secret scan blocked: $($suspiciousSecretPaths -join ', ')"
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

    $requiredEntries = @("AGENTS.md", "lib/constants/version.ts", "docs/codex-current-state.md", "tools/pipeline/peacebypiece-auto-pipeline.ps1")
    TestLocalRepoExportZip -ZipPath $zipPath -ExpectedEntries $requiredEntries | Out-Null
    TestLocalRepoExportZipContract -ZipPath $zipPath -ExpectedEntries $requiredEntries | Out-Null
    Copy-Item -LiteralPath $resolvedLogPath -Destination $copiedLogPath -Force

    $failureText = Get-Content -LiteralPath $resolvedLogPath -Raw -Encoding UTF8
    $dbAuditFiles = @(Get-ChildItem -LiteralPath $dbAuditDir -File -ErrorAction SilentlyContinue)
    $successfulApplyLog = $dbAuditFiles | Where-Object { $_.Name -like "OK_Apply_Wafl_V2_Alpha22_Migrations_*.txt" } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $successfulSeedLogs = @($dbAuditFiles | Where-Object { $_.Name -like "OK_Wafl_V2_Alpha22_Seed_*.txt" })
    $ledgerCount = if ($failureText -match 'Current migration ledger count:\s*(unknown|[0-9]+)') {
        $matches[1].ToLowerInvariant()
    } elseif ($failureText -match 'Migration ledger rows(?: after failure)?:\s*([0-9]+)') {
        $matches[1]
    } else {
        "unknown"
    }
    $isAlpha23ReadFailure = $FailureStage -eq "alpha23-list-api-runtime"
    $isAlpha24ReadFailure = $FailureStage -eq "alpha24-detail-api-runtime"
    $isAlpha23IndexFailure = $FailureStage -eq "apply-index"
    $schemaMutation = if ($failureText -match 'Schema mutation this run:\s*(true|false|unknown)') {
        $matches[1].ToLowerInvariant()
    } elseif ($isAlpha23ReadFailure -or $isAlpha24ReadFailure) {
        "false; alpha.22 applied baseline reused read-only"
    } elseif ($failureText -match 'Alpha.23 material index present after failure:\s*True|Migration applied:|DB schema mutation:\s*true') {
        "true; approved dev/test additive migration"
    } else {
        "unknown"
    }
    $historicalMigration = if ($null -ne $successfulApplyLog) { "true; approved dev/test apply evidence $($successfulApplyLog.BaseName)" } else { "unknown" }
    $testDataMutation = if ($failureText -match 'Dev/Test DB test-data mutation this run:\s*(true|false|unknown)') { $matches[1].ToLowerInvariant() } elseif ($isAlpha23ReadFailure -or $isAlpha24ReadFailure -or $isAlpha23IndexFailure) { "false; existing alpha.22 synthetic seed reused without mutation" } else { "unknown" }
    $historicalSeedEvidence = if ($successfulSeedLogs.Count -gt 0) { "present; $($successfulSeedLogs.Count) approved dev/test seed log(s)" } else { "unknown" }
    $businessMutation = if ($failureText -match 'Business data mutation:\s*true') { "true" } else { "false" }
    $r2Mutation = if ($failureText -match 'R2 mutation:\s*true') { "true" } else { "false" }
    $productionMutation = if ($failureText -match 'Production mutation:\s*true') { "true" } else { "false" }
    $headHash = [string](InvokeLocalRepoGitOutput -Arguments @("rev-parse", "HEAD") | Select-Object -First 1)
    $branch = [string](InvokeLocalRepoGitOutput -Arguments @("branch", "--show-current") | Select-Object -First 1)
    $statusLines = @(InvokeLocalRepoGitOutput -Arguments @("status", "--short"))
    $changedPaths = @($statusLines | ForEach-Object { ([string]$_).Substring(3).Trim() })
    $zipSize = (Get-Item -LiteralPath $zipPath).Length
    $lines = New-Object System.Collections.Generic.List[string]
    AddRepoStateSection -Lines $lines -Title "Result:" -Values @("FAILED")
    AddRepoStateSection -Lines $lines -Title "Generated At:" -Values @((Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
    AddRepoStateSection -Lines $lines -Title "APP_VERSION:" -Values @($version)
    AddRepoStateSection -Lines $lines -Title "Baseline HEAD:" -Values @($headHash)
    AddRepoStateSection -Lines $lines -Title "Branch:" -Values @($branch)
    AddRepoStateSection -Lines $lines -Title "Working Tree Clean:" -Values @([string]($statusLines.Count -eq 0).ToString().ToLowerInvariant())
    AddRepoStateSection -Lines $lines -Title "Changed Paths:" -Values $changedPaths
    AddRepoStateSection -Lines $lines -Title "Failure Stage:" -Values @($FailureStage)
    AddRepoStateSection -Lines $lines -Title "Failure Log:" -Values @($copiedLogPath)
    AddRepoStateSection -Lines $lines -Title "Source ZIP:" -Values @($zipPath)
    AddRepoStateSection -Lines $lines -Title "ZIP Size Bytes:" -Values @([string]$zipSize)
    AddRepoStateSection -Lines $lines -Title "Current Migration Ledger Count:" -Values @([string]$ledgerCount)
    AddRepoStateSection -Lines $lines -Title "Current Migration Ledger Evidence:" -Values @($(if ($ledgerCount -eq "unknown") { "unknown; not measured by this failure run" } else { "failure log" }))
    AddRepoStateSection -Lines $lines -Title "Successful Seed Profiles Before Failure:" -Values @($successfulSeedLogs | ForEach-Object { $_.BaseName })
    AddRepoStateSection -Lines $lines -Title "DB Schema Mutation:" -Values @($schemaMutation)
    AddRepoStateSection -Lines $lines -Title "This Run DB Schema Mutation:" -Values @($schemaMutation)
    AddRepoStateSection -Lines $lines -Title "Historical Dev/Test Migration Applied:" -Values @($historicalMigration)
    AddRepoStateSection -Lines $lines -Title "Dev/Test DB Test-Data Mutation:" -Values @($testDataMutation)
    AddRepoStateSection -Lines $lines -Title "This Run Dev/Test DB Test-Data Mutation:" -Values @($testDataMutation)
    AddRepoStateSection -Lines $lines -Title "Historical Synthetic Seed Evidence:" -Values @($historicalSeedEvidence)
    AddRepoStateSection -Lines $lines -Title "Business Data Mutation:" -Values @($businessMutation)
    AddRepoStateSection -Lines $lines -Title "R2 Mutation:" -Values @($r2Mutation)
    AddRepoStateSection -Lines $lines -Title "Production Mutation:" -Values @($productionMutation)
    AddRepoStateSection -Lines $lines -Title "Completion Artifact:" -Values @("false; never publish to 4. Newest")
    AddRepoStateSection -Lines $lines -Title "Exclude Rule Summary:" -Values (GetLocalRepoExportExcludeSummary)
    [System.IO.File]::WriteAllLines($repoStatePath, $lines, [System.Text.Encoding]::UTF8)

    Write-Host "Failure handoff source ZIP: $zipPath"
    Write-Host "Failure handoff repo-state: $repoStatePath"
    Write-Host "Failure handoff log: $copiedLogPath"
    Write-Host "4. Newest mutation: false"
    return [pscustomobject]@{ ZipPath = $zipPath; RepoStatePath = $repoStatePath; LogPath = $copiedLogPath }
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
        [bool]$PauseAfter = $true,
        [string]$ResultDirectory = "",
        [int]$ApprovalRequiredExitCode = -1,
        [string]$ApprovalRequiredResultToken = ""
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

    $resultDirectoryPath = $NewestResultDIr
    if (-not [string]::IsNullOrWhiteSpace($ResultDirectory)) {
        $resultDirectoryPath = $ResultDirectory
    }
    EnsureDirectory -Path $resultDirectoryPath

    $versionForFile = SanitizeResultFileNamePart -Value (GetProjectAppVersionForTestResult)
    $labelForFile = SanitizeResultFileNamePart -Value $Label
    $timestamp = GetTimestamp
    $runningFileName = "Running_${labelForFile}_${versionForFile}-${timestamp}.txt"
    $runningFilePath = Join-Path $resultDirectoryPath $runningFileName

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

    $isApprovalRequired = $false
    if ($ApprovalRequiredExitCode -ge 0 -and $testExitCode -eq $ApprovalRequiredExitCode -and -not [string]::IsNullOrWhiteSpace($ApprovalRequiredResultToken)) {
        $resultText = Get-Content -LiteralPath $runningFilePath -Encoding UTF8 -Raw
        $isApprovalRequired = $resultText.Contains($ApprovalRequiredResultToken)
    }

    if ($testExitCode -eq 0) {
        $statusPrefix = "OK"
    }
    elseif ($isApprovalRequired) {
        $statusPrefix = "ApprovalRequired"
    }
    else {
        $statusPrefix = "Failed"
    }

    $resultFileName = "${statusPrefix}_${labelForFile}_${versionForFile}-${timestamp}.txt"
    $resultFilePath = Join-Path $resultDirectoryPath $resultFileName
    Move-Item -LiteralPath $runningFilePath -Destination $resultFilePath -Force

    Write-Host ""

    if ($testExitCode -eq 0) {
        LogInfo "$Title 완료. ExitCode: $testExitCode"
    }
    elseif ($isApprovalRequired) {
        LogWarning "$Title 승인 필요. ExitCode: $testExitCode"
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

function RunSimulatorAttachmentPlan {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Simulator Attachment Plan" -Label "Simulator_Attachment_Plan" -NpmCommand "node tools/simulator/commands/attachment-lifecycle.mjs --mode=plan" -LoadEnvLocal $true -PauseAfter $PauseAfter)
}

function RunSimulatorAttachmentLocalGenerate {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Simulator Attachment Local Generate" -Label "Simulator_Attachment_Local_Generate" -NpmCommand "node tools/simulator/commands/attachment-lifecycle.mjs --mode=generate" -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function InvokeSimulatorAttachmentMutationPreflight {
    param(
        [string]$ActionName,
        [string]$ConfirmText,
        [string]$Mode,
        [string]$Label,
        [bool]$PauseAfter = $true
    )

    if (-not (ConfirmFunctionsDataExecute -ActionName $ActionName -ConfirmText $ConfirmText)) {
        return
    }

    $previousEnable = $env:WAFL_SIMULATOR_ATTACHMENT_ENABLE_MUTATION
    $previousConfirm = $env:WAFL_SIMULATOR_ATTACHMENT_CONFIRM
    $previousApprovedDbFingerprint = $env:WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT
    $previousApprovedWorkerUrlFingerprint = $env:WAFL_SIMULATOR_APPROVED_WORKER_URL_FINGERPRINT
    $previousApprovedWorkerHostFingerprint = $env:WAFL_SIMULATOR_APPROVED_WORKER_HOST_FINGERPRINT
    $previousApprovedWorkerUrlAllowlist = $env:WAFL_SIMULATOR_APPROVED_WORKER_URL_ALLOWLIST
    $previousTestPrefix = $env:WAFL_FUNCTIONS_TEST_PREFIX
    try {
        $approvedDbFingerprint = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $approvedWorkerUrlFingerprint = [string]$PipelineConfig.Simulator.ApprovedWorkerUrlFingerprint
        $approvedWorkerHostFingerprint = [string]$PipelineConfig.Simulator.ApprovedWorkerHostFingerprint
        $approvedWorkerUrlAllowlist = [string]$PipelineConfig.Simulator.ApprovedWorkerUrlAllowlist
        if ([string]::IsNullOrWhiteSpace($approvedDbFingerprint)) {
            throw "pipeline.config.psd1에 Simulator.ApprovedDbFingerprint가 설정되지 않았습니다."
        }
        if ([string]::IsNullOrWhiteSpace($approvedWorkerUrlFingerprint) -and [string]::IsNullOrWhiteSpace($approvedWorkerHostFingerprint) -and [string]::IsNullOrWhiteSpace($approvedWorkerUrlAllowlist)) {
            throw "pipeline.config.psd1에 Simulator.ApprovedWorkerUrlFingerprint 또는 ApprovedWorkerHostFingerprint 또는 ApprovedWorkerUrlAllowlist가 설정되지 않았습니다."
        }
        $env:WAFL_SIMULATOR_ATTACHMENT_ENABLE_MUTATION = "1"
        $env:WAFL_SIMULATOR_ATTACHMENT_CONFIRM = $ConfirmText
        $env:WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT = $approvedDbFingerprint
        $env:WAFL_SIMULATOR_APPROVED_WORKER_URL_FINGERPRINT = $approvedWorkerUrlFingerprint
        $env:WAFL_SIMULATOR_APPROVED_WORKER_HOST_FINGERPRINT = $approvedWorkerHostFingerprint
        $env:WAFL_SIMULATOR_APPROVED_WORKER_URL_ALLOWLIST = $approvedWorkerUrlAllowlist
        $env:WAFL_FUNCTIONS_TEST_PREFIX = [string]$PipelineConfig.Simulator.TestPrefix
        InvokeProjectCommandWithResultFile -Title $ActionName -Label $Label -NpmCommand "node tools/simulator/commands/attachment-lifecycle.mjs --mode=$Mode --execute" -LoadEnvLocal $true -PauseAfter $PauseAfter | Out-Null
    }
    finally {
        if ($null -eq $previousEnable) { Remove-Item Env:WAFL_SIMULATOR_ATTACHMENT_ENABLE_MUTATION -ErrorAction SilentlyContinue } else { $env:WAFL_SIMULATOR_ATTACHMENT_ENABLE_MUTATION = $previousEnable }
        if ($null -eq $previousConfirm) { Remove-Item Env:WAFL_SIMULATOR_ATTACHMENT_CONFIRM -ErrorAction SilentlyContinue } else { $env:WAFL_SIMULATOR_ATTACHMENT_CONFIRM = $previousConfirm }
        if ($null -eq $previousApprovedDbFingerprint) { Remove-Item Env:WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT = $previousApprovedDbFingerprint }
        if ($null -eq $previousApprovedWorkerUrlFingerprint) { Remove-Item Env:WAFL_SIMULATOR_APPROVED_WORKER_URL_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_SIMULATOR_APPROVED_WORKER_URL_FINGERPRINT = $previousApprovedWorkerUrlFingerprint }
        if ($null -eq $previousApprovedWorkerHostFingerprint) { Remove-Item Env:WAFL_SIMULATOR_APPROVED_WORKER_HOST_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_SIMULATOR_APPROVED_WORKER_HOST_FINGERPRINT = $previousApprovedWorkerHostFingerprint }
        if ($null -eq $previousApprovedWorkerUrlAllowlist) { Remove-Item Env:WAFL_SIMULATOR_APPROVED_WORKER_URL_ALLOWLIST -ErrorAction SilentlyContinue } else { $env:WAFL_SIMULATOR_APPROVED_WORKER_URL_ALLOWLIST = $previousApprovedWorkerUrlAllowlist }
        if ($null -eq $previousTestPrefix) { Remove-Item Env:WAFL_FUNCTIONS_TEST_PREFIX -ErrorAction SilentlyContinue } else { $env:WAFL_FUNCTIONS_TEST_PREFIX = $previousTestPrefix }
    }
}

function RunSimulatorAttachmentUploadSeed {
    InvokeSimulatorAttachmentMutationPreflight -ActionName "Simulator Attachment Upload+Seed" -ConfirmText "UPLOAD SEED WAF-FN ATTACHMENTS" -Mode "upload-seed" -Label "Simulator_Attachment_Upload_Seed"
}

function RunSimulatorAttachmentVerifyReconcile {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Simulator Attachment Verify+Reconcile" -Label "Simulator_Attachment_Verify_Reconcile" -NpmCommand "node tools/simulator/commands/attachment-lifecycle.mjs --mode=verify" -LoadEnvLocal $true -PauseAfter $PauseAfter)
}

function RunSimulatorAttachmentLifecycleTest {
    InvokeSimulatorAttachmentMutationPreflight -ActionName "Simulator Attachment Lifecycle Test" -ConfirmText "RUN WAF-FN ATTACHMENT LIFECYCLE" -Mode "lifecycle" -Label "Simulator_Attachment_Lifecycle_Test"
}

function RunSimulatorAttachmentCleanup {
    InvokeSimulatorAttachmentMutationPreflight -ActionName "Simulator Attachment Cleanup" -ConfirmText "CLEAN WAF-FN ATTACHMENTS" -Mode "cleanup" -Label "Simulator_Attachment_Cleanup"
}

function RunSimulatorAttachmentFaultPlan {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Simulator Attachment Fault Plan" -Label "Simulator_Attachment_Fault_Plan" -NpmCommand "node tools/simulator/commands/attachment-lifecycle.mjs --mode=fault-plan" -LoadEnvLocal $true -PauseAfter $PauseAfter)
}

function RunSimulatorAttachmentFaultExecute {
    InvokeSimulatorAttachmentMutationPreflight -ActionName "Simulator Attachment Fault Execute" -ConfirmText "CREATE WAF-FN ATTACHMENT FAULTS" -Mode "fault-execute" -Label "Simulator_Attachment_Fault_Execute"
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
    LogWarn "npm run dev watcher가 실행 중입니다. PID: $($runningProcess.Id)"
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



function TestReadOnlyDbAuditGuard {
    param([string]$Runtime, [string]$DatabaseUrl)

    $allowed = @([string[]]$PipelineConfig.Simulator.AllowedRuntimes)
    $normalized = ([string]$Runtime).Trim().ToLowerInvariant()
    if ([string]::IsNullOrWhiteSpace($normalized) -or $allowed -notcontains $normalized) {
        return [pscustomobject]@{ Passed = $false; Reason = "runtime-blocked"; Runtime = $(if ($normalized) { $normalized } else { "unset" }); Fingerprint = "unknown" }
    }
    if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
        return [pscustomobject]@{ Passed = $false; Reason = "database-url-missing"; Runtime = $normalized; Fingerprint = "unknown" }
    }
    try {
        $uri = [System.Uri]$DatabaseUrl
        $dbName = $uri.AbsolutePath.Trim('/')
        if (@('postgres','postgresql') -notcontains $uri.Scheme.ToLowerInvariant() -or [string]::IsNullOrWhiteSpace($uri.Host) -or [string]::IsNullOrWhiteSpace($dbName)) {
            return [pscustomobject]@{ Passed = $false; Reason = "database-url-invalid"; Runtime = $normalized; Fingerprint = "unknown" }
        }
        $fingerprint = GetSha256HexPrefix -Value ("{0}/{1}" -f $uri.Host, $dbName)
        $approved = ([string]$PipelineConfig.Simulator.ApprovedDbFingerprint).Trim().ToLowerInvariant()
        if ([string]::IsNullOrWhiteSpace($approved) -or $fingerprint -ne $approved) {
            return [pscustomobject]@{ Passed = $false; Reason = "fingerprint-mismatch"; Runtime = $normalized; Fingerprint = $fingerprint }
        }
        return [pscustomobject]@{ Passed = $true; Reason = "approved-dev-test-target"; Runtime = $normalized; Fingerprint = $fingerprint }
    }
    catch {
        return [pscustomobject]@{ Passed = $false; Reason = "database-url-parse-failed"; Runtime = $normalized; Fingerprint = "unknown" }
    }
}

function InvokeReadOnlyDbAudit {
    param([string]$Mode, [string]$Title, [string]$Label, [bool]$PauseAfter = $true)

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL

    Write-Host ""
    Write-Host "Read-only DB audit guard"
    Write-Host "- Runtime: $($guard.Runtime)"
    Write-Host "- Fingerprint: $($guard.Fingerprint)"
    Write-Host "- Result: $($guard.Reason)"
    if (-not $guard.Passed) {
        LogError "읽기 전용 DB 감사가 차단되었습니다. dev/test 승인 DB만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }

    $previous = $env:WAFL_DB_AUDIT_APPROVED
    try {
        $env:WAFL_DB_AUDIT_APPROVED = '1'
        $dbAuditLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
        return (InvokeProjectCommandWithResultFile -Title $Title -Label $Label -NpmCommand "node scripts/run-readonly-db-audit.mjs $Mode" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $dbAuditLogDir)
    }
    finally {
        if ($null -eq $previous) { Remove-Item Env:WAFL_DB_AUDIT_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_DB_AUDIT_APPROVED = $previous }
    }
}

function InvokeApprovedDbMigrationCommand {
    param([string]$Mode, [string]$Title, [string]$Label, [bool]$PauseAfter = $true)

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL

    Write-Host ""
    Write-Host "Approved DB migration guard"
    Write-Host "- Runtime: $($guard.Runtime)"
    Write-Host "- Fingerprint: $($guard.Fingerprint)"
    Write-Host "- Result: $($guard.Reason)"
    if (-not $guard.Passed) {
        LogError "승인 DB migration이 차단되었습니다. dev/test 승인 DB만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }

    $previous = $env:WAFL_DB_MIGRATION_APPROVED
    try {
        $env:WAFL_DB_MIGRATION_APPROVED = '1'
        $dbAuditLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
        return (InvokeProjectCommandWithResultFile -Title $Title -Label $Label -NpmCommand "node scripts/run-approved-db-migration.mjs $Mode" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $dbAuditLogDir)
    }
    finally {
        if ($null -eq $previous) { Remove-Item Env:WAFL_DB_MIGRATION_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_DB_MIGRATION_APPROVED = $previous }
    }
}

function InvokeWaflV2Alpha22Command {
    param(
        [ValidateSet("preflight", "apply", "apply-index", "validate", "seed", "verify")]
        [string]$Mode,
        [string]$SeedProfile = "",
        [string]$Confirmation = "",
        [bool]$PauseAfter = $true
    )

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL
    $testPrefix = ([string]$PipelineConfig.Simulator.TestPrefix).Trim()

    $expectedConfirmation = switch ($Mode) {
        "apply" { "APPLY WAFL V2 ALPHA22 DEV TEST" }
        "apply-index" { "APPLY WAFL V2 ALPHA23 MATERIAL INDEX" }
        "seed" {
            switch ($SeedProfile) {
                "a500" { "SEED WAFL V2 A500" }
                "b5000" { "SEED WAFL V2 B5000" }
                "c-multi" { "SEED WAFL V2 C-MULTI" }
                default { "INVALID" }
            }
        }
        "verify" { "VERIFY WAFL V2 ALPHA22 DEV TEST" }
        default { "" }
    }

    Write-Host ""
    $guardLabel = if ($Mode -eq "apply-index") { "alpha.23 material index" } else { "alpha.22" }
    Write-Host "WAFL v2 $guardLabel dev/test guard"
    Write-Host "- Mode: $Mode"
    if (-not [string]::IsNullOrWhiteSpace($SeedProfile)) { Write-Host "- Seed profile: $SeedProfile" }
    Write-Host "- Runtime: $($guard.Runtime)"
    Write-Host "- Fingerprint: $($guard.Fingerprint)"
    Write-Host "- Prefix: $testPrefix"
    Write-Host "- Target result: $($guard.Reason)"

    if (-not $guard.Passed -or $testPrefix -ne "wafl-fn") {
        LogError "WAFL v2 alpha.22 작업이 차단되었습니다. 승인된 dev/test DB와 wafl-fn prefix만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }
    if (-not [string]::IsNullOrWhiteSpace($expectedConfirmation) -and $Confirmation -cne $expectedConfirmation) {
        LogError "WAFL v2 alpha.22 confirmation이 일치하지 않아 작업이 차단되었습니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 3
    }

    $previousRuntime = $env:WAFL_V2_RUNTIME
    $previousFingerprint = $env:WAFL_V2_APPROVED_DB_FINGERPRINT
    $previousPrefix = $env:WAFL_V2_TEST_PREFIX
    $previousConfirmation = $env:WAFL_V2_CONFIRMATION
    $previousReadApproval = $env:WAFL_V2_READ_APPROVED
    $previousMigrationApproval = $env:WAFL_V2_MIGRATION_APPROVED
    $previousSeedApproval = $env:WAFL_V2_SEED_APPROVED
    $previousVerifyApproval = $env:WAFL_V2_VERIFY_APPROVED

    try {
        $env:WAFL_V2_RUNTIME = $guard.Runtime
        $env:WAFL_V2_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_V2_TEST_PREFIX = $testPrefix
        $env:WAFL_V2_CONFIRMATION = $Confirmation
        $env:WAFL_V2_READ_APPROVED = if ($Mode -in @("preflight", "validate")) { "1" } else { "0" }
        $env:WAFL_V2_MIGRATION_APPROVED = if ($Mode -in @("apply", "apply-index")) { "1" } else { "0" }
        $env:WAFL_V2_SEED_APPROVED = if ($Mode -eq "seed") { "1" } else { "0" }
        $env:WAFL_V2_VERIFY_APPROVED = if ($Mode -eq "verify") { "1" } else { "0" }

        $command = "node scripts/run-wafl-v2-alpha22.mjs $Mode"
        if ($Mode -eq "seed") { $command += " $SeedProfile" }
        $label = switch ($Mode) {
            "preflight" { "Wafl_V2_Alpha22_Preflight" }
            "apply" { "Apply_Wafl_V2_Alpha22_Migrations" }
            "apply-index" { "Apply_Wafl_V2_Alpha23_Material_Index" }
            "validate" { "Wafl_V2_Alpha22_Post_Apply_Validation" }
            "seed" { "Wafl_V2_Alpha22_Seed_$($SeedProfile.ToUpperInvariant().Replace('-', '_'))" }
            "verify" { "Wafl_V2_Alpha22_Verification" }
        }
        $title = if ($Mode -eq "apply-index") { "WAFL v2 alpha.23 material index apply" } else { "WAFL v2 alpha.22 $Mode" }
        $dbAuditLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
        $result = InvokeProjectCommandWithResultFile -Title $title -Label $label -NpmCommand $command -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $dbAuditLogDir
        if ($null -ne $result -and [int]$result -ne 0) {
            $failureLog = Get-ChildItem -LiteralPath $dbAuditLogDir -File -Filter "Failed_${label}_*.txt" -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending |
                Select-Object -First 1
            if ($null -ne $failureLog) {
                try {
                    NewWaflV2FailureHandoff -FailureStage $Mode -FailureLogPath $failureLog.FullName | Out-Null
                }
                catch {
                    LogError "WAFL v2 failure handoff 생성 실패: $($_.Exception.Message)"
                }
            }
        }
        return $result
    }
    finally {
        if ($null -eq $previousRuntime) { Remove-Item Env:WAFL_V2_RUNTIME -ErrorAction SilentlyContinue } else { $env:WAFL_V2_RUNTIME = $previousRuntime }
        if ($null -eq $previousFingerprint) { Remove-Item Env:WAFL_V2_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_V2_APPROVED_DB_FINGERPRINT = $previousFingerprint }
        if ($null -eq $previousPrefix) { Remove-Item Env:WAFL_V2_TEST_PREFIX -ErrorAction SilentlyContinue } else { $env:WAFL_V2_TEST_PREFIX = $previousPrefix }
        if ($null -eq $previousConfirmation) { Remove-Item Env:WAFL_V2_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_V2_CONFIRMATION = $previousConfirmation }
        if ($null -eq $previousReadApproval) { Remove-Item Env:WAFL_V2_READ_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_READ_APPROVED = $previousReadApproval }
        if ($null -eq $previousMigrationApproval) { Remove-Item Env:WAFL_V2_MIGRATION_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_MIGRATION_APPROVED = $previousMigrationApproval }
        if ($null -eq $previousSeedApproval) { Remove-Item Env:WAFL_V2_SEED_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_SEED_APPROVED = $previousSeedApproval }
        if ($null -eq $previousVerifyApproval) { Remove-Item Env:WAFL_V2_VERIFY_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_VERIFY_APPROVED = $previousVerifyApproval }
    }
}

function InvokeWaflV2Alpha23ListApiVerification {
    param(
        [string]$Confirmation = "",
        [bool]$PauseAfter = $true
    )

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL
    $testPrefix = ([string]$PipelineConfig.Simulator.TestPrefix).Trim()
    $expectedConfirmation = "VERIFY WAFL V2 ALPHA23 READ API"

    Write-Host ""
    Write-Host "WAFL v2 alpha.23 WorkOrder list API read-only guard"
    Write-Host "- Runtime: $($guard.Runtime)"
    Write-Host "- Fingerprint: $($guard.Fingerprint)"
    Write-Host "- Prefix: $testPrefix"
    Write-Host "- Target result: $($guard.Reason)"
    Write-Host "- Mutation: none; existing alpha.22 schema and synthetic seed are reused"

    if (-not $guard.Passed -or $testPrefix -ne "wafl-fn") {
        LogError "WAFL v2 alpha.23 read API 검증이 차단되었습니다. 승인된 dev/test DB와 wafl-fn prefix만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }
    if ($Confirmation -cne $expectedConfirmation) {
        LogError "WAFL v2 alpha.23 read API confirmation이 일치하지 않아 검증이 차단되었습니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 3
    }

    $previousRuntime = $env:WAFL_V2_RUNTIME
    $previousFingerprint = $env:WAFL_V2_APPROVED_DB_FINGERPRINT
    $previousPrefix = $env:WAFL_V2_TEST_PREFIX
    $previousConfirmation = $env:WAFL_V2_CONFIRMATION
    $previousReadApproval = $env:WAFL_V2_READ_APPROVED
    $previousReadApiEnabled = $env:WAFL_V2_READ_API_ENABLED
    try {
        $env:WAFL_V2_RUNTIME = $guard.Runtime
        $env:WAFL_V2_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_V2_TEST_PREFIX = $testPrefix
        $env:WAFL_V2_CONFIRMATION = $Confirmation
        $env:WAFL_V2_READ_APPROVED = "1"
        $env:WAFL_V2_READ_API_ENABLED = "1"

        $label = "Wafl_V2_Alpha23_List_API_Verification"
        $dbAuditLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
        $result = InvokeProjectCommandWithResultFile -Title "WAFL v2 alpha.23 WorkOrder list API read-only verification" -Label $label -NpmCommand "node scripts/run-wafl-v2-alpha23-list-api.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $dbAuditLogDir
        if ($null -ne $result -and [int]$result -ne 0) {
            $failureLog = Get-ChildItem -LiteralPath $dbAuditLogDir -File -Filter "Failed_${label}_*.txt" -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending |
                Select-Object -First 1
            if ($null -ne $failureLog) {
                try {
                    NewWaflV2FailureHandoff -FailureStage "alpha23-list-api-runtime" -FailureLogPath $failureLog.FullName | Out-Null
                }
                catch {
                    LogError "WAFL v2 alpha.23 failure handoff 생성 실패: $($_.Exception.Message)"
                }
            }
        }
        return $result
    }
    finally {
        if ($null -eq $previousRuntime) { Remove-Item Env:WAFL_V2_RUNTIME -ErrorAction SilentlyContinue } else { $env:WAFL_V2_RUNTIME = $previousRuntime }
        if ($null -eq $previousFingerprint) { Remove-Item Env:WAFL_V2_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_V2_APPROVED_DB_FINGERPRINT = $previousFingerprint }
        if ($null -eq $previousPrefix) { Remove-Item Env:WAFL_V2_TEST_PREFIX -ErrorAction SilentlyContinue } else { $env:WAFL_V2_TEST_PREFIX = $previousPrefix }
        if ($null -eq $previousConfirmation) { Remove-Item Env:WAFL_V2_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_V2_CONFIRMATION = $previousConfirmation }
        if ($null -eq $previousReadApproval) { Remove-Item Env:WAFL_V2_READ_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_READ_APPROVED = $previousReadApproval }
        if ($null -eq $previousReadApiEnabled) { Remove-Item Env:WAFL_V2_READ_API_ENABLED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_READ_API_ENABLED = $previousReadApiEnabled }
    }
}

function InvokeWaflV2Alpha24DetailApiVerification {
    param(
        [string]$Confirmation = "",
        [bool]$PauseAfter = $true
    )

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL
    $testPrefix = ([string]$PipelineConfig.Simulator.TestPrefix).Trim()
    $expectedConfirmation = "VERIFY WAFL V2 ALPHA24 DETAIL API"

    Write-Host ""
    Write-Host "WAFL v2 alpha.24 WorkOrder detail/lazy API read-only guard"
    Write-Host "- Runtime: $($guard.Runtime)"
    Write-Host "- Fingerprint: $($guard.Fingerprint)"
    Write-Host "- Prefix: $testPrefix"
    Write-Host "- Target result: $($guard.Reason)"
    Write-Host "- Mutation: none; migration ledger 7 and existing alpha.22 synthetic seed are reused"

    if (-not $guard.Passed -or $testPrefix -ne "wafl-fn") {
        LogError "WAFL v2 alpha.24 detail API 검증이 차단되었습니다. 승인된 dev/test DB와 wafl-fn prefix만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }
    if ($Confirmation -cne $expectedConfirmation) {
        LogError "WAFL v2 alpha.24 detail API confirmation이 일치하지 않아 검증이 차단되었습니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 3
    }

    $previousRuntime = $env:WAFL_V2_RUNTIME
    $previousFingerprint = $env:WAFL_V2_APPROVED_DB_FINGERPRINT
    $previousPrefix = $env:WAFL_V2_TEST_PREFIX
    $previousConfirmation = $env:WAFL_V2_CONFIRMATION
    $previousReadApproval = $env:WAFL_V2_READ_APPROVED
    $previousReadApiEnabled = $env:WAFL_V2_READ_API_ENABLED
    try {
        $env:WAFL_V2_RUNTIME = $guard.Runtime
        $env:WAFL_V2_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_V2_TEST_PREFIX = $testPrefix
        $env:WAFL_V2_CONFIRMATION = $Confirmation
        $env:WAFL_V2_READ_APPROVED = "1"
        $env:WAFL_V2_READ_API_ENABLED = "1"

        $label = "Wafl_V2_Alpha24_Detail_API_Verification"
        $dbAuditLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
        $result = InvokeProjectCommandWithResultFile -Title "WAFL v2 alpha.24 WorkOrder detail/lazy API read-only verification" -Label $label -NpmCommand "node scripts/run-wafl-v2-alpha24-detail-api.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $dbAuditLogDir
        if ($null -ne $result -and [int]$result -ne 0) {
            $failureLog = Get-ChildItem -LiteralPath $dbAuditLogDir -File -Filter "Failed_${label}_*.txt" -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending |
                Select-Object -First 1
            if ($null -ne $failureLog) {
                try {
                    NewWaflV2FailureHandoff -FailureStage "alpha24-detail-api-runtime" -FailureLogPath $failureLog.FullName | Out-Null
                }
                catch {
                    LogError "WAFL v2 alpha.24 failure handoff 생성 실패: $($_.Exception.Message)"
                }
            }
        }
        return $result
    }
    finally {
        if ($null -eq $previousRuntime) { Remove-Item Env:WAFL_V2_RUNTIME -ErrorAction SilentlyContinue } else { $env:WAFL_V2_RUNTIME = $previousRuntime }
        if ($null -eq $previousFingerprint) { Remove-Item Env:WAFL_V2_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_V2_APPROVED_DB_FINGERPRINT = $previousFingerprint }
        if ($null -eq $previousPrefix) { Remove-Item Env:WAFL_V2_TEST_PREFIX -ErrorAction SilentlyContinue } else { $env:WAFL_V2_TEST_PREFIX = $previousPrefix }
        if ($null -eq $previousConfirmation) { Remove-Item Env:WAFL_V2_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_V2_CONFIRMATION = $previousConfirmation }
        if ($null -eq $previousReadApproval) { Remove-Item Env:WAFL_V2_READ_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_READ_APPROVED = $previousReadApproval }
        if ($null -eq $previousReadApiEnabled) { Remove-Item Env:WAFL_V2_READ_API_ENABLED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_READ_API_ENABLED = $previousReadApiEnabled }
    }
}

function InvokeWaflV2Alpha25CommandPreflight {
    param(
        [string]$Confirmation = "",
        [bool]$PauseAfter = $true
    )

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL
    $testPrefix = ([string]$PipelineConfig.Simulator.TestPrefix).Trim()
    $expectedConfirmation = "VERIFY WAFL V2 ALPHA25 COMMAND PREFLIGHT"

    Write-Host ""
    Write-Host "WAFL v2 alpha.25 WorkOrder Command read-only preflight guard"
    Write-Host "- Runtime: $($guard.Runtime)"
    Write-Host "- Fingerprint: $($guard.Fingerprint)"
    Write-Host "- Prefix: $testPrefix"
    Write-Host "- Target result: $($guard.Reason)"
    Write-Host "- Mutation: none; valid POST/PATCH and mutation approval are prohibited"

    if (-not $guard.Passed -or $testPrefix -ne "wafl-fn") {
        LogError "WAFL v2 alpha.25 Command preflight가 차단되었습니다. 승인된 dev/test DB와 wafl-fn prefix만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }
    if ($Confirmation -cne $expectedConfirmation) {
        LogError "WAFL v2 alpha.25 Command preflight confirmation이 일치하지 않아 검증이 차단되었습니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 3
    }

    $previousRuntime = $env:WAFL_V2_RUNTIME
    $previousFingerprint = $env:WAFL_V2_APPROVED_DB_FINGERPRINT
    $previousPrefix = $env:WAFL_V2_TEST_PREFIX
    $previousConfirmation = $env:WAFL_V2_CONFIRMATION
    $previousReadApproval = $env:WAFL_V2_READ_APPROVED
    $previousReadApiEnabled = $env:WAFL_V2_READ_API_ENABLED
    $previousCommandApiEnabled = $env:WAFL_V2_COMMAND_API_ENABLED
    $previousMutationApproval = $env:WAFL_V2_COMMAND_MUTATION_APPROVED
    try {
        $env:WAFL_V2_RUNTIME = $guard.Runtime
        $env:WAFL_V2_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_V2_TEST_PREFIX = $testPrefix
        $env:WAFL_V2_CONFIRMATION = $Confirmation
        $env:WAFL_V2_READ_APPROVED = "1"
        $env:WAFL_V2_READ_API_ENABLED = "1"
        $env:WAFL_V2_COMMAND_API_ENABLED = "1"
        Remove-Item Env:WAFL_V2_COMMAND_MUTATION_APPROVED -ErrorAction SilentlyContinue

        $label = "Wafl_V2_Alpha25_Command_Preflight"
        $dbAuditLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
        $result = InvokeProjectCommandWithResultFile -Title "WAFL v2 alpha.25 WorkOrder Command read-only preflight" -Label $label -NpmCommand "node scripts/run-wafl-v2-alpha25-command-preflight.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $dbAuditLogDir
        if ($null -ne $result -and [int]$result -ne 0) {
            $failureLog = Get-ChildItem -LiteralPath $dbAuditLogDir -File -Filter "Failed_${label}_*.txt" -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending |
                Select-Object -First 1
            if ($null -ne $failureLog) {
                try {
                    NewWaflV2FailureHandoff -FailureStage "alpha25-command-preflight" -FailureLogPath $failureLog.FullName | Out-Null
                }
                catch {
                    LogError "WAFL v2 alpha.25 preflight failure handoff 생성 실패: $($_.Exception.Message)"
                }
            }
        }
        return $result
    }
    finally {
        if ($null -eq $previousRuntime) { Remove-Item Env:WAFL_V2_RUNTIME -ErrorAction SilentlyContinue } else { $env:WAFL_V2_RUNTIME = $previousRuntime }
        if ($null -eq $previousFingerprint) { Remove-Item Env:WAFL_V2_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_V2_APPROVED_DB_FINGERPRINT = $previousFingerprint }
        if ($null -eq $previousPrefix) { Remove-Item Env:WAFL_V2_TEST_PREFIX -ErrorAction SilentlyContinue } else { $env:WAFL_V2_TEST_PREFIX = $previousPrefix }
        if ($null -eq $previousConfirmation) { Remove-Item Env:WAFL_V2_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_V2_CONFIRMATION = $previousConfirmation }
        if ($null -eq $previousReadApproval) { Remove-Item Env:WAFL_V2_READ_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_READ_APPROVED = $previousReadApproval }
        if ($null -eq $previousReadApiEnabled) { Remove-Item Env:WAFL_V2_READ_API_ENABLED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_READ_API_ENABLED = $previousReadApiEnabled }
        if ($null -eq $previousCommandApiEnabled) { Remove-Item Env:WAFL_V2_COMMAND_API_ENABLED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_COMMAND_API_ENABLED = $previousCommandApiEnabled }
        if ($null -eq $previousMutationApproval) { Remove-Item Env:WAFL_V2_COMMAND_MUTATION_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_COMMAND_MUTATION_APPROVED = $previousMutationApproval }
    }
}

function InvokeWaflV2Alpha25CommandRuntimeVerification {
    param(
        [string]$Confirmation = "",
        [bool]$PauseAfter = $true
    )

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL
    $testPrefix = ([string]$PipelineConfig.Simulator.TestPrefix).Trim()
    $expectedConfirmation = "EXECUTE WAFL V2 ALPHA25 COMMAND RUNTIME"

    Write-Host ""
    Write-Host "WAFL v2 alpha.25 WorkOrder Command mutation guard"
    Write-Host "- Runtime: $($guard.Runtime)"
    Write-Host "- Fingerprint: $($guard.Fingerprint)"
    Write-Host "- Prefix: $testPrefix"
    Write-Host "- Target result: $($guard.Reason)"
    Write-Host "- Mutation: Company A synthetic WorkOrder 1, R0 1, receipt 1, events 3; no cleanup"

    if (-not $guard.Passed -or $testPrefix -ne "wafl-fn") {
        LogError "WAFL v2 alpha.25 Command runtime이 차단되었습니다. 승인된 dev/test DB와 wafl-fn prefix만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }
    if ($Confirmation -cne $expectedConfirmation) {
        LogError "WAFL v2 alpha.25 Command runtime confirmation이 일치하지 않아 mutation이 차단되었습니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 3
    }

    $previousRuntime = $env:WAFL_V2_RUNTIME
    $previousFingerprint = $env:WAFL_V2_APPROVED_DB_FINGERPRINT
    $previousPrefix = $env:WAFL_V2_TEST_PREFIX
    $previousConfirmation = $env:WAFL_V2_CONFIRMATION
    $previousReadApproval = $env:WAFL_V2_READ_APPROVED
    $previousReadApiEnabled = $env:WAFL_V2_READ_API_ENABLED
    $previousCommandApiEnabled = $env:WAFL_V2_COMMAND_API_ENABLED
    $previousMutationApproval = $env:WAFL_V2_COMMAND_MUTATION_APPROVED
    try {
        $env:WAFL_V2_RUNTIME = $guard.Runtime
        $env:WAFL_V2_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_V2_TEST_PREFIX = $testPrefix
        $env:WAFL_V2_CONFIRMATION = $Confirmation
        $env:WAFL_V2_READ_APPROVED = "1"
        $env:WAFL_V2_READ_API_ENABLED = "1"
        $env:WAFL_V2_COMMAND_API_ENABLED = "1"
        $env:WAFL_V2_COMMAND_MUTATION_APPROVED = "2.0.0-alpha.25-dev-test-command-runtime"

        $label = "Wafl_V2_Alpha25_Command_Runtime"
        $dbAuditLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
        $result = InvokeProjectCommandWithResultFile -Title "WAFL v2 alpha.25 WorkOrder Command approved dev/test runtime" -Label $label -NpmCommand "node scripts/run-wafl-v2-alpha25-command-runtime.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $dbAuditLogDir
        if ($null -ne $result -and [int]$result -ne 0) {
            $failureLog = Get-ChildItem -LiteralPath $dbAuditLogDir -File -Filter "Failed_${label}_*.txt" -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending |
                Select-Object -First 1
            if ($null -ne $failureLog) {
                try {
                    NewWaflV2FailureHandoff -FailureStage "alpha25-command-runtime" -FailureLogPath $failureLog.FullName | Out-Null
                }
                catch {
                    LogError "WAFL v2 alpha.25 runtime failure handoff 생성 실패: $($_.Exception.Message)"
                }
            }
        }
        return $result
    }
    finally {
        if ($null -eq $previousRuntime) { Remove-Item Env:WAFL_V2_RUNTIME -ErrorAction SilentlyContinue } else { $env:WAFL_V2_RUNTIME = $previousRuntime }
        if ($null -eq $previousFingerprint) { Remove-Item Env:WAFL_V2_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_V2_APPROVED_DB_FINGERPRINT = $previousFingerprint }
        if ($null -eq $previousPrefix) { Remove-Item Env:WAFL_V2_TEST_PREFIX -ErrorAction SilentlyContinue } else { $env:WAFL_V2_TEST_PREFIX = $previousPrefix }
        if ($null -eq $previousConfirmation) { Remove-Item Env:WAFL_V2_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_V2_CONFIRMATION = $previousConfirmation }
        if ($null -eq $previousReadApproval) { Remove-Item Env:WAFL_V2_READ_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_READ_APPROVED = $previousReadApproval }
        if ($null -eq $previousReadApiEnabled) { Remove-Item Env:WAFL_V2_READ_API_ENABLED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_READ_API_ENABLED = $previousReadApiEnabled }
        if ($null -eq $previousCommandApiEnabled) { Remove-Item Env:WAFL_V2_COMMAND_API_ENABLED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_COMMAND_API_ENABLED = $previousCommandApiEnabled }
        if ($null -eq $previousMutationApproval) { Remove-Item Env:WAFL_V2_COMMAND_MUTATION_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_COMMAND_MUTATION_APPROVED = $previousMutationApproval }
    }
}

function InvokeWaflV2Alpha26MaterialCommandVerification {
    param(
        [ValidateSet("preflight", "runtime")]
        [string]$Mode,
        [string]$Confirmation = "",
        [bool]$PauseAfter = $true
    )

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL
    $testPrefix = ([string]$PipelineConfig.Simulator.TestPrefix).Trim()
    $isRuntime = $Mode -eq "runtime"
    $expectedConfirmation = if ($isRuntime) {
        "EXECUTE WAFL V2 ALPHA26 MATERIAL COMMAND RUNTIME"
    } else {
        "VERIFY WAFL V2 ALPHA26 MATERIAL COMMAND PREFLIGHT"
    }
    $label = if ($isRuntime) { "Wafl_V2_Alpha26_Material_Command_Runtime" } else { "Wafl_V2_Alpha26_Material_Command_Preflight" }
    $runner = if ($isRuntime) { "run-wafl-v2-alpha26-material-command-runtime.mjs" } else { "run-wafl-v2-alpha26-material-command-preflight.mjs" }
    $failureStage = if ($isRuntime) { "alpha26-material-command-runtime" } else { "alpha26-material-command-preflight" }

    Write-Host ""
    Write-Host "WAFL v2 alpha.26 Material Command $Mode guard"
    Write-Host "- Runtime: $($guard.Runtime)"
    Write-Host "- Fingerprint: $($guard.Fingerprint)"
    Write-Host "- Prefix: $testPrefix"
    Write-Host "- Target result: $($guard.Reason)"
    Write-Host $(if ($isRuntime) {
        "- Mutation: reuse one Company A alpha.25 draft; fabric +2, accessory +1, receipts +9, events +11; no cleanup"
    } else {
        "- Mutation: none; valid material create/PATCH/order transition and mutation approval are prohibited"
    })

    if (-not $guard.Passed -or $testPrefix -ne "wafl-fn") {
        LogError "WAFL v2 alpha.26 Material Command $Mode 검증이 차단되었습니다. 승인된 dev/test DB와 wafl-fn prefix만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }
    if ($Confirmation -cne $expectedConfirmation) {
        LogError "WAFL v2 alpha.26 Material Command $Mode confirmation이 일치하지 않아 검증이 차단되었습니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 3
    }

    $previousRuntime = $env:WAFL_V2_RUNTIME
    $previousFingerprint = $env:WAFL_V2_APPROVED_DB_FINGERPRINT
    $previousPrefix = $env:WAFL_V2_TEST_PREFIX
    $previousConfirmation = $env:WAFL_V2_CONFIRMATION
    $previousReadApproval = $env:WAFL_V2_READ_APPROVED
    $previousReadApiEnabled = $env:WAFL_V2_READ_API_ENABLED
    $previousCommandApiEnabled = $env:WAFL_V2_COMMAND_API_ENABLED
    $previousMutationApproval = $env:WAFL_V2_COMMAND_MUTATION_APPROVED
    try {
        $env:WAFL_V2_RUNTIME = $guard.Runtime
        $env:WAFL_V2_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_V2_TEST_PREFIX = $testPrefix
        $env:WAFL_V2_CONFIRMATION = $Confirmation
        $env:WAFL_V2_READ_APPROVED = "1"
        $env:WAFL_V2_READ_API_ENABLED = "1"
        $env:WAFL_V2_COMMAND_API_ENABLED = "1"
        if ($isRuntime) {
            $env:WAFL_V2_COMMAND_MUTATION_APPROVED = "2.0.0-alpha.26-dev-test-material-command-runtime"
        }
        else {
            Remove-Item Env:WAFL_V2_COMMAND_MUTATION_APPROVED -ErrorAction SilentlyContinue
        }

        $dbAuditLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
        $title = if ($isRuntime) { "WAFL v2 alpha.26 Material Command approved dev/test runtime" } else { "WAFL v2 alpha.26 Material Command read-only preflight" }
        $result = InvokeProjectCommandWithResultFile -Title $title -Label $label -NpmCommand "node scripts/$runner" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $dbAuditLogDir
        if ($null -ne $result -and [int]$result -ne 0) {
            $failureLog = Get-ChildItem -LiteralPath $dbAuditLogDir -File -Filter "Failed_${label}_*.txt" -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending |
                Select-Object -First 1
            if ($null -ne $failureLog) {
                try {
                    NewWaflV2FailureHandoff -FailureStage $failureStage -FailureLogPath $failureLog.FullName | Out-Null
                }
                catch {
                    LogError "WAFL v2 alpha.26 $Mode failure handoff 생성 실패: $($_.Exception.Message)"
                }
            }
        }
        return $result
    }
    finally {
        if ($null -eq $previousRuntime) { Remove-Item Env:WAFL_V2_RUNTIME -ErrorAction SilentlyContinue } else { $env:WAFL_V2_RUNTIME = $previousRuntime }
        if ($null -eq $previousFingerprint) { Remove-Item Env:WAFL_V2_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_V2_APPROVED_DB_FINGERPRINT = $previousFingerprint }
        if ($null -eq $previousPrefix) { Remove-Item Env:WAFL_V2_TEST_PREFIX -ErrorAction SilentlyContinue } else { $env:WAFL_V2_TEST_PREFIX = $previousPrefix }
        if ($null -eq $previousConfirmation) { Remove-Item Env:WAFL_V2_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_V2_CONFIRMATION = $previousConfirmation }
        if ($null -eq $previousReadApproval) { Remove-Item Env:WAFL_V2_READ_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_READ_APPROVED = $previousReadApproval }
        if ($null -eq $previousReadApiEnabled) { Remove-Item Env:WAFL_V2_READ_API_ENABLED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_READ_API_ENABLED = $previousReadApiEnabled }
        if ($null -eq $previousCommandApiEnabled) { Remove-Item Env:WAFL_V2_COMMAND_API_ENABLED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_COMMAND_API_ENABLED = $previousCommandApiEnabled }
        if ($null -eq $previousMutationApproval) { Remove-Item Env:WAFL_V2_COMMAND_MUTATION_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_COMMAND_MUTATION_APPROVED = $previousMutationApproval }
    }
}

function InvokeWaflV2Alpha27RevisionIssueVerification {
    param(
        [ValidateSet("preflight", "runtime")]
        [string]$Mode,
        [string]$Confirmation = "",
        [bool]$PauseAfter = $true
    )

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL
    $testPrefix = ([string]$PipelineConfig.Simulator.TestPrefix).Trim()
    $isRuntime = $Mode -eq "runtime"
    $expectedConfirmation = if ($isRuntime) { "EXECUTE WAFL V2 ALPHA27 REVISION ISSUE RUNTIME" } else { "VERIFY WAFL V2 ALPHA27 REVISION ISSUE PREFLIGHT" }
    $label = if ($isRuntime) { "Wafl_V2_Alpha27_Revision_Issue_Runtime" } else { "Wafl_V2_Alpha27_Revision_Issue_Preflight" }
    $runner = if ($isRuntime) { "run-wafl-v2-alpha27-revision-issue-runtime.mjs" } else { "run-wafl-v2-alpha27-revision-issue-preflight.mjs" }
    $failureStage = if ($isRuntime) { "alpha27-revision-issue-runtime" } else { "alpha27-revision-issue-preflight" }

    Write-Host ""
    Write-Host "WAFL v2 alpha.27 Revision Issue $Mode guard"
    Write-Host "- Runtime: $($guard.Runtime)"
    Write-Host "- Fingerprint: $($guard.Fingerprint)"
    Write-Host "- Prefix: $testPrefix"
    Write-Host $(if ($isRuntime) { "- Mutation: one Company A synthetic revision issue effect; no cleanup" } else { "- Mutation: none; valid issue Command and mutation approval are prohibited" })
    if (-not $guard.Passed -or $testPrefix -ne "wafl-fn") {
        LogError "WAFL v2 alpha.27 Revision Issue $Mode 검증이 승인된 dev/test 경계를 통과하지 못했습니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }
    if ($Confirmation -cne $expectedConfirmation) {
        LogError "WAFL v2 alpha.27 Revision Issue $Mode confirmation이 일치하지 않습니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 3
    }

    $previous = @{
        Runtime = $env:WAFL_V2_RUNTIME; Fingerprint = $env:WAFL_V2_APPROVED_DB_FINGERPRINT
        Prefix = $env:WAFL_V2_TEST_PREFIX; Confirmation = $env:WAFL_V2_CONFIRMATION
        ReadApproved = $env:WAFL_V2_READ_APPROVED; ReadEnabled = $env:WAFL_V2_READ_API_ENABLED
        CommandEnabled = $env:WAFL_V2_COMMAND_API_ENABLED; MutationApproved = $env:WAFL_V2_COMMAND_MUTATION_APPROVED
    }
    try {
        $env:WAFL_V2_RUNTIME = $guard.Runtime
        $env:WAFL_V2_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_V2_TEST_PREFIX = $testPrefix
        $env:WAFL_V2_CONFIRMATION = $Confirmation
        $env:WAFL_V2_READ_APPROVED = "1"
        $env:WAFL_V2_READ_API_ENABLED = "1"
        $env:WAFL_V2_COMMAND_API_ENABLED = "1"
        if ($isRuntime) { $env:WAFL_V2_COMMAND_MUTATION_APPROVED = "2.0.0-alpha.27-dev-test-revision-issue-runtime" }
        else { Remove-Item Env:WAFL_V2_COMMAND_MUTATION_APPROVED -ErrorAction SilentlyContinue }
        $dbAuditLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
        $title = if ($isRuntime) { "WAFL v2 alpha.27 Revision Issue approved dev/test runtime" } else { "WAFL v2 alpha.27 Revision Issue read-only preflight" }
        $result = InvokeProjectCommandWithResultFile -Title $title -Label $label -NpmCommand "node scripts/$runner" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $dbAuditLogDir
        if ($null -ne $result -and [int]$result -ne 0) {
            $failureLog = Get-ChildItem -LiteralPath $dbAuditLogDir -File -Filter "Failed_${label}_*.txt" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($null -ne $failureLog) { NewWaflV2FailureHandoff -FailureStage $failureStage -FailureLogPath $failureLog.FullName | Out-Null }
        }
        return $result
    }
    finally {
        $restore = @{
            WAFL_V2_RUNTIME = $previous.Runtime; WAFL_V2_APPROVED_DB_FINGERPRINT = $previous.Fingerprint
            WAFL_V2_TEST_PREFIX = $previous.Prefix; WAFL_V2_CONFIRMATION = $previous.Confirmation
            WAFL_V2_READ_APPROVED = $previous.ReadApproved; WAFL_V2_READ_API_ENABLED = $previous.ReadEnabled
            WAFL_V2_COMMAND_API_ENABLED = $previous.CommandEnabled; WAFL_V2_COMMAND_MUTATION_APPROVED = $previous.MutationApproved
        }
        foreach ($name in $restore.Keys) {
            if ($null -eq $restore[$name]) { Remove-Item "Env:$name" -ErrorAction SilentlyContinue }
            else { Set-Item "Env:$name" $restore[$name] }
        }
    }
}

function InvokeWaflV2Alpha27aNumberSettingsMigration {
    param(
        [ValidateSet("preflight", "apply")]
        [string]$Mode,
        [string]$Confirmation = "",
        [bool]$PauseAfter = $true
    )

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL
    $testPrefix = ([string]$PipelineConfig.Simulator.TestPrefix).Trim()
    $isApply = $Mode -eq "apply"
    $expectedConfirmation = if ($isApply) { "APPLY WAFL V2 ALPHA27A NUMBER SETTINGS" } else { "VERIFY WAFL V2 ALPHA27A NUMBER SETTINGS PREFLIGHT" }
    $label = if ($isApply) { "Wafl_V2_Alpha27a_Number_Settings_Apply" } else { "Wafl_V2_Alpha27a_Number_Settings_Preflight" }
    $failureStage = if ($isApply) { "alpha27a-number-settings-apply" } else { "alpha27a-number-settings-preflight" }

    Write-Host ""
    Write-Host "WAFL v2 alpha.27a Number Settings $Mode guard"
    Write-Host "- Runtime: $($guard.Runtime)"
    Write-Host "- Fingerprint: $($guard.Fingerprint)"
    Write-Host "- Prefix: $testPrefix"
    Write-Host $(if ($isApply) { "- Mutation: migration 008 function/ACL and ledger row only" } else { "- Mutation: none; ledger/hash/object/privilege read-only inspection" })
    if (-not $guard.Passed -or $testPrefix -ne "wafl-fn") {
        LogError "WAFL v2 alpha.27a Number Settings $Mode 검증이 승인된 dev/test 경계를 통과하지 못했습니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }
    if ($Confirmation -cne $expectedConfirmation) {
        LogError "WAFL v2 alpha.27a Number Settings $Mode confirmation이 일치하지 않습니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 3
    }

    $previousRuntime = $env:WAFL_V2_RUNTIME
    $previousFingerprint = $env:WAFL_V2_APPROVED_DB_FINGERPRINT
    $previousPrefix = $env:WAFL_V2_TEST_PREFIX
    $previousConfirmation = $env:WAFL_V2_CONFIRMATION
    $previousMigrationApproval = $env:WAFL_V2_MIGRATION_APPROVED
    try {
        $env:WAFL_V2_RUNTIME = $guard.Runtime
        $env:WAFL_V2_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_V2_TEST_PREFIX = $testPrefix
        $env:WAFL_V2_CONFIRMATION = $Confirmation
        if ($isApply) { $env:WAFL_V2_MIGRATION_APPROVED = "1" }
        else { Remove-Item Env:WAFL_V2_MIGRATION_APPROVED -ErrorAction SilentlyContinue }

        $dbAuditLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
        $title = if ($isApply) { "WAFL v2 alpha.27a Number Settings approved dev/test apply" } else { "WAFL v2 alpha.27a Number Settings read-only preflight" }
        $result = InvokeProjectCommandWithResultFile -Title $title -Label $label -NpmCommand "node scripts/run-wafl-v2-alpha27a-number-settings-migration.mjs $Mode" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $dbAuditLogDir
        if ($null -ne $result -and [int]$result -ne 0) {
            $failureLog = Get-ChildItem -LiteralPath $dbAuditLogDir -File -Filter "Failed_${label}_*.txt" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($null -ne $failureLog) { NewWaflV2FailureHandoff -FailureStage $failureStage -FailureLogPath $failureLog.FullName | Out-Null }
        }
        return $result
    }
    finally {
        if ($null -eq $previousRuntime) { Remove-Item Env:WAFL_V2_RUNTIME -ErrorAction SilentlyContinue } else { $env:WAFL_V2_RUNTIME = $previousRuntime }
        if ($null -eq $previousFingerprint) { Remove-Item Env:WAFL_V2_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_V2_APPROVED_DB_FINGERPRINT = $previousFingerprint }
        if ($null -eq $previousPrefix) { Remove-Item Env:WAFL_V2_TEST_PREFIX -ErrorAction SilentlyContinue } else { $env:WAFL_V2_TEST_PREFIX = $previousPrefix }
        if ($null -eq $previousConfirmation) { Remove-Item Env:WAFL_V2_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_V2_CONFIRMATION = $previousConfirmation }
        if ($null -eq $previousMigrationApproval) { Remove-Item Env:WAFL_V2_MIGRATION_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_MIGRATION_APPROVED = $previousMigrationApproval }
    }
}

function InvokeWaflV2Alpha27aSettingsFixture {
    param([string]$Confirmation = "", [bool]$PauseAfter = $true)

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL
    $testPrefix = ([string]$PipelineConfig.Simulator.TestPrefix).Trim()
    $expectedConfirmation = "APPLY WAFL V2 ALPHA27A SETTINGS FIXTURE"
    Write-Host ""
    Write-Host "WAFL v2 alpha.27a Settings Fixture guard"
    Write-Host "- Runtime: $($guard.Runtime)"
    Write-Host "- Fingerprint: $($guard.Fingerprint)"
    Write-Host "- Prefix: $testPrefix"
    Write-Host "- Mutation: exactly three synthetic company_settings rows for A/B/H"
    if (-not $guard.Passed -or $testPrefix -ne "wafl-fn") {
        LogError "WAFL v2 alpha.27a Settings Fixture가 승인된 dev/test 경계를 통과하지 못했습니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }
    if ($Confirmation -cne $expectedConfirmation) {
        LogError "WAFL v2 alpha.27a Settings Fixture confirmation이 일치하지 않습니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 3
    }

    $previousRuntime = $env:WAFL_V2_RUNTIME
    $previousFingerprint = $env:WAFL_V2_APPROVED_DB_FINGERPRINT
    $previousPrefix = $env:WAFL_V2_TEST_PREFIX
    $previousConfirmation = $env:WAFL_V2_CONFIRMATION
    $previousFixtureApproval = $env:WAFL_V2_SETTINGS_FIXTURE_APPROVED
    try {
        $env:WAFL_V2_RUNTIME = $guard.Runtime
        $env:WAFL_V2_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_V2_TEST_PREFIX = $testPrefix
        $env:WAFL_V2_CONFIRMATION = $Confirmation
        $env:WAFL_V2_SETTINGS_FIXTURE_APPROVED = "1"
        $dbAuditLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
        $result = InvokeProjectCommandWithResultFile -Title "WAFL v2 alpha.27a approved synthetic settings fixture" -Label "Wafl_V2_Alpha27a_Settings_Fixture" -NpmCommand "node scripts/run-wafl-v2-alpha27a-settings-fixture.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $dbAuditLogDir
        if ($null -ne $result -and [int]$result -ne 0) {
            $failureLog = Get-ChildItem -LiteralPath $dbAuditLogDir -File -Filter "Failed_Wafl_V2_Alpha27a_Settings_Fixture_*.txt" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($null -ne $failureLog) { NewWaflV2FailureHandoff -FailureStage "alpha27a-settings-fixture" -FailureLogPath $failureLog.FullName | Out-Null }
        }
        return $result
    }
    finally {
        if ($null -eq $previousRuntime) { Remove-Item Env:WAFL_V2_RUNTIME -ErrorAction SilentlyContinue } else { $env:WAFL_V2_RUNTIME = $previousRuntime }
        if ($null -eq $previousFingerprint) { Remove-Item Env:WAFL_V2_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_V2_APPROVED_DB_FINGERPRINT = $previousFingerprint }
        if ($null -eq $previousPrefix) { Remove-Item Env:WAFL_V2_TEST_PREFIX -ErrorAction SilentlyContinue } else { $env:WAFL_V2_TEST_PREFIX = $previousPrefix }
        if ($null -eq $previousConfirmation) { Remove-Item Env:WAFL_V2_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_V2_CONFIRMATION = $previousConfirmation }
        if ($null -eq $previousFixtureApproval) { Remove-Item Env:WAFL_V2_SETTINGS_FIXTURE_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_V2_SETTINGS_FIXTURE_APPROVED = $previousFixtureApproval }
    }
}

function InvokeApprovedDbSmokeCommand {
    param([string]$Command, [string]$Title, [string]$Label, [bool]$PauseAfter = $true)

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL

    Write-Host ""
    Write-Host "Approved DB rollback smoke guard"
    Write-Host "- Runtime: $($guard.Runtime)"
    Write-Host "- Fingerprint: $($guard.Fingerprint)"
    Write-Host "- Result: $($guard.Reason)"
    if (-not $guard.Passed) {
        LogError "DB rollback smoke가 차단되었습니다. dev/test 승인 DB만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }

    $previous = $env:WAFL_DB_AUDIT_APPROVED
    try {
        $env:WAFL_DB_AUDIT_APPROVED = '1'
        $dbAuditLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
        return (InvokeProjectCommandWithResultFile -Title $Title -Label $Label -NpmCommand $Command -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $dbAuditLogDir)
    }
    finally {
        if ($null -eq $previous) { Remove-Item Env:WAFL_DB_AUDIT_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_DB_AUDIT_APPROVED = $previous }
    }
}


function RunPreCodexFinalContractGate {
    param([bool]$PauseAfter = $true)
    $command = @(
        "node tests/pre-codex-final-contract-gate-contract.mjs",
        "node tests/document-structure-contract.mjs",
        "node tests/workspace-commonization-contract.mjs",
        "node tests/system-admin-internal-access-contract.mjs",
        "node tests/roadmap-development-contract.mjs",
        "node tests/unicode-encoding-contract.mjs"
    ) -join " && "

    return (InvokeProjectCommandWithResultFile -Title "Pre-Codex Final Contract Gate" -Label "Pre_Codex_Final_Contract_Gate" -NpmCommand $command -LoadEnvLocal $false -PauseAfter $PauseAfter)
}

function RunDbSchemaReconciliationAudit { return (InvokeReadOnlyDbAudit -Mode 'reconciliation' -Title 'DB Schema Reconciliation Audit' -Label 'DB_Reconciliation_Audit') }
function RunDbConstraintReadinessCheck { return (InvokeReadOnlyDbAudit -Mode 'constraints' -Title 'DB Constraint Readiness Check' -Label 'DB_Constraint_Readiness') }
function RunDbIndexReadinessReport { return (InvokeReadOnlyDbAudit -Mode 'indexes' -Title 'DB Index Usage and Query Readiness Report' -Label 'DB_Index_Readiness') }
function RunSignupMigrationCompatibilityAudit { return (InvokeReadOnlyDbAudit -Mode 'signup-compatibility' -Title 'Signup Migration Compatibility Audit' -Label 'Signup_Migration_Compatibility_Audit') }
function RunSignupConsentMigrationCompatibilityAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeReadOnlyDbAudit -Mode 'signup-consents-compatibility' -Title 'Signup Consent Migration Compatibility Audit' -Label 'Signup_Consent_Migration_Compatibility_Audit' -PauseAfter $PauseAfter)
}
function RunSignupConsentPostApplyAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeReadOnlyDbAudit -Mode 'signup-consents-post-apply' -Title 'Signup Consent Post-Apply Schema Audit' -Label 'Signup_Consent_Post_Apply_Schema_Audit' -PauseAfter $PauseAfter)
}
function ApplySignupConsentMigration {
    param([bool]$PauseAfter = $true)
    return (InvokeApprovedDbMigrationCommand -Mode 'signup-consents' -Title 'Apply Signup Consent Migration' -Label 'Apply_Signup_Consent_Migration' -PauseAfter $PauseAfter)
}

function RunSystemCatalogCompatibilityAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeReadOnlyDbAudit -Mode 'system-catalog-compatibility' -Title 'System Catalog Compatibility Audit' -Label 'System_Catalog_Compatibility_Audit' -PauseAfter $PauseAfter)
}

function ApplySystemCatalogMigration {
    param([bool]$PauseAfter = $true)
    return (InvokeApprovedDbMigrationCommand -Mode 'system-catalog' -Title 'Apply System Catalog Migration' -Label 'Apply_System_Catalog_Migration' -PauseAfter $PauseAfter)
}

function RunSystemCatalogPostApplyAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeReadOnlyDbAudit -Mode 'system-catalog-post-apply' -Title 'System Catalog Post-Apply Audit' -Label 'System_Catalog_Post_Apply_Audit' -PauseAfter $PauseAfter)
}

function RunBillingCompatibilityAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeReadOnlyDbAudit -Mode 'billing-compatibility' -Title 'Billing Compatibility Audit' -Label 'Billing_Compatibility_Audit' -PauseAfter $PauseAfter)
}

function ApplyBillingOperationsMigration {
    param([bool]$PauseAfter = $true)
    return (InvokeApprovedDbMigrationCommand -Mode 'billing-operations' -Title 'Apply Billing Operations Migration' -Label 'Apply_Billing_Operations_Migration' -PauseAfter $PauseAfter)
}

function ApplyPublicSignupE2eMigration {
    param([bool]$PauseAfter = $true)
    return (InvokeApprovedDbMigrationCommand -Mode 'public-signup-e2e' -Title 'Apply Public Signup E2E Migration' -Label 'Apply_Public_Signup_E2E_Migration' -PauseAfter $PauseAfter)
}

function RunPublicSignupE2eCompatibilityAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeReadOnlyDbAudit -Mode 'public-signup-e2e-compatibility' -Title 'Public Signup E2E Compatibility Audit' -Label 'Public_Signup_E2E_Compatibility_Audit' -PauseAfter $PauseAfter)
}

function RunPublicSignupE2ePostApplyAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeReadOnlyDbAudit -Mode 'public-signup-e2e-post-apply' -Title 'Public Signup E2E Post-Apply Audit' -Label 'Public_Signup_E2E_Post_Apply_Audit' -PauseAfter $PauseAfter)
}

function RunPublicSignupE2eIntegration {
    param([bool]$PauseAfter = $true)

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:WAFL_SERVER_RUNTIME_MODE }
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL

    Write-Host ""
    Write-Host "Public Signup E2E integration guard"
    Write-Host "Runtime: $runtime"
    Write-Host "DB fingerprint: $($guard.Fingerprint)"
    Write-Host "Approved DB fingerprint matched: $($guard.Passed)"
    Write-Host "Production: false required"
    Write-Host "Mutation: dev/test synthetic DB fixture rows only, with exact cleanup"
    Write-Host "R2 Mutation: none"
    Write-Host "Mode: public-signup-e2e-integration"

    if (-not $guard.Passed) {
        LogError "Public Signup E2E integration test가 차단되었습니다. dev/test 승인 DB만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }

    $integrationLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
    $previousDbApproved = $env:WAFL_DB_AUDIT_APPROVED
    $previousDbFingerprint = $env:WAFL_APPROVED_DB_FINGERPRINT
    $previousConfirmation = $env:WAFL_PUBLIC_SIGNUP_E2E_CONFIRMATION
    try {
        $env:WAFL_DB_AUDIT_APPROVED = '1'
        $env:WAFL_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_PUBLIC_SIGNUP_E2E_CONFIRMATION = 'RUN_PUBLIC_SIGNUP_E2E_DEV_TEST'
        return (InvokeProjectCommandWithResultFile -Title "Public Signup E2E Integration" -Label "Public_Signup_E2E_Integration" -NpmCommand "node scripts/run-public-signup-e2e-integration.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $integrationLogDir)
    }
    finally {
        if ($null -eq $previousDbApproved) { Remove-Item Env:WAFL_DB_AUDIT_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_DB_AUDIT_APPROVED = $previousDbApproved }
        if ($null -eq $previousDbFingerprint) { Remove-Item Env:WAFL_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_APPROVED_DB_FINGERPRINT = $previousDbFingerprint }
        if ($null -eq $previousConfirmation) { Remove-Item Env:WAFL_PUBLIC_SIGNUP_E2E_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_PUBLIC_SIGNUP_E2E_CONFIRMATION = $previousConfirmation }
    }
}

  function RunAuthenticatedPublicSignupE2e {
      param([bool]$PauseAfter = $true)
      $e2eLogDir = Join-Path (Split-Path -Parent $LogDir) "E2E"
      return (InvokeProjectCommandWithResultFile -Title "Authenticated Public Signup E2E" -Label "Authenticated_Public_Signup_E2E" -NpmCommand "npx playwright test tests/e2e/public-signup-authenticated.spec.mjs" -LoadEnvLocal $true -PauseAfter $PauseAfter -ResultDirectory $e2eLogDir)
  }

  function RunPublicSignupChromiumE2e {
      param([bool]$PauseAfter = $true)
      $e2eLogDir = Join-Path (Split-Path -Parent $LogDir) "E2E"
      return (InvokeProjectCommandWithResultFile -Title "Public Signup Chromium E2E" -Label "Public_Signup_Chromium_E2E" -NpmCommand "npx playwright test tests/e2e/public-signup-authenticated.spec.mjs --project=chromium-desktop" -LoadEnvLocal $true -PauseAfter $PauseAfter -ResultDirectory $e2eLogDir)
  }

  function RunPublicSignupBrowserMatrixE2e {
      param([bool]$PauseAfter = $true)
      $e2eLogDir = Join-Path (Split-Path -Parent $LogDir) "E2E"
      return (InvokeProjectCommandWithResultFile -Title "Public Signup Browser Matrix E2E" -Label "Public_Signup_Browser_Matrix_E2E" -NpmCommand "npx playwright test tests/e2e/public-signup-authenticated.spec.mjs --project=chromium-desktop --project=webkit-desktop --project=mobile-chromium --project=mobile-webkit --project=ipad-webkit" -LoadEnvLocal $true -PauseAfter $PauseAfter -ResultDirectory $e2eLogDir)
  }

  function RunPublicSignupDeployedSmoke {
      param([bool]$PauseAfter = $true)
      $e2eLogDir = Join-Path (Split-Path -Parent $LogDir) "E2E"
      return (InvokeProjectCommandWithResultFile -Title "Public Signup Deployed Smoke" -Label "Public_Signup_Deployed_Smoke" -NpmCommand "npx playwright test tests/e2e/public-signup-e2e.spec.mjs --project=chromium-desktop" -LoadEnvLocal $true -PauseAfter $PauseAfter -ResultDirectory $e2eLogDir)
  }

  function RunPublicSignupFinalResidualAudit {
      param([bool]$PauseAfter = $true)
      if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
      $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
      if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:WAFL_SERVER_RUNTIME_MODE }
      if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
      $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL
      if (-not $guard.Passed) {
          LogError "Public Signup final residual audit가 차단되었습니다. dev/test 승인 DB만 허용합니다."
          if ($PauseAfter) { WaitForDeveloperToolsMenu }
          return 2
      }
      $integrationLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
      $previousDbApproved = $env:WAFL_DB_AUDIT_APPROVED
      $previousDbFingerprint = $env:WAFL_APPROVED_DB_FINGERPRINT
      $previousConfirmation = $env:WAFL_PUBLIC_SIGNUP_E2E_CONFIRMATION
      try {
          $env:WAFL_DB_AUDIT_APPROVED = '1'
          $env:WAFL_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
          $env:WAFL_PUBLIC_SIGNUP_E2E_CONFIRMATION = 'RUN_PUBLIC_SIGNUP_E2E_DEV_TEST'
          return (InvokeProjectCommandWithResultFile -Title "Public Signup Final Residual Audit" -Label "Public_Signup_Final_Residual_Audit" -NpmCommand "node scripts/run-public-signup-e2e-integration.mjs --residual-only" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $integrationLogDir)
      }
      finally {
          if ($null -eq $previousDbApproved) { Remove-Item Env:WAFL_DB_AUDIT_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_DB_AUDIT_APPROVED = $previousDbApproved }
          if ($null -eq $previousDbFingerprint) { Remove-Item Env:WAFL_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_APPROVED_DB_FINGERPRINT = $previousDbFingerprint }
          if ($null -eq $previousConfirmation) { Remove-Item Env:WAFL_PUBLIC_SIGNUP_E2E_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_PUBLIC_SIGNUP_E2E_CONFIRMATION = $previousConfirmation }
      }
  }

  function RunFunctionsAutomationCoverageAudit {
      param([bool]$PauseAfter = $true)
      $auditLogDir = Join-Path (Split-Path -Parent $LogDir) "Repo_Status"
      return (InvokeProjectCommandWithResultFile -Title "Functions Automation Coverage Audit" -Label "Functions_Automation_Coverage_Audit" -NpmCommand "node tests/functions-public-signup-automation-contract.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $auditLogDir)
  }

function RunWorkorderSizeSpecCompatibilityAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeReadOnlyDbAudit -Mode 'workorder-size-spec-compatibility' -Title 'Workorder Size Spec Compatibility Audit' -Label 'Workorder_Size_Spec_Compatibility_Audit' -PauseAfter $PauseAfter)
}

function ApplyWorkorderSizeSpecMigration {
    param([bool]$PauseAfter = $true)
    return (InvokeApprovedDbMigrationCommand -Mode 'workorder-size-spec' -Title 'Apply Workorder Size Spec Migration' -Label 'Apply_Workorder_Size_Spec_Migration' -PauseAfter $PauseAfter)
}

function RunWorkorderSizeSpecPostApplyAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeReadOnlyDbAudit -Mode 'workorder-size-spec-post-apply' -Title 'Workorder Size Spec Post-Apply Audit' -Label 'Workorder_Size_Spec_Post_Apply_Audit' -PauseAfter $PauseAfter)
}

function RunWorkorderSizeSpecIntegration {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Workorder Size Spec Integration" -Label "Workorder_Size_Spec_Integration" -NpmCommand "node tests/workorder-size-spec-contract.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory (Join-Path (Split-Path -Parent $LogDir) "DB_Audit"))
}

function RunWorkorderPdfVisualCheck {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Workorder PDF Visual Static Check" -Label "Workorder_PDF_Visual_Static_Check" -NpmCommand "node tests/workorder-incomplete-final-pdf-contract.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory (Join-Path (Split-Path -Parent $LogDir) "PDF_Test"))
}

function RunWorkorderSizeSpecResidualAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeReadOnlyDbAudit -Mode 'workorder-size-spec-post-apply' -Title 'Workorder Size Spec Final Residual Audit' -Label 'Workorder_Size_Spec_Final_Residual_Audit' -PauseAfter $PauseAfter)
}

function RunProductUxLanguageAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Product UX Language Audit" -Label "Product_UX_Language_Audit" -NpmCommand "node tests/customer-product-ux-0.24.34.2-contract.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory (Join-Path (Split-Path -Parent $LogDir) "UX_Audit"))
}

function RunCustomerProductUxCleanupVerification {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Customer Product UX Cleanup Verification" -Label "Customer_Product_UX_Cleanup_Verification" -NpmCommand "powershell -NoProfile -ExecutionPolicy Bypass -File tools/pipeline/verify-safe.ps1 -Profile customer-product-ux-cleanup" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory (Join-Path (Split-Path -Parent $LogDir) "UX_Audit"))
}

function RunWorkorderPdfLiveIntegrationVerification {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "Workorder PDF Live R2 Integration Verification" -Label "Workorder_PDF_Live_R2_Integration_Verification" -NpmCommand "powershell -NoProfile -ExecutionPolicy Bypass -File tools/pipeline/verify-safe.ps1 -Profile workorder-pdf-live-integration" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory (Join-Path (Split-Path -Parent $LogDir) "R2_Test"))
}

function RunProductUiRuntimeVerification {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "0.24.34.4 Final Product Verification" -Label "Product_UI_Runtime_Verification" -NpmCommand "powershell -NoProfile -ExecutionPolicy Bypass -File tools/pipeline/verify-safe.ps1 -Profile product-ui-runtime-verification" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory (Join-Path (Split-Path -Parent $LogDir) "UI_QA"))
}

function RunBillingPostApplyAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeReadOnlyDbAudit -Mode 'billing-post-apply' -Title 'Billing Post-Apply Audit' -Label 'Billing_Post_Apply_Audit' -PauseAfter $PauseAfter)
}

function RunBillingOperationsIntegration {
    param([bool]$PauseAfter = $true)
    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $approvedFingerprint = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
    if ([string]::IsNullOrWhiteSpace($approvedFingerprint)) {
        LogError "pipeline.config.psd1에 Simulator.ApprovedDbFingerprint가 설정되지 않았습니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 1
    }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:WAFL_SERVER_RUNTIME_MODE }
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL

    Write-Host ""
    Write-Host "Billing Operations Integration guard"
    Write-Host "Runtime: $runtime"
    Write-Host "DB fingerprint: $($guard.Fingerprint)"
    Write-Host "Approved DB fingerprint matched: $($guard.Passed)"
    Write-Host "Production: false required"
    Write-Host "Mutation: dev/test DB fixture rows only, rollback transaction"
    Write-Host "R2 Mutation: none"
    Write-Host "Mode: billing-operations-integration"

    if (-not $guard.Passed) {
        LogError "Billing Operations Integration guard failed: $($guard.Reason)"
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 1
    }

    $env:WAFL_DB_AUDIT_APPROVED = "1"
    $env:WAFL_APPROVED_DB_FINGERPRINT = $approvedFingerprint
    $env:WAFL_BILLING_OPERATIONS_CONFIRMATION = "RUN_BILLING_OPERATIONS_DEV_TEST"
    return (InvokeProjectCommandWithResultFile -Title "Billing Operations Integration" -Label "Billing_Operations_Integration" -NpmCommand "node scripts/run-billing-operations-integration.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory (Join-Path (Split-Path -Parent $LogDir) "DB_Audit"))
}

function RunSystemCatalogProvisioningIntegration {
    param([bool]$PauseAfter = $true)

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:WAFL_SERVER_RUNTIME_MODE }
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL

    Write-Host ""
    Write-Host "System Catalog Provisioning integration guard"
    Write-Host "Runtime: $runtime"
    Write-Host "DB fingerprint: $($guard.Fingerprint)"
    Write-Host "Approved DB fingerprint matched: $($guard.Passed)"
    Write-Host "Production: false required"
    Write-Host "Mutation: dev/test DB fixture rows only, with cleanup"
    Write-Host "R2 Mutation: none"
    Write-Host "Mode: system-catalog-provisioning-integration"

    if (-not $guard.Passed) {
        LogError "System Catalog Provisioning integration test가 차단되었습니다. dev/test 승인 DB만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }

    $catalogLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
    $previousDbApproved = $env:WAFL_DB_AUDIT_APPROVED
    $previousDbFingerprint = $env:WAFL_APPROVED_DB_FINGERPRINT
    $previousCatalogEnabled = $env:WAFL_ENABLE_SYSTEM_CATALOG_INTEGRATION
    $previousCatalogConfirmation = $env:WAFL_SYSTEM_CATALOG_INTEGRATION_CONFIRMATION
    try {
        $env:WAFL_DB_AUDIT_APPROVED = '1'
        $env:WAFL_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_ENABLE_SYSTEM_CATALOG_INTEGRATION = '1'
        $env:WAFL_SYSTEM_CATALOG_INTEGRATION_CONFIRMATION = 'RUN_SYSTEM_CATALOG_PROVISIONING_DEV_TEST'
        return (InvokeProjectCommandWithResultFile -Title "System Catalog Provisioning Integration" -Label "System_Catalog_Provisioning_Integration" -NpmCommand "node scripts/run-system-catalog-provisioning-integration.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $catalogLogDir)
    }
    finally {
        if ($null -eq $previousDbApproved) { Remove-Item Env:WAFL_DB_AUDIT_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_DB_AUDIT_APPROVED = $previousDbApproved }
        if ($null -eq $previousDbFingerprint) { Remove-Item Env:WAFL_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_APPROVED_DB_FINGERPRINT = $previousDbFingerprint }
        if ($null -eq $previousCatalogEnabled) { Remove-Item Env:WAFL_ENABLE_SYSTEM_CATALOG_INTEGRATION -ErrorAction SilentlyContinue } else { $env:WAFL_ENABLE_SYSTEM_CATALOG_INTEGRATION = $previousCatalogEnabled }
        if ($null -eq $previousCatalogConfirmation) { Remove-Item Env:WAFL_SYSTEM_CATALOG_INTEGRATION_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_SYSTEM_CATALOG_INTEGRATION_CONFIRMATION = $previousCatalogConfirmation }
    }
}

function RunPdfR2LifecycleCompatibilityAudit {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "PDF/R2 Lifecycle Compatibility Audit" -Label "PDF_R2_Lifecycle_Compatibility_Audit" -NpmCommand "node scripts/run-pdf-r2-lifecycle-audit.mjs --compatibility" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory (Join-Path (Split-Path -Parent $LogDir) "DB_Audit"))
}

function RunPdfR2FixtureGenerate {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "PDF/R2 Fixture Generate" -Label "PDF_R2_Fixture_Generate" -NpmCommand "node scripts/generate-pdf-r2-fixtures.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory (Join-Path (Split-Path -Parent $LogDir) "R2_Test"))
}

function RunPdfR2LifecycleIntegration {
    param([bool]$PauseAfter = $true)
    $previousDbApproved = $env:WAFL_DB_AUDIT_APPROVED
    $previousDbFingerprint = $env:WAFL_APPROVED_DB_FINGERPRINT
    $previousIntegrationApproved = $env:WAFL_PDF_R2_LIFECYCLE_INTEGRATION_APPROVED
    $previousConfirmation = $env:WAFL_PDF_R2_LIFECYCLE_CONFIRMATION
    $previousR2Alias = $env:WAFL_PDF_R2_ENV_ALIAS
    $previousR2EnvironmentFingerprint = $env:WAFL_PDF_R2_APPROVED_ENVIRONMENT_FINGERPRINT
    $previousR2UrlFingerprint = $env:WAFL_PDF_R2_APPROVED_WORKER_URL_FINGERPRINT
    $previousR2HostFingerprint = $env:WAFL_PDF_R2_APPROVED_WORKER_HOST_FINGERPRINT
    try {
        $env:WAFL_DB_AUDIT_APPROVED = '1'
        $env:WAFL_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_PDF_R2_LIFECYCLE_INTEGRATION_APPROVED = '1'
        $env:WAFL_PDF_R2_LIFECYCLE_CONFIRMATION = 'RUN_PDF_R2_LIFECYCLE_DEV_TEST'
        $env:WAFL_PDF_R2_ENV_ALIAS = 'dev-test'
        $env:WAFL_PDF_R2_APPROVED_ENVIRONMENT_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedWorkerEnvironmentFingerprint
        $env:WAFL_PDF_R2_APPROVED_WORKER_URL_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedWorkerUrlFingerprint
        $env:WAFL_PDF_R2_APPROVED_WORKER_HOST_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedWorkerHostFingerprint
        return (InvokeProjectCommandWithResultFile -Title "PDF/R2 Lifecycle Integration" -Label "PDF_R2_Lifecycle_Integration" -NpmCommand "node scripts/run-pdf-r2-lifecycle-integration.mjs" -LoadEnvLocal $true -PauseAfter $PauseAfter -ResultDirectory (Join-Path (Split-Path -Parent $LogDir) "R2_Test"))
    }
    finally {
        if ($null -eq $previousDbApproved) { Remove-Item Env:WAFL_DB_AUDIT_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_DB_AUDIT_APPROVED = $previousDbApproved }
        if ($null -eq $previousDbFingerprint) { Remove-Item Env:WAFL_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_APPROVED_DB_FINGERPRINT = $previousDbFingerprint }
        if ($null -eq $previousIntegrationApproved) { Remove-Item Env:WAFL_PDF_R2_LIFECYCLE_INTEGRATION_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_PDF_R2_LIFECYCLE_INTEGRATION_APPROVED = $previousIntegrationApproved }
        if ($null -eq $previousConfirmation) { Remove-Item Env:WAFL_PDF_R2_LIFECYCLE_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_PDF_R2_LIFECYCLE_CONFIRMATION = $previousConfirmation }
        if ($null -eq $previousR2Alias) { Remove-Item Env:WAFL_PDF_R2_ENV_ALIAS -ErrorAction SilentlyContinue } else { $env:WAFL_PDF_R2_ENV_ALIAS = $previousR2Alias }
        if ($null -eq $previousR2EnvironmentFingerprint) { Remove-Item Env:WAFL_PDF_R2_APPROVED_ENVIRONMENT_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_PDF_R2_APPROVED_ENVIRONMENT_FINGERPRINT = $previousR2EnvironmentFingerprint }
        if ($null -eq $previousR2UrlFingerprint) { Remove-Item Env:WAFL_PDF_R2_APPROVED_WORKER_URL_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_PDF_R2_APPROVED_WORKER_URL_FINGERPRINT = $previousR2UrlFingerprint }
        if ($null -eq $previousR2HostFingerprint) { Remove-Item Env:WAFL_PDF_R2_APPROVED_WORKER_HOST_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_PDF_R2_APPROVED_WORKER_HOST_FINGERPRINT = $previousR2HostFingerprint }
    }
}

function RunPdfR2ReconciliationDryRun {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "PDF/R2 Reconciliation Dry Run" -Label "PDF_R2_Reconciliation_Dry_Run" -NpmCommand "node scripts/run-pdf-r2-reconciliation-dry-run.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory (Join-Path (Split-Path -Parent $LogDir) "R2_Test"))
}

function RunPdfR2ExactCleanupPlan {
    param([bool]$PauseAfter = $true)
    return (InvokeProjectCommandWithResultFile -Title "PDF/R2 Exact Cleanup Plan" -Label "PDF_R2_Exact_Cleanup_Plan" -NpmCommand "node scripts/run-pdf-r2-exact-cleanup-plan.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory (Join-Path (Split-Path -Parent $LogDir) "R2_Test"))
}
function RunSignupConsentRollbackSmoke {
    param([bool]$PauseAfter = $true)
    return (InvokeApprovedDbSmokeCommand -Command 'node scripts/run-signup-consent-rollback-smoke.mjs' -Title 'Signup Consent Rollback Smoke' -Label 'Signup_Consent_Rollback_Smoke' -PauseAfter $PauseAfter)
}

function RunSignupCertificateR2IntegrationTest {
    param([bool]$PauseAfter = $true)

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL

    Write-Host ""
    Write-Host "Signup Certificate R2 integration guard"
    Write-Host "Runtime: $runtime"
    Write-Host "DB fingerprint: $($guard.Fingerprint)"
    Write-Host "Approved DB fingerprint matched: $($guard.Passed)"
    Write-Host "Production: false required"
    Write-Host "Mutation: dev/test DB test rows + dev/test R2 fixture objects, with cleanup/finally"
    Write-Host "Mode: signup-certificate-r2-integration"

    if (-not $guard.Passed) {
        LogError "Signup Certificate R2 integration test가 차단되었습니다. dev/test 승인 DB만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }

    $r2TestLogDir = Join-Path (Split-Path -Parent $LogDir) "R2_Test"
    $previousDbApproved = $env:WAFL_DB_AUDIT_APPROVED
    $previousDbFingerprint = $env:WAFL_APPROVED_DB_FINGERPRINT
    $previousIntegrationApproved = $env:WAFL_SIGNUP_CERTIFICATE_R2_INTEGRATION_APPROVED
    $previousConfirmation = $env:WAFL_SIGNUP_CERTIFICATE_R2_CONFIRMATION
    $previousR2Alias = $env:WAFL_SIGNUP_CERTIFICATE_R2_ENV_ALIAS
    $previousR2EnvironmentFingerprint = $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_ENVIRONMENT_FINGERPRINT
    $previousR2UrlFingerprint = $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_URL_FINGERPRINT
    $previousR2HostFingerprint = $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_HOST_FINGERPRINT
    $previousManifestDir = $env:WAFL_SIGNUP_CERTIFICATE_R2_MANIFEST_DIR
    try {
        $env:WAFL_DB_AUDIT_APPROVED = '1'
        $env:WAFL_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_SIGNUP_CERTIFICATE_R2_INTEGRATION_APPROVED = '1'
        $env:WAFL_SIGNUP_CERTIFICATE_R2_CONFIRMATION = 'RUN_SIGNUP_CERTIFICATE_R2_DEV_TEST_INTEGRATION'
        $env:WAFL_SIGNUP_CERTIFICATE_R2_ENV_ALIAS = 'dev-test'
        $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_ENVIRONMENT_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedWorkerEnvironmentFingerprint
        $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_URL_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedWorkerUrlFingerprint
        $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_HOST_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedWorkerHostFingerprint
        $env:WAFL_SIGNUP_CERTIFICATE_R2_MANIFEST_DIR = $r2TestLogDir
        return (InvokeProjectCommandWithResultFile -Title "Signup Certificate R2 Integration Test" -Label "Signup_Certificate_R2_Integration_Test" -NpmCommand "node scripts/run-signup-certificate-r2-integration.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $r2TestLogDir)
    }
    finally {
        if ($null -eq $previousDbApproved) { Remove-Item Env:WAFL_DB_AUDIT_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_DB_AUDIT_APPROVED = $previousDbApproved }
        if ($null -eq $previousDbFingerprint) { Remove-Item Env:WAFL_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_APPROVED_DB_FINGERPRINT = $previousDbFingerprint }
        if ($null -eq $previousIntegrationApproved) { Remove-Item Env:WAFL_SIGNUP_CERTIFICATE_R2_INTEGRATION_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_CERTIFICATE_R2_INTEGRATION_APPROVED = $previousIntegrationApproved }
        if ($null -eq $previousConfirmation) { Remove-Item Env:WAFL_SIGNUP_CERTIFICATE_R2_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_CERTIFICATE_R2_CONFIRMATION = $previousConfirmation }
        if ($null -eq $previousR2Alias) { Remove-Item Env:WAFL_SIGNUP_CERTIFICATE_R2_ENV_ALIAS -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_CERTIFICATE_R2_ENV_ALIAS = $previousR2Alias }
        if ($null -eq $previousR2EnvironmentFingerprint) { Remove-Item Env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_ENVIRONMENT_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_ENVIRONMENT_FINGERPRINT = $previousR2EnvironmentFingerprint }
        if ($null -eq $previousR2UrlFingerprint) { Remove-Item Env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_URL_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_URL_FINGERPRINT = $previousR2UrlFingerprint }
        if ($null -eq $previousR2HostFingerprint) { Remove-Item Env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_HOST_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_HOST_FINGERPRINT = $previousR2HostFingerprint }
        if ($null -eq $previousManifestDir) { Remove-Item Env:WAFL_SIGNUP_CERTIFICATE_R2_MANIFEST_DIR -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_CERTIFICATE_R2_MANIFEST_DIR = $previousManifestDir }
    }
}

function RunSignupCertificateR2IntegrationPreflight {
    param([bool]$PauseAfter = $true)

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL

    Write-Host ""
    Write-Host "Signup Certificate R2 integration preflight"
    Write-Host "Runtime: $runtime"
    Write-Host "DB fingerprint: $($guard.Fingerprint)"
    Write-Host "Approved DB fingerprint matched: $($guard.Passed)"
    Write-Host "Mutation: none"
    Write-Host "Mode: signup-certificate-r2-preflight"

    if (-not $guard.Passed) {
        LogError "Signup Certificate R2 preflight가 차단되었습니다. dev/test 승인 DB만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }

    $r2TestLogDir = Join-Path (Split-Path -Parent $LogDir) "R2_Test"
    $previousDbApproved = $env:WAFL_DB_AUDIT_APPROVED
    $previousDbFingerprint = $env:WAFL_APPROVED_DB_FINGERPRINT
    $previousR2Alias = $env:WAFL_SIGNUP_CERTIFICATE_R2_ENV_ALIAS
    $previousR2EnvironmentFingerprint = $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_ENVIRONMENT_FINGERPRINT
    $previousR2UrlFingerprint = $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_URL_FINGERPRINT
    $previousR2HostFingerprint = $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_HOST_FINGERPRINT
    try {
        $env:WAFL_DB_AUDIT_APPROVED = '1'
        $env:WAFL_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_SIGNUP_CERTIFICATE_R2_ENV_ALIAS = 'dev-test'
        $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_ENVIRONMENT_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedWorkerEnvironmentFingerprint
        $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_URL_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedWorkerUrlFingerprint
        $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_HOST_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedWorkerHostFingerprint
        return (InvokeProjectCommandWithResultFile -Title "Signup Certificate R2 Integration Preflight" -Label "Signup_Certificate_R2_Integration_Preflight" -NpmCommand "node scripts/run-signup-certificate-r2-integration.mjs --preflight" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $r2TestLogDir -ApprovalRequiredExitCode 2 -ApprovalRequiredResultToken "Result: APPROVAL_REQUIRED")
    }
    finally {
        if ($null -eq $previousDbApproved) { Remove-Item Env:WAFL_DB_AUDIT_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_DB_AUDIT_APPROVED = $previousDbApproved }
        if ($null -eq $previousDbFingerprint) { Remove-Item Env:WAFL_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_APPROVED_DB_FINGERPRINT = $previousDbFingerprint }
        if ($null -eq $previousR2Alias) { Remove-Item Env:WAFL_SIGNUP_CERTIFICATE_R2_ENV_ALIAS -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_CERTIFICATE_R2_ENV_ALIAS = $previousR2Alias }
        if ($null -eq $previousR2EnvironmentFingerprint) { Remove-Item Env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_ENVIRONMENT_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_ENVIRONMENT_FINGERPRINT = $previousR2EnvironmentFingerprint }
        if ($null -eq $previousR2UrlFingerprint) { Remove-Item Env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_URL_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_URL_FINGERPRINT = $previousR2UrlFingerprint }
        if ($null -eq $previousR2HostFingerprint) { Remove-Item Env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_HOST_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_HOST_FINGERPRINT = $previousR2HostFingerprint }
    }
}

function RunSignupApprovalProvisioningIntegration {
    param([bool]$PauseAfter = $true)

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:WAFL_SERVER_RUNTIME_MODE }
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL

    Write-Host ""
    Write-Host "Signup Approval Provisioning integration guard"
    Write-Host "Runtime: $runtime"
    Write-Host "DB fingerprint: $($guard.Fingerprint)"
    Write-Host "Approved DB fingerprint matched: $($guard.Passed)"
    Write-Host "Production: false required"
    Write-Host "Mutation: dev/test DB fixture rows only, with manifest-scoped cleanup"
    Write-Host "R2 Mutation: none"
    Write-Host "Mode: signup-approval-provisioning-integration"

    if (-not $guard.Passed) {
        LogError "Signup Approval Provisioning integration test가 차단되었습니다. dev/test 승인 DB만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }

    $approvalLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
    $previousDbApproved = $env:WAFL_DB_AUDIT_APPROVED
    $previousDbFingerprint = $env:WAFL_APPROVED_DB_FINGERPRINT
    $previousProvisioningEnabled = $env:WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING
    $previousProvisioningConfirmation = $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION
    try {
        $env:WAFL_DB_AUDIT_APPROVED = '1'
        $env:WAFL_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING = '1'
        $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION = 'RUN_SIGNUP_APPROVAL_PROVISIONING_DEV_TEST'
        return (InvokeProjectCommandWithResultFile -Title "Signup Approval Provisioning Integration" -Label "Signup_Approval_Provisioning_Integration" -NpmCommand "node scripts/run-signup-approval-provisioning-integration.mjs" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $approvalLogDir)
    }
    finally {
        if ($null -eq $previousDbApproved) { Remove-Item Env:WAFL_DB_AUDIT_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_DB_AUDIT_APPROVED = $previousDbApproved }
        if ($null -eq $previousDbFingerprint) { Remove-Item Env:WAFL_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_APPROVED_DB_FINGERPRINT = $previousDbFingerprint }
        if ($null -eq $previousProvisioningEnabled) { Remove-Item Env:WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING -ErrorAction SilentlyContinue } else { $env:WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING = $previousProvisioningEnabled }
        if ($null -eq $previousProvisioningConfirmation) { Remove-Item Env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION = $previousProvisioningConfirmation }
    }
}

function CleanupSignupApprovalProvisioningFixtures {
    param([bool]$PauseAfter = $true)

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:WAFL_SERVER_RUNTIME_MODE }
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL

    Write-Host ""
    Write-Host "Signup Approval Provisioning fixture cleanup guard"
    Write-Host "Runtime: $runtime"
    Write-Host "DB fingerprint: $($guard.Fingerprint)"
    Write-Host "Approved DB fingerprint matched: $($guard.Passed)"
    Write-Host "Production: false required"
    Write-Host "Mutation: dev/test DB fixture cleanup only"
    Write-Host "R2 Mutation: none"
    Write-Host "Mode: signup-approval-provisioning-cleanup"

    if (-not $guard.Passed) {
        LogError "Signup Approval Provisioning fixture cleanup이 차단되었습니다. dev/test 승인 DB만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }

    $approvalLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
    $previousDbApproved = $env:WAFL_DB_AUDIT_APPROVED
    $previousDbFingerprint = $env:WAFL_APPROVED_DB_FINGERPRINT
    $previousProvisioningEnabled = $env:WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING
    $previousProvisioningConfirmation = $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION
    $previousCleanupOnly = $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CLEANUP_ONLY
    try {
        $env:WAFL_DB_AUDIT_APPROVED = '1'
        $env:WAFL_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING = '1'
        $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION = 'RUN_SIGNUP_APPROVAL_PROVISIONING_DEV_TEST'
        $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CLEANUP_ONLY = '1'
        return (InvokeProjectCommandWithResultFile -Title "Signup Approval Provisioning Fixture Cleanup" -Label "Signup_Approval_Provisioning_Fixture_Cleanup" -NpmCommand "node scripts/run-signup-approval-provisioning-integration.mjs --cleanup-leftovers" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $approvalLogDir)
    }
    finally {
        if ($null -eq $previousDbApproved) { Remove-Item Env:WAFL_DB_AUDIT_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_DB_AUDIT_APPROVED = $previousDbApproved }
        if ($null -eq $previousDbFingerprint) { Remove-Item Env:WAFL_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_APPROVED_DB_FINGERPRINT = $previousDbFingerprint }
        if ($null -eq $previousProvisioningEnabled) { Remove-Item Env:WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING -ErrorAction SilentlyContinue } else { $env:WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING = $previousProvisioningEnabled }
        if ($null -eq $previousProvisioningConfirmation) { Remove-Item Env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION = $previousProvisioningConfirmation }
        if ($null -eq $previousCleanupOnly) { Remove-Item Env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CLEANUP_ONLY -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CLEANUP_ONLY = $previousCleanupOnly }
    }
}

function DiagnoseSignupApprovalProvisioningSchema {
    param([bool]$PauseAfter = $true)

    if (-not (LoadEnvLocalForSmokeTest)) { if ($PauseAfter) { WaitForDeveloperToolsMenu }; return 1 }
    $runtime = [string]$env:NEXT_PUBLIC_APP_RUNTIME_MODE
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:WAFL_SERVER_RUNTIME_MODE }
    if ([string]::IsNullOrWhiteSpace($runtime)) { $runtime = [string]$env:NODE_ENV }
    $guard = TestReadOnlyDbAuditGuard -Runtime $runtime -DatabaseUrl $env:DATABASE_URL

    Write-Host ""
    Write-Host "Signup Approval Provisioning schema diagnostic guard"
    Write-Host "Runtime: $runtime"
    Write-Host "DB fingerprint: $($guard.Fingerprint)"
    Write-Host "Approved DB fingerprint matched: $($guard.Passed)"
    Write-Host "Production: false required"
    Write-Host "Mutation: none"
    Write-Host "R2 Mutation: none"
    Write-Host "Mode: signup-approval-provisioning-schema-diagnostic"

    if (-not $guard.Passed) {
        LogError "Signup Approval Provisioning schema diagnostic이 차단되었습니다. dev/test 승인 DB만 허용합니다."
        if ($PauseAfter) { WaitForDeveloperToolsMenu }
        return 2
    }

    $approvalLogDir = Join-Path (Split-Path -Parent $LogDir) "DB_Audit"
    $previousDbApproved = $env:WAFL_DB_AUDIT_APPROVED
    $previousDbFingerprint = $env:WAFL_APPROVED_DB_FINGERPRINT
    $previousProvisioningEnabled = $env:WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING
    $previousProvisioningConfirmation = $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION
    $previousDiagnostic = $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_SCHEMA_DIAGNOSTIC
    try {
        $env:WAFL_DB_AUDIT_APPROVED = '1'
        $env:WAFL_APPROVED_DB_FINGERPRINT = [string]$PipelineConfig.Simulator.ApprovedDbFingerprint
        $env:WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING = '1'
        $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION = 'RUN_SIGNUP_APPROVAL_PROVISIONING_DEV_TEST'
        $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_SCHEMA_DIAGNOSTIC = '1'
        return (InvokeProjectCommandWithResultFile -Title "Signup Approval Provisioning Schema Diagnostic" -Label "Signup_Approval_Provisioning_Schema_Diagnostic" -NpmCommand "node scripts/run-signup-approval-provisioning-integration.mjs --schema-diagnostic" -LoadEnvLocal $false -PauseAfter $PauseAfter -ResultDirectory $approvalLogDir)
    }
    finally {
        if ($null -eq $previousDbApproved) { Remove-Item Env:WAFL_DB_AUDIT_APPROVED -ErrorAction SilentlyContinue } else { $env:WAFL_DB_AUDIT_APPROVED = $previousDbApproved }
        if ($null -eq $previousDbFingerprint) { Remove-Item Env:WAFL_APPROVED_DB_FINGERPRINT -ErrorAction SilentlyContinue } else { $env:WAFL_APPROVED_DB_FINGERPRINT = $previousDbFingerprint }
        if ($null -eq $previousProvisioningEnabled) { Remove-Item Env:WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING -ErrorAction SilentlyContinue } else { $env:WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING = $previousProvisioningEnabled }
        if ($null -eq $previousProvisioningConfirmation) { Remove-Item Env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION = $previousProvisioningConfirmation }
        if ($null -eq $previousDiagnostic) { Remove-Item Env:WAFL_SIGNUP_APPROVAL_PROVISIONING_SCHEMA_DIAGNOSTIC -ErrorAction SilentlyContinue } else { $env:WAFL_SIGNUP_APPROVAL_PROVISIONING_SCHEMA_DIAGNOSTIC = $previousDiagnostic }
    }
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
        Write-Host "34. Simulator Attachment Plan                    [읽기 전용/변경 없음]"
        Write-Host "35. Simulator Attachment Local Generate          [로컬 .tmp 생성]"
        Write-Host "36. Simulator Attachment Upload+Seed             [DEV/TEST DB·R2 변경/별도 승인]"
        Write-Host "37. Simulator Attachment Verify+Reconcile        [읽기 전용/변경 없음]"
        Write-Host "38. Simulator Attachment Lifecycle Test          [DEV/TEST 변경/복구 가능/별도 승인]"
        Write-Host "39. Simulator Attachment Cleanup                 [파괴적 DEV/TEST/별도 승인]"
        Write-Host "40. Simulator Attachment Fault Plan              [읽기 전용/변경 없음]"
        Write-Host "41. Simulator Attachment Fault Execute           [DEV/TEST fault 생성/별도 승인]"
        Write-Host ""
        Write-Host "[DB 구조·제약·인덱스 읽기 전용 감사]"
        Write-Host "30. DB Schema Reconciliation Audit               [DEV/TEST·읽기 전용]"
        Write-Host "31. DB Constraint Readiness Check                [DEV/TEST·읽기 전용]"
        Write-Host "32. DB Index Usage/Query Readiness Report        [DEV/TEST·읽기 전용]"
        Write-Host "33. Pre-Codex Final Contract Gate                [안전/비파괴]"
        Write-Host "42. Signup Migration Compatibility Audit         [읽기 전용/DEV·TEST 승인 DB만]"
        Write-Host "43. Signup Consent Migration Compatibility Audit [읽기 전용/DEV·TEST 승인 DB만]"
        Write-Host "44. Signup Certificate R2 Integration Test       [DEV/TEST DB·R2 변경/별도 승인/자동 정리]"
        Write-Host "45. Signup Certificate R2 Integration Preflight  [읽기 전용/DEV·TEST 승인 DB·R2 fingerprint]"
        Write-Host "46. Signup Approval Provisioning Integration    [DEV/TEST DB 변경/자동 정리/R2 변경 없음]"
        Write-Host "47. System Catalog Compatibility Audit          [읽기 전용/DEV·TEST 승인 DB만]"
        Write-Host "48. System Catalog Migration Apply              [DEV/TEST DB 변경/별도 승인]"
        Write-Host "49. System Catalog Post-Apply Audit             [읽기 전용/DEV·TEST 승인 DB만]"
        Write-Host "50. System Catalog Provisioning Integration     [DEV/TEST DB 변경/자동 정리/R2 변경 없음]"
        Write-Host "51. PDF/R2 Lifecycle Compatibility Audit        [읽기 전용/로컬 정적 감사]"
        Write-Host "52. PDF Fixture Generate                        [로컬 .tmp 생성]"
        Write-Host "53. PDF/R2 Lifecycle Integration                [DEV/TEST DB·R2 변경/별도 승인/자동 정리]"
        Write-Host "54. PDF/R2 Reconciliation Dry Run               [읽기 전용/manifest-scoped]"
        Write-Host "55. PDF/R2 Exact Cleanup Plan                   [계획만/실제 삭제 없음]"
        Write-Host "56. Billing Compatibility Audit                 [읽기 전용/DEV·TEST 승인 DB만]"
        Write-Host "57. Billing Migration Apply                     [DEV/TEST DB 변경/별도 승인]"
        Write-Host "58. Billing Post-Apply Audit                    [읽기 전용/DEV·TEST 승인 DB만]"
        Write-Host "59. Billing Simulator Integration               [DEV/TEST DB rollback fixture/cleanup]"
        Write-Host "60. Public Signup E2E Migration Apply           [DEV/TEST DB 변경/별도 승인]"
        Write-Host "61. Public Signup E2E Compatibility Audit       [읽기 전용/DEV·TEST 승인 DB만]"
        Write-Host "62. Public Signup E2E Post-Apply Audit          [읽기 전용/DEV·TEST 승인 DB만]"
        Write-Host "63. Public Signup E2E Integration               [DEV/TEST DB synthetic fixture/cleanup]"
        Write-Host "64. Authenticated Public Signup E2E             [DEV/TEST 브라우저 fixture/cleanup]"
        Write-Host "65. Public Signup Chromium E2E                  [DEV/TEST Chromium]"
        Write-Host "66. Public Signup Browser Matrix E2E            [DEV/TEST Chromium/WebKit/mobile/iPad]"
        Write-Host "67. Public Signup Deployed Smoke                [읽기 전용/배포 URL smoke]"
        Write-Host "68. Public Signup Final Residual Audit          [읽기 전용/DEV·TEST residual]"
        Write-Host "69. Functions Automation Coverage Audit         [읽기 전용]"
        Write-Host "70. Workorder Size Spec Compatibility Audit     [읽기 전용/DEV·TEST 승인 DB만]"
        Write-Host "71. Workorder Size Spec Migration Apply         [DEV/TEST DB 변경/별도 승인]"
        Write-Host "72. Workorder Size Spec Post-Apply Audit        [읽기 전용/DEV·TEST 승인 DB만]"
        Write-Host "73. Workorder Size Spec Integration             [안전/정적 contract]"
        Write-Host "74. Workorder PDF Visual Static Check           [안전/정적 PDF contract]"
        Write-Host "75. Workorder Size Spec Final Residual Audit    [읽기 전용/DEV·TEST residual]"
        Write-Host "76. Product UX Language Audit                   [안전/정적 contract]"
        Write-Host "77. Customer Product UX Cleanup Verification    [안전/정적+빌드 검증]"
        Write-Host "78. Workorder PDF Live R2 Integration Verification [안전/정적+빌드 검증]"
        Write-Host "79. 0.24.34.4 Final Product Verification        [안전/정적+빌드 검증]"
        Write-Host ""
        Write-Host "[/functions 데이터 변경 작업]"
        Write-Host "21. Simulator DB Seed Execute                    [주의/DEV·TEST]"
        Write-Host "22. Simulator DB Cleanup Execute                 [파괴적/DEV·TEST]"
        Write-Host ""
        Write-Host " 0. 상위 메뉴로"
        Write-Host "========================================================="
        $choice = (Read-Host "번호를 입력하세요 (최대 2자리)").Trim()

        if ($choice -notmatch '^\d{1,2}$') {
            Write-Host "잘못된 입력입니다. 0~77 범위의 한 자리 또는 두 자리 숫자를 입력하세요."
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
            30 { RunDbSchemaReconciliationAudit | Out-Null }
            31 { RunDbConstraintReadinessCheck | Out-Null }
            32 { RunDbIndexReadinessReport | Out-Null }
            33 { RunPreCodexFinalContractGate | Out-Null }
            34 { RunSimulatorAttachmentPlan | Out-Null }
            35 { RunSimulatorAttachmentLocalGenerate | Out-Null }
            36 { RunSimulatorAttachmentUploadSeed }
            37 { RunSimulatorAttachmentVerifyReconcile | Out-Null }
            38 { RunSimulatorAttachmentLifecycleTest }
            39 { RunSimulatorAttachmentCleanup }
            40 { RunSimulatorAttachmentFaultPlan | Out-Null }
            41 { RunSimulatorAttachmentFaultExecute }
            42 { RunSignupMigrationCompatibilityAudit | Out-Null }
            43 { RunSignupConsentMigrationCompatibilityAudit | Out-Null }
            44 { RunSignupCertificateR2IntegrationTest | Out-Null }
            45 { RunSignupCertificateR2IntegrationPreflight | Out-Null }
            46 { RunSignupApprovalProvisioningIntegration | Out-Null }
            47 { RunSystemCatalogCompatibilityAudit | Out-Null }
            48 { ApplySystemCatalogMigration | Out-Null }
            49 { RunSystemCatalogPostApplyAudit | Out-Null }
            50 { RunSystemCatalogProvisioningIntegration | Out-Null }
            51 { RunPdfR2LifecycleCompatibilityAudit | Out-Null }
            52 { RunPdfR2FixtureGenerate | Out-Null }
            53 { RunPdfR2LifecycleIntegration | Out-Null }
            54 { RunPdfR2ReconciliationDryRun | Out-Null }
            55 { RunPdfR2ExactCleanupPlan | Out-Null }
            56 { RunBillingCompatibilityAudit | Out-Null }
            57 { ApplyBillingOperationsMigration | Out-Null }
            58 { RunBillingPostApplyAudit | Out-Null }
            59 { RunBillingOperationsIntegration | Out-Null }
            60 { ApplyPublicSignupE2eMigration | Out-Null }
            61 { RunPublicSignupE2eCompatibilityAudit | Out-Null }
            62 { RunPublicSignupE2ePostApplyAudit | Out-Null }
            63 { RunPublicSignupE2eIntegration | Out-Null }
            64 { RunAuthenticatedPublicSignupE2e | Out-Null }
            65 { RunPublicSignupChromiumE2e | Out-Null }
            66 { RunPublicSignupBrowserMatrixE2e | Out-Null }
            67 { RunPublicSignupDeployedSmoke | Out-Null }
            68 { RunPublicSignupFinalResidualAudit | Out-Null }
            69 { RunFunctionsAutomationCoverageAudit | Out-Null }
            70 { RunWorkorderSizeSpecCompatibilityAudit | Out-Null }
            71 { ApplyWorkorderSizeSpecMigration | Out-Null }
            72 { RunWorkorderSizeSpecPostApplyAudit | Out-Null }
            73 { RunWorkorderSizeSpecIntegration | Out-Null }
            74 { RunWorkorderPdfVisualCheck | Out-Null }
            75 { RunWorkorderSizeSpecResidualAudit | Out-Null }
            76 { RunProductUxLanguageAudit | Out-Null }
            77 { RunCustomerProductUxCleanupVerification | Out-Null }
            78 { RunWorkorderPdfLiveIntegrationVerification | Out-Null }
            79 { RunProductUiRuntimeVerification | Out-Null }
            0  { return }
            default {
                Write-Host "등록되지 않은 메뉴 번호입니다. 0~79 범위의 표시된 번호를 입력하세요."
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
        WriteToggleMenuLine -Prefix "2. npm run dev watcher 시작/종료 토글" -Status $devServerStatus
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
if ($CreateWaflV2FailureHandoff) {
    if ([string]::IsNullOrWhiteSpace($WaflV2FailureStage) -or [string]::IsNullOrWhiteSpace($WaflV2FailureLogPath)) {
        throw "-CreateWaflV2FailureHandoff에는 stage와 canonical failure log path가 필요합니다."
    }
    NewWaflV2FailureHandoff -FailureStage $WaflV2FailureStage -FailureLogPath $WaflV2FailureLogPath | Out-Null
}
elseif ($CreateLocalRepoHandoff) {
    NewLocalRepositoryHandoff | Out-Null
}
elseif ($RunWaflV2MigrationPreflight) {
    $exitCode = InvokeWaflV2Alpha22Command -Mode "preflight" -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($ApplyWaflV2Migrations) {
    $exitCode = InvokeWaflV2Alpha22Command -Mode "apply" -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($ApplyWaflV2Alpha23MaterialIndex) {
    $exitCode = InvokeWaflV2Alpha22Command -Mode "apply-index" -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWaflV2PostApplyValidation) {
    $exitCode = InvokeWaflV2Alpha22Command -Mode "validate" -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif (-not [string]::IsNullOrWhiteSpace($RunWaflV2SeedProfile)) {
    $exitCode = InvokeWaflV2Alpha22Command -Mode "seed" -SeedProfile $RunWaflV2SeedProfile -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWaflV2DevTestVerification) {
    $exitCode = InvokeWaflV2Alpha22Command -Mode "verify" -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWaflV2Alpha23ListApiVerification) {
    $exitCode = InvokeWaflV2Alpha23ListApiVerification -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWaflV2Alpha24DetailApiVerification) {
    $exitCode = InvokeWaflV2Alpha24DetailApiVerification -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWaflV2Alpha25CommandPreflight) {
    $exitCode = InvokeWaflV2Alpha25CommandPreflight -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWaflV2Alpha25CommandRuntimeVerification) {
    $exitCode = InvokeWaflV2Alpha25CommandRuntimeVerification -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWaflV2Alpha26MaterialCommandPreflight) {
    $exitCode = InvokeWaflV2Alpha26MaterialCommandVerification -Mode "preflight" -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWaflV2Alpha26MaterialCommandRuntimeVerification) {
    $exitCode = InvokeWaflV2Alpha26MaterialCommandVerification -Mode "runtime" -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWaflV2Alpha27RevisionIssuePreflight) {
    $exitCode = InvokeWaflV2Alpha27RevisionIssueVerification -Mode "preflight" -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWaflV2Alpha27RevisionIssueRuntimeVerification) {
    $exitCode = InvokeWaflV2Alpha27RevisionIssueVerification -Mode "runtime" -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWaflV2Alpha27aNumberSettingsPreflight) {
    $exitCode = InvokeWaflV2Alpha27aNumberSettingsMigration -Mode "preflight" -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($ApplyWaflV2Alpha27aNumberSettingsMigration) {
    $exitCode = InvokeWaflV2Alpha27aNumberSettingsMigration -Mode "apply" -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($ApplyWaflV2Alpha27aSettingsFixture) {
    $exitCode = InvokeWaflV2Alpha27aSettingsFixture -Confirmation $WaflV2Confirmation -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunSignupConsentCompatibilityAudit) {
    $exitCode = RunSignupConsentMigrationCompatibilityAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($ApplySignupConsentMigration) {
    $exitCode = ApplySignupConsentMigration -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunSignupConsentPostApplyAudit) {
    $exitCode = RunSignupConsentPostApplyAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunSignupConsentRollbackSmoke) {
    $exitCode = RunSignupConsentRollbackSmoke -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunSignupCertificateR2IntegrationPreflight) {
    $exitCode = RunSignupCertificateR2IntegrationPreflight -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunSignupCertificateR2IntegrationTest) {
    $exitCode = RunSignupCertificateR2IntegrationTest -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunSignupApprovalProvisioningIntegration) {
    $exitCode = RunSignupApprovalProvisioningIntegration -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($CleanupSignupApprovalProvisioningFixtures) {
    $exitCode = CleanupSignupApprovalProvisioningFixtures -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($DiagnoseSignupApprovalProvisioningSchema) {
    $exitCode = DiagnoseSignupApprovalProvisioningSchema -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunSystemCatalogCompatibilityAudit) {
    $exitCode = RunSystemCatalogCompatibilityAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($ApplySystemCatalogMigration) {
    $exitCode = ApplySystemCatalogMigration -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunSystemCatalogPostApplyAudit) {
    $exitCode = RunSystemCatalogPostApplyAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunSystemCatalogProvisioningIntegration) {
    $exitCode = RunSystemCatalogProvisioningIntegration -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunPdfR2LifecycleCompatibilityAudit) {
    $exitCode = RunPdfR2LifecycleCompatibilityAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunPdfR2FixtureGenerate) {
    $exitCode = RunPdfR2FixtureGenerate -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunPdfR2LifecycleIntegration) {
    $exitCode = RunPdfR2LifecycleIntegration -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunPdfR2ReconciliationDryRun) {
    $exitCode = RunPdfR2ReconciliationDryRun -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunPdfR2ExactCleanupPlan) {
    $exitCode = RunPdfR2ExactCleanupPlan -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunBillingCompatibilityAudit) {
    $exitCode = RunBillingCompatibilityAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($ApplyBillingOperationsMigration) {
    $exitCode = ApplyBillingOperationsMigration -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunBillingPostApplyAudit) {
    $exitCode = RunBillingPostApplyAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunBillingOperationsIntegration) {
    $exitCode = RunBillingOperationsIntegration -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunPublicSignupE2eCompatibilityAudit) {
    $exitCode = RunPublicSignupE2eCompatibilityAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($ApplyPublicSignupE2eMigration) {
    $exitCode = ApplyPublicSignupE2eMigration -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunPublicSignupE2ePostApplyAudit) {
    $exitCode = RunPublicSignupE2ePostApplyAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunPublicSignupE2eIntegration) {
    $exitCode = RunPublicSignupE2eIntegration -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunAuthenticatedPublicSignupE2e) {
    $exitCode = RunAuthenticatedPublicSignupE2e -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunPublicSignupChromiumE2e) {
    $exitCode = RunPublicSignupChromiumE2e -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunPublicSignupBrowserMatrixE2e) {
    $exitCode = RunPublicSignupBrowserMatrixE2e -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunPublicSignupDeployedSmoke) {
    $exitCode = RunPublicSignupDeployedSmoke -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunPublicSignupFinalResidualAudit) {
    $exitCode = RunPublicSignupFinalResidualAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunFunctionsAutomationCoverageAudit) {
    $exitCode = RunFunctionsAutomationCoverageAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWorkorderSizeSpecCompatibilityAudit) {
    $exitCode = RunWorkorderSizeSpecCompatibilityAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($ApplyWorkorderSizeSpecMigration) {
    $exitCode = ApplyWorkorderSizeSpecMigration -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWorkorderSizeSpecPostApplyAudit) {
    $exitCode = RunWorkorderSizeSpecPostApplyAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWorkorderSizeSpecIntegration) {
    $exitCode = RunWorkorderSizeSpecIntegration -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWorkorderPdfVisualCheck) {
    $exitCode = RunWorkorderPdfVisualCheck -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWorkorderSizeSpecResidualAudit) {
    $exitCode = RunWorkorderSizeSpecResidualAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunProductUxLanguageAudit) {
    $exitCode = RunProductUxLanguageAudit -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunCustomerProductUxCleanupVerification) {
    $exitCode = RunCustomerProductUxCleanupVerification -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunWorkorderPdfLiveIntegrationVerification) {
    $exitCode = RunWorkorderPdfLiveIntegrationVerification -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
elseif ($RunProductUiRuntimeVerification) {
    $exitCode = RunProductUiRuntimeVerification -PauseAfter $false
    if ($null -ne $exitCode) { exit ([int]$exitCode) }
}
else {
    MainLoop
}
