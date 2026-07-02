param(
    [Parameter(Mandatory = $true)]
    [string]$CommitMessage,

    [Parameter(Mandatory = $true)]
    [string[]]$Paths,

    [string]$ExpectedAppVersion = "",
    [string]$VerificationResultPath = "",
    [string]$VerificationProfile = "",
    [switch]$Execute
)

$ErrorActionPreference = "Stop"

$PipelineCommonPath = Join-Path $PSScriptRoot "pipeline-common.ps1"
if (-not (Test-Path -LiteralPath $PipelineCommonPath)) {
    throw "Pipeline common script not found: $PipelineCommonPath"
}

. $PipelineCommonPath

function InvokeFinishGit {
    param([string[]]$Arguments)

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        return @(git `
            -c color.ui=false `
            -c core.pager=cat `
            -c core.quotepath=false `
            -c i18n.logOutputEncoding=utf-8 `
            -C $ProjectDir @Arguments 2>&1)
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
}

function AssertGitSuccess {
    param(
        [string]$Label,
        [string[]]$Output
    )

    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed: $($Output -join [Environment]::NewLine)"
    }
}

function NormalizeRelativePath {
    param([string]$Path)
    return (($Path -replace '\\', '/') -replace '^\./', '').Trim('/')
}

function TestGitNoiseLine {
    param([string]$Line)

    return $Line -match '^\s*warning:\s+in the working copy of '
}

function GetChangedFiles {
    $names = New-Object System.Collections.Generic.List[string]
    foreach ($line in (InvokeFinishGit -Arguments @("diff", "--name-only"))) {
        if (-not [string]::IsNullOrWhiteSpace([string]$line) -and -not (TestGitNoiseLine -Line ([string]$line))) {
            $names.Add((NormalizeRelativePath -Path ([string]$line)))
        }
    }
    foreach ($line in (InvokeFinishGit -Arguments @("diff", "--cached", "--name-only"))) {
        if (-not [string]::IsNullOrWhiteSpace([string]$line) -and -not (TestGitNoiseLine -Line ([string]$line))) {
            $names.Add((NormalizeRelativePath -Path ([string]$line)))
        }
    }
    foreach ($line in (InvokeFinishGit -Arguments @("ls-files", "--others", "--exclude-standard"))) {
        if (-not [string]::IsNullOrWhiteSpace([string]$line) -and -not (TestGitNoiseLine -Line ([string]$line))) {
            $names.Add((NormalizeRelativePath -Path ([string]$line)))
        }
    }
    return @($names | Sort-Object -Unique)
}

function GetGitSingleLine {
    param([string[]]$Arguments)

    $output = @(InvokeFinishGit -Arguments $Arguments)
    if ($LASTEXITCODE -ne 0 -or $output.Count -eq 0) {
        return ""
    }

    return [string]($output | Where-Object { -not (TestGitNoiseLine -Line ([string]$_)) } | Select-Object -First 1)
}

function GetSha256Hex {
    param([byte[]]$Bytes)

    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $hash = $sha256.ComputeHash($Bytes)
        return -join ($hash | ForEach-Object { $_.ToString("x2") })
    }
    finally {
        $sha256.Dispose()
    }
}

function GetTextSha256Hex {
    param([string]$Text)

    return GetSha256Hex -Bytes ([System.Text.Encoding]::UTF8.GetBytes($Text))
}

function GetFileSha256Hex {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return "missing"
    }

    return GetSha256Hex -Bytes ([System.IO.File]::ReadAllBytes($Path))
}

function GetChangedFingerprint {
    param([string[]]$ChangedFiles)

    $parts = New-Object System.Collections.Generic.List[string]
    foreach ($path in ($ChangedFiles | Sort-Object)) {
        $normalized = $path -replace '\\', '/'
        $fullPath = Join-Path $ProjectDir $normalized
        $parts.Add("$normalized=$((GetFileSha256Hex -Path $fullPath))")
    }

    $diffOutput = @(InvokeFinishGit -Arguments @("diff", "--binary", "--no-ext-diff"))
    foreach ($line in $diffOutput) {
        if (-not (TestGitNoiseLine -Line ([string]$line))) {
            $parts.Add([string]$line)
        }
    }
    $cachedDiffOutput = @(InvokeFinishGit -Arguments @("diff", "--cached", "--binary", "--no-ext-diff"))
    foreach ($line in $cachedDiffOutput) {
        if (-not (TestGitNoiseLine -Line ([string]$line))) {
            $parts.Add([string]$line)
        }
    }

    return GetTextSha256Hex -Text ($parts -join "`n")
}

function TestTextFile {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return $false
    }

    $item = Get-Item -LiteralPath $Path
    if ($item.Length -gt 1048576) {
        return $false
    }

    $stream = [System.IO.File]::OpenRead($Path)
    try {
        $buffer = New-Object byte[] ([Math]::Min(4096, $item.Length))
        $read = $stream.Read($buffer, 0, $buffer.Length)
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

function TestExamplePath {
    param([string]$RelativePath)

    $lower = $RelativePath.ToLowerInvariant()
    $leaf = [System.IO.Path]::GetFileName($lower)
    if ($lower -match '(^|/)(docs|tests|test|__tests__|fixtures|mocks|examples?|audits|보관문서)/') {
        return $true
    }
    return $leaf -match '(example|sample|placeholder|dummy|test|mock|fixture|contract)'
}

function FindSensitiveFiles {
    param([string[]]$ChangedFiles)

    $suspicious = New-Object System.Collections.Generic.List[string]
    $patterns = @(
        "-----BEGIN (RSA |DSA |EC |OPENSSH |)PRIVATE KEY-----",
        "(?i)\bBearer\s+[A-Za-z0-9._~+/=-]{32,}",
        "\bAKIA[0-9A-Z]{16}\b",
        "(?i)\bcloudflare[_-]?(api[_-]?)?token\b\s*[:=]\s*[`"'][A-Za-z0-9_\-\.]{24,}[`"']",
        "(?i)(postgres|postgresql|mysql|mongodb)://[^/\s:@]+:[^@\s]+@",
        "(?i)\b(secret|api[_-]?key|access[_-]?token|auth[_-]?token|password|passwd|pwd|credential)\b\s*[:=]\s*[`"'](?!\s*(example|sample|placeholder|dummy|test|mock|changeme|your-|<))[A-Za-z0-9_\-./+=@$!%*#?&]{16,}[`"']",
        "(?i)https?://[^/\s]*(prod|production)[^/\s]*\."
    )

    foreach ($relativePath in $ChangedFiles) {
        if (TestExamplePath -RelativePath $relativePath) {
            continue
        }
        $fullPath = Join-Path $ProjectDir $relativePath
        if (-not (TestTextFile -Path $fullPath)) {
            continue
        }
        $content = Get-Content -LiteralPath $fullPath -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
        foreach ($pattern in $patterns) {
            if ($content -match $pattern) {
                $suspicious.Add($relativePath)
                break
            }
        }
    }
    return @($suspicious | Sort-Object -Unique)
}

