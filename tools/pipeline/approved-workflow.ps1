param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("Verify", "Handoff", "Plan", "Finish")]
    [string]$Action,

    [string]$Profile = "",
    [string]$CommitMessage = "",
    [string]$ExpectedAppVersion = "",
    [int]$MaxVerificationAgeMinutes = 240,
    [switch]$SkipHandoff
)

$ErrorActionPreference = "Stop"

$PipelineCommonPath = Join-Path $PSScriptRoot "pipeline-common.ps1"
if (-not (Test-Path -LiteralPath $PipelineCommonPath)) {
    throw "Pipeline common script not found: $PipelineCommonPath"
}

. $PipelineCommonPath

$AllowedProfiles = @(
    "system-admin-storage",
    "id-control-roadmap",
    "roadmap-development-contract",
    "system-admin-internal-access",
    "repository-cleanup",
    "source-architecture-cleanup",
    "automation-infrastructure",
    "workspace-commonization",
    "functions-automation",
    "billing-foundation",
    "billing-operations",
    "public-signup-e2e"
)

function NormalizeWorkflowPath {
    param([string]$Path)
    return (($Path -replace '\\', '/') -replace '^\./', '').Trim('/')
}

function TestWorkflowGitNoiseLine {
    param([string]$Line)
    return $Line -match '^\s*warning:\s+in the working copy of '
}

function InvokeWorkflowGit {
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

function AssertWorkflowGitSuccess {
    param(
        [string]$Label,
        [string[]]$Output
    )

    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed: $($Output -join [Environment]::NewLine)"
    }
}

function GetWorkflowGitSingleLine {
    param([string[]]$Arguments)

    $output = @(InvokeWorkflowGit -Arguments $Arguments)
    AssertWorkflowGitSuccess -Label "git $($Arguments -join ' ')" -Output $output
    return [string]($output | Where-Object { -not (TestWorkflowGitNoiseLine -Line ([string]$_)) } | Select-Object -First 1)
}

function GetWorkflowChangedFiles {
    $names = New-Object System.Collections.Generic.List[string]
    foreach ($line in (InvokeWorkflowGit -Arguments @("diff", "--name-only"))) {
        if (-not [string]::IsNullOrWhiteSpace([string]$line) -and -not (TestWorkflowGitNoiseLine -Line ([string]$line))) {
            $names.Add((NormalizeWorkflowPath -Path ([string]$line)))
        }
    }
    foreach ($line in (InvokeWorkflowGit -Arguments @("diff", "--cached", "--name-only"))) {
        if (-not [string]::IsNullOrWhiteSpace([string]$line) -and -not (TestWorkflowGitNoiseLine -Line ([string]$line))) {
            $names.Add((NormalizeWorkflowPath -Path ([string]$line)))
        }
    }
    foreach ($line in (InvokeWorkflowGit -Arguments @("ls-files", "--others", "--exclude-standard"))) {
        if (-not [string]::IsNullOrWhiteSpace([string]$line) -and -not (TestWorkflowGitNoiseLine -Line ([string]$line))) {
            $names.Add((NormalizeWorkflowPath -Path ([string]$line)))
        }
    }
    return @($names | Sort-Object -Unique)
}

function GetWorkflowSha256Hex {
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

function GetWorkflowTextSha256Hex {
    param([string]$Text)
    return GetWorkflowSha256Hex -Bytes ([System.Text.Encoding]::UTF8.GetBytes($Text))
}

function GetWorkflowFileSha256Hex {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return "missing"
    }

    return GetWorkflowSha256Hex -Bytes ([System.IO.File]::ReadAllBytes($Path))
}

function GetWorkflowChangedFingerprint {
    param([string[]]$ChangedFiles)

    $parts = New-Object System.Collections.Generic.List[string]
    foreach ($path in ($ChangedFiles | Sort-Object)) {
        $normalized = NormalizeWorkflowPath -Path $path
        $fullPath = Join-Path $ProjectDir $normalized
        $parts.Add("$normalized=$((GetWorkflowFileSha256Hex -Path $fullPath))")
    }

    foreach ($line in (InvokeWorkflowGit -Arguments @("diff", "--binary", "--no-ext-diff"))) {
        if (-not (TestWorkflowGitNoiseLine -Line ([string]$line))) {
            $parts.Add([string]$line)
        }
    }
    foreach ($line in (InvokeWorkflowGit -Arguments @("diff", "--cached", "--binary", "--no-ext-diff"))) {
        if (-not (TestWorkflowGitNoiseLine -Line ([string]$line))) {
            $parts.Add([string]$line)
        }
    }

    return GetWorkflowTextSha256Hex -Text ($parts -join "`n")
}