function GetVerificationField {
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

function GetVerificationChangedFiles {
    param([string[]]$Lines)

    $files = New-Object System.Collections.Generic.List[string]
    $inSection = $false
    foreach ($line in $Lines) {
        $text = [string]$line
        if ($text -eq "ChangedFiles:") {
            $inSection = $true
            continue
        }
        if ($inSection -and [string]::IsNullOrWhiteSpace($text)) {
            break
        }
        if ($inSection -and $text -ne "(none)") {
            $files.Add((NormalizeRelativePath -Path $text))
        }
    }

    return @($files | Sort-Object -Unique)
}

function AssertVerificationResult {
    param(
        [string]$CurrentHeadHash,
        [string[]]$CurrentChangedFiles,
        [string]$CurrentChangedFingerprint,
        [string[]]$AllowedPaths
    )

    if ([string]::IsNullOrWhiteSpace($VerificationResultPath)) {
        throw "-Execute requires -VerificationResultPath from verify-safe.ps1"
    }

    if ([string]::IsNullOrWhiteSpace($VerificationProfile)) {
        throw "-Execute requires -VerificationProfile so finish-version can reuse the correct verify-safe result"
    }

    if (-not (Test-Path -LiteralPath $VerificationResultPath -PathType Leaf)) {
        throw "Verification result file not found: $VerificationResultPath"
    }

    $lines = @(Get-Content -LiteralPath $VerificationResultPath -Encoding UTF8)
    $content = $lines -join "`n"
    if ($content -notmatch 'VERIFY_SAFE_RESULT:\s*PASS') {
        throw "Verification result is not PASS: $VerificationResultPath"
    }
    if ((GetVerificationField -Lines $lines -Name "CheckOnly") -ne "False") {
        throw "CheckOnly verification results cannot be used for commit/push: $VerificationResultPath"
    }
    if ((GetVerificationField -Lines $lines -Name "Profile") -ne $VerificationProfile) {
        throw "Verification profile mismatch. Expected=$VerificationProfile Actual=$((GetVerificationField -Lines $lines -Name "Profile"))"
    }
    if ((GetVerificationField -Lines $lines -Name "HeadHash") -ne $CurrentHeadHash) {
        throw "Verification HEAD mismatch. Re-run verify-safe for the current HEAD."
    }
    if ((GetVerificationField -Lines $lines -Name "ChangedFingerprint") -ne $CurrentChangedFingerprint) {
        throw "Verification changed fingerprint mismatch. Re-run verify-safe for the current working tree."
    }

    $verifiedFiles = @(GetVerificationChangedFiles -Lines $lines)
    $unexpectedVerified = @($verifiedFiles | Where-Object { $AllowedPaths -notcontains $_ })
    $missingVerified = @($AllowedPaths | Where-Object { $verifiedFiles -notcontains $_ })
    if ($unexpectedVerified.Count -gt 0 -or $missingVerified.Count -gt 0) {
        throw "Verification explicit path mismatch. Unexpected=$($unexpectedVerified -join ', ') Missing=$($missingVerified -join ', ')"
    }

    $currentMismatch = @($CurrentChangedFiles | Where-Object { $verifiedFiles -notcontains $_ })
    if ($currentMismatch.Count -gt 0) {
        throw "Current changed files were not verified: $($currentMismatch -join ', ')"
    }
}

$expectedProjectDir = [System.IO.Path]::GetFullPath("C:\CWJ_Project\peacebypiece-2.0")
if ([System.IO.Path]::GetFullPath($ProjectDir).TrimEnd('\') -ne $expectedProjectDir.TrimEnd('\')) {
    throw "Repository path mismatch: $ProjectDir"
}

$branch = (InvokeFinishGit -Arguments @("branch", "--show-current") | Select-Object -First 1)
AssertGitSuccess -Label "git branch" -Output @($branch)
if ([string]$branch -ne "master") {
    throw "Branch must be master. Current: $branch"
}

$originHash = @(InvokeFinishGit -Arguments @("rev-parse", "origin/master"))
AssertGitSuccess -Label "origin/master lookup" -Output $originHash

$aheadBehind = @(InvokeFinishGit -Arguments @("rev-list", "--left-right", "--count", "origin/master...HEAD"))
AssertGitSuccess -Label "ahead/behind check" -Output $aheadBehind
if ($aheadBehind.Count -eq 0 -or ([string]$aheadBehind[0]) -notmatch '^\s*0\s+0\s*$') {
    throw "origin/master divergence is not allowed before finish-version: $($aheadBehind -join ' ')"
}

if (-not [string]::IsNullOrWhiteSpace($ExpectedAppVersion)) {
    $actualAppVersion = GetProjectAppVersion
    if ($actualAppVersion -ne $ExpectedAppVersion) {
        throw "APP_VERSION mismatch. Expected=$ExpectedAppVersion Actual=$actualAppVersion"
    }
}

$allowPaths = @($Paths | ForEach-Object { [string]$_ -split ',' } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object { NormalizeRelativePath -Path $_ } | Sort-Object -Unique)
if ($allowPaths.Count -eq 0) {
    throw "At least one explicit path is required."
}

$changedFiles = @(GetChangedFiles)
$currentHeadHash = GetGitSingleLine -Arguments @("rev-parse", "HEAD")
$currentChangedFingerprint = GetChangedFingerprint -ChangedFiles $changedFiles
$unexpectedFiles = @($changedFiles | Where-Object { $allowPaths -notcontains $_ })
if ($unexpectedFiles.Count -gt 0) {
    throw "Unexpected changed files: $($unexpectedFiles -join ', ')"
}

$missingAllowedChanges = @($allowPaths | Where-Object { $changedFiles -notcontains $_ })
if ($missingAllowedChanges.Count -gt 0) {
    Write-Host "[WARN] Allowed path has no current change: $($missingAllowedChanges -join ', ')"
}

$packageChanges = @($changedFiles | Where-Object { $_ -in @("package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock") })
if ($packageChanges.Count -gt 0) {
    throw "Unexpected package/lockfile changes: $($packageChanges -join ', ')"
}

$migrationChanges = @($changedFiles | Where-Object { $_ -match '^(db/migrations/|db/schema/|.*migration.*\.sql$)' })
$allowedMigrationChanges = @()
if ($VerificationProfile -eq "billing-operations") {
    $allowedMigrationChanges = @("db/migrations/patch_0_24_32_billing_operations.sql")
}
if ($VerificationProfile -eq "public-signup-e2e") {
    $allowedMigrationChanges = @("db/migrations/patch_0_24_33_public_signup_e2e.sql")
}
$unexpectedMigrationChanges = @($migrationChanges | Where-Object { $allowedMigrationChanges -notcontains $_ })
if ($unexpectedMigrationChanges.Count -gt 0) {
    throw "Unexpected DB migration/schema changes: $($unexpectedMigrationChanges -join ', ')"
}
elseif ($migrationChanges.Count -gt 0) {
    Write-Host "[INFO] DB migration/schema changes allowed for profile ${VerificationProfile}: $($migrationChanges -join ', ')"
}

$sensitiveFiles = @(FindSensitiveFiles -ChangedFiles $changedFiles)
if ($sensitiveFiles.Count -gt 0) {
    throw "Suspicious secret/production value paths: $($sensitiveFiles -join ', ')"
}

$diffCheck = @(InvokeFinishGit -Arguments @("diff", "--check"))
AssertGitSuccess -Label "git diff --check" -Output $diffCheck

Write-Host "PeaceByPiece finish-version"
Write-Host "Mode: $(if ($Execute) { 'EXECUTE' } else { 'PLAN' })"
Write-Host "Project: $ProjectDir"
Write-Host "Branch: $branch"
Write-Host "Allowed paths:"
foreach ($path in $allowPaths) { Write-Host " - $path" }
Write-Host "Changed files:"
if ($changedFiles.Count -eq 0) { Write-Host " - (none)" } else { foreach ($path in $changedFiles) { Write-Host " - $path" } }

if (-not $Execute) {
    Write-Host ""
    Write-Host "PLAN ONLY: no git add, commit, or push was executed."
    exit 0
}

AssertVerificationResult -CurrentHeadHash $currentHeadHash -CurrentChangedFiles $changedFiles -CurrentChangedFingerprint $currentChangedFingerprint -AllowedPaths $allowPaths

foreach ($path in $allowPaths) {
    $fullPath = Join-Path $ProjectDir $path
    if (Test-Path -LiteralPath $fullPath) {
        $addOutput = @(InvokeFinishGit -Arguments @("add", "--", $path))
        AssertGitSuccess -Label "git add $path" -Output $addOutput
    }
    else {
        $rmOutput = @(InvokeFinishGit -Arguments @("rm", "--cached", "--ignore-unmatch", "--", $path))
        AssertGitSuccess -Label "git rm --cached $path" -Output $rmOutput
    }
}

$cachedCheck = @(InvokeFinishGit -Arguments @("diff", "--cached", "--check"))
AssertGitSuccess -Label "git diff --cached --check" -Output $cachedCheck

$stagedFiles = @(InvokeFinishGit -Arguments @("diff", "--cached", "--name-only") | ForEach-Object { NormalizeRelativePath -Path ([string]$_) })
AssertGitSuccess -Label "staged file list" -Output $stagedFiles
$unexpectedStaged = @($stagedFiles | Where-Object { $allowPaths -notcontains $_ })
if ($unexpectedStaged.Count -gt 0) {
    throw "Unexpected staged files: $($unexpectedStaged -join ', ')"
}

$commitOutput = @(InvokeFinishGit -Arguments @("commit", "-m", $CommitMessage))
AssertGitSuccess -Label "git commit" -Output $commitOutput

$pushOutput = @(InvokeFinishGit -Arguments @("push", "origin", "master"))
AssertGitSuccess -Label "git push origin master" -Output $pushOutput

$afterAheadBehind = @(InvokeFinishGit -Arguments @("rev-list", "--left-right", "--count", "origin/master...HEAD"))
AssertGitSuccess -Label "post-push ahead/behind" -Output $afterAheadBehind
if ($afterAheadBehind.Count -eq 0 -or ([string]$afterAheadBehind[0]) -notmatch '^\s*0\s+0\s*$') {
    throw "Post-push origin/master divergence remains: $($afterAheadBehind -join ' ')"
}

$finalStatus = @(InvokeFinishGit -Arguments @("status", "--short"))
AssertGitSuccess -Label "final status" -Output $finalStatus
if ($finalStatus.Count -gt 0) {
    throw "Working tree is not clean after push: $($finalStatus -join ', ')"
}

Write-Host "FINISH_VERSION_RESULT: PASS"
exit 0