function AssertAllowedProfile {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "-Profile is required for Action $Action"
    }
    if ($AllowedProfiles -notcontains $Value) {
        throw "Profile is not allowlisted: $Value"
    }
}

function AssertRequiredText {
    param(
        [string]$Value,
        [string]$Name
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "-$Name is required for Action $Action"
    }
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
            $files.Add((NormalizeWorkflowPath -Path $text))
        }
    }

    return @($files | Sort-Object -Unique)
}

function SelectMatchingVerificationResult {
    param(
        [string]$ProfileName,
        [string]$Branch,
        [string]$HeadHash,
        [string[]]$ChangedFiles,
        [string]$ChangedFingerprint
    )

    if (-not (Test-Path -LiteralPath $RepoStatusDir)) {
        throw "Verification result directory not found: $RepoStatusDir"
    }

    $latestMatch = $null
    $candidates = @(Get-ChildItem -LiteralPath $RepoStatusDir -File -Filter ("verify-safe-{0}-*.txt" -f $ProfileName) -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
    foreach ($candidate in $candidates) {
        $lines = @(Get-Content -LiteralPath $candidate.FullName -Encoding UTF8)
        $content = $lines -join "`n"
        if ($content -notmatch 'VERIFY_SAFE_RESULT:\s*PASS') {
            continue
        }
        if ((GetVerificationField -Lines $lines -Name "CheckOnly") -ne "False") {
            continue
        }
        if ((GetVerificationField -Lines $lines -Name "Profile") -ne $ProfileName) {
            continue
        }
        if ((GetVerificationField -Lines $lines -Name "Branch") -ne $Branch) {
            continue
        }
        if ((GetVerificationField -Lines $lines -Name "HeadHash") -ne $HeadHash) {
            continue
        }
        if ((GetVerificationField -Lines $lines -Name "ChangedFingerprint") -ne $ChangedFingerprint) {
            continue
        }

        $executedAtText = GetVerificationField -Lines $lines -Name "ExecutedAt"
        if ([string]::IsNullOrWhiteSpace($executedAtText)) {
            continue
        }
        $executedAt = [DateTimeOffset]::MinValue
        if (-not [DateTimeOffset]::TryParse($executedAtText, [ref]$executedAt)) {
            continue
        }
        if ($MaxVerificationAgeMinutes -gt 0 -and $executedAt -lt (Get-Date).AddMinutes(-1 * $MaxVerificationAgeMinutes)) {
            continue
        }

        $verifiedFiles = @(GetVerificationChangedFiles -Lines $lines)
        $unexpectedVerified = @($verifiedFiles | Where-Object { $ChangedFiles -notcontains $_ })
        $missingVerified = @($ChangedFiles | Where-Object { $verifiedFiles -notcontains $_ })
        if ($unexpectedVerified.Count -gt 0 -or $missingVerified.Count -gt 0) {
            continue
        }

        $latestMatch = [pscustomobject]@{
            Path = $candidate.FullName
            ExecutedAt = $executedAt
            Lines = $lines
        }
        break
    }

    if ($null -eq $latestMatch) {
        throw "No matching PASS verification result found. Run approved-workflow.ps1 -Action Verify -Profile $ProfileName for the current HEAD and working tree."
    }

    return $latestMatch
}

function WriteWorkflowState {
    param(
        [string]$ProfileName,
        [string[]]$ChangedFiles,
        [string]$ChangedFingerprint,
        [object]$VerificationResult
    )

    Write-Host "PeaceByPiece approved workflow"
    Write-Host "Action: $Action"
    Write-Host "Profile: $ProfileName"
    Write-Host "Branch: $(GetWorkflowGitSingleLine -Arguments @('branch', '--show-current'))"
    Write-Host "HEAD: $(GetWorkflowGitSingleLine -Arguments @('rev-parse', 'HEAD'))"
    Write-Host "ChangedFingerprint: $ChangedFingerprint"
    Write-Host "Changed files:"
    if ($ChangedFiles.Count -eq 0) {
        Write-Host " - (none)"
    }
    else {
        foreach ($path in $ChangedFiles) { Write-Host " - $path" }
    }
    if ($null -ne $VerificationResult) {
        Write-Host "VerificationResultPath: $($VerificationResult.Path)"
        Write-Host "VerificationExecutedAt: $($VerificationResult.ExecutedAt.ToString('o'))"
    }
}

$verifyScript = Join-Path $PSScriptRoot "verify-safe.ps1"
$finishScript = Join-Path $PSScriptRoot "finish-version.ps1"
$pipelineScript = Join-Path $PSScriptRoot "peacebypiece-auto-pipeline.ps1"

switch ($Action) {
    "Verify" {
        AssertAllowedProfile -Value $Profile
        & $verifyScript -Profile $Profile
        exit $LASTEXITCODE
    }
    "Handoff" {
        & $pipelineScript -CreateLocalRepoHandoff -VerificationResultPath "" -VerificationProfile ""
        exit $LASTEXITCODE
    }
    "Plan" {
        AssertAllowedProfile -Value $Profile
        AssertRequiredText -Value $CommitMessage -Name "CommitMessage"
        AssertRequiredText -Value $ExpectedAppVersion -Name "ExpectedAppVersion"

        $branch = GetWorkflowGitSingleLine -Arguments @("branch", "--show-current")
        $headHash = GetWorkflowGitSingleLine -Arguments @("rev-parse", "HEAD")
        $changedFiles = @(GetWorkflowChangedFiles)
        if ($changedFiles.Count -eq 0) {
            throw "No changed files to plan."
        }
        $changedFingerprint = GetWorkflowChangedFingerprint -ChangedFiles $changedFiles
        $verificationResult = SelectMatchingVerificationResult -ProfileName $Profile -Branch $branch -HeadHash $headHash -ChangedFiles $changedFiles -ChangedFingerprint $changedFingerprint

        WriteWorkflowState -ProfileName $Profile -ChangedFiles $changedFiles -ChangedFingerprint $changedFingerprint -VerificationResult $verificationResult
        Write-Host ""
        & $finishScript -CommitMessage $CommitMessage -Paths ($changedFiles -join ",") -ExpectedAppVersion $ExpectedAppVersion -VerificationProfile $Profile -VerificationResultPath $verificationResult.Path
        exit $LASTEXITCODE
    }
    "Finish" {
        AssertAllowedProfile -Value $Profile
        AssertRequiredText -Value $CommitMessage -Name "CommitMessage"
        AssertRequiredText -Value $ExpectedAppVersion -Name "ExpectedAppVersion"

        $branch = GetWorkflowGitSingleLine -Arguments @("branch", "--show-current")
        if ($branch -ne "master") {
            throw "Finish is allowed only on master. Current: $branch"
        }
        $headHash = GetWorkflowGitSingleLine -Arguments @("rev-parse", "HEAD")
        $changedFiles = @(GetWorkflowChangedFiles)
        if ($changedFiles.Count -eq 0) {
            throw "No changed files to finish."
        }
        $changedFingerprint = GetWorkflowChangedFingerprint -ChangedFiles $changedFiles
        $verificationResult = SelectMatchingVerificationResult -ProfileName $Profile -Branch $branch -HeadHash $headHash -ChangedFiles $changedFiles -ChangedFingerprint $changedFingerprint

        WriteWorkflowState -ProfileName $Profile -ChangedFiles $changedFiles -ChangedFingerprint $changedFingerprint -VerificationResult $verificationResult
        Write-Host ""
        & $finishScript -CommitMessage $CommitMessage -Paths ($changedFiles -join ",") -ExpectedAppVersion $ExpectedAppVersion -VerificationProfile $Profile -VerificationResultPath $verificationResult.Path -Execute
        $finishExitCode = $LASTEXITCODE
        if ($finishExitCode -ne 0) {
            exit $finishExitCode
        }

        if (-not $SkipHandoff) {
            Write-Host ""
            Write-Host "Finish PASS. Creating 4. Newest handoff artifacts."
            & $pipelineScript -CreateLocalRepoHandoff -VerificationResultPath $verificationResult.Path -VerificationProfile $Profile
            exit $LASTEXITCODE
        }

        exit 0
    }
}
