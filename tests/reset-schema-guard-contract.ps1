$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$canonicalScript = Join-Path $root "tools\pipeline\peacebypiece-auto-pipeline.ps1"
$commonScript = Join-Path $root "tools\pipeline\pipeline-common.ps1"

if (-not (Test-Path $canonicalScript)) {
    throw "Canonical PowerShell entry point is missing: $canonicalScript"
}

$canonicalContent = Get-Content -Raw -Path $canonicalScript

function Assert-Contains {
    param(
        [string]$Content,
        [string]$Needle,
        [string]$Message
    )

    if ($Content.IndexOf($Needle, [System.StringComparison]::Ordinal) -lt 0) {
        throw $Message
    }
}

function Assert-GitExitCode {
    param(
        [string[]]$Arguments,
        [int]$ExpectedExitCode,
        [string]$Message
    )

    Push-Location $root
    try {
        & git @Arguments *> $null
        $actualExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    if ($actualExitCode -ne $ExpectedExitCode) {
        throw $Message
    }
}

Assert-GitExitCode -Arguments @("check-ignore", "-q", "--", "tools/pipeline/peacebypiece-auto-pipeline.ps1") -ExpectedExitCode 1 -Message "Canonical PowerShell entry point must not be ignored by Git."
Assert-GitExitCode -Arguments @("check-ignore", "-q", "--", "tools/pipeline/peacebypiece-auto-pipeline-patch-contract.ps1") -ExpectedExitCode 0 -Message "Patch PowerShell copies must remain ignored by Git."

Assert-Contains -Content $canonicalContent -Needle "RESET WAF-FN SCHEMA" -Message "Menu 9 exact reset confirmation phrase is missing."
Assert-Contains -Content $canonicalContent -Needle "TestResetDatabaseSchemaGuard" -Message "Menu 9 reset guard call is missing."
Assert-Contains -Content $canonicalContent -Needle "node scripts/run-sql-files.mjs" -Message "Reset SQL runner command is missing."

$guardCallIndex = $canonicalContent.IndexOf("TestResetDatabaseSchemaGuard", [System.StringComparison]::Ordinal)
$blockedBranchIndex = $canonicalContent.IndexOf("if (-not `$guardResult.Passed)", [System.StringComparison]::Ordinal)
$runnerIndex = $canonicalContent.IndexOf("node scripts/run-sql-files.mjs", [System.StringComparison]::Ordinal)

if ($guardCallIndex -lt 0 -or $runnerIndex -lt 0 -or $guardCallIndex -gt $runnerIndex) {
    throw "Reset guard must be called before the SQL runner command is prepared."
}

if ($blockedBranchIndex -lt 0 -or $blockedBranchIndex -gt $runnerIndex) {
    throw "Guard failure must return before the SQL runner command can be invoked."
}

. (Join-Path $root "tools\pipeline\pipeline-common.ps1")

function New-ApprovedFingerprint {
    param([string]$DatabaseUrl)
    $uri = [System.Uri]$DatabaseUrl
    $databaseName = $uri.AbsolutePath.Trim("/")
    return GetSha256HexPrefix -Value ("{0}/{1}" -f $uri.Host, $databaseName)
}

$validUrl = "postgresql://user:password@dev.example.test/wafl_fn_dev?sslmode=require"
$validFingerprint = New-ApprovedFingerprint -DatabaseUrl $validUrl

$scenarios = @(
    @{ Name = "allows approved development target"; Runtime = "development"; Url = $validUrl; Fingerprint = $validFingerprint; Prefix = "wafl-fn"; Confirm = "RESET WAF-FN SCHEMA"; Pass = $true },
    @{ Name = "blocks production runtime"; Runtime = "production"; Url = $validUrl; Fingerprint = $validFingerprint; Prefix = "wafl-fn"; Confirm = "RESET WAF-FN SCHEMA"; Pass = $false },
    @{ Name = "blocks missing runtime"; Runtime = ""; Url = $validUrl; Fingerprint = $validFingerprint; Prefix = "wafl-fn"; Confirm = "RESET WAF-FN SCHEMA"; Pass = $false },
    @{ Name = "blocks unknown runtime"; Runtime = "qa-prod"; Url = $validUrl; Fingerprint = $validFingerprint; Prefix = "wafl-fn"; Confirm = "RESET WAF-FN SCHEMA"; Pass = $false },
    @{ Name = "blocks fingerprint mismatch"; Runtime = "test"; Url = $validUrl; Fingerprint = "000000000000"; Prefix = "wafl-fn"; Confirm = "RESET WAF-FN SCHEMA"; Pass = $false },
    @{ Name = "blocks missing fingerprint"; Runtime = "test"; Url = $validUrl; Fingerprint = ""; Prefix = "wafl-fn"; Confirm = "RESET WAF-FN SCHEMA"; Pass = $false },
    @{ Name = "blocks invalid protocol"; Runtime = "test"; Url = "mysql://user:password@dev.example.test/wafl_fn_dev"; Fingerprint = $validFingerprint; Prefix = "wafl-fn"; Confirm = "RESET WAF-FN SCHEMA"; Pass = $false },
    @{ Name = "blocks prefix mismatch"; Runtime = "test"; Url = $validUrl; Fingerprint = $validFingerprint; Prefix = "prod"; Confirm = "RESET WAF-FN SCHEMA"; Pass = $false },
    @{ Name = "blocks confirmation mismatch"; Runtime = "test"; Url = $validUrl; Fingerprint = $validFingerprint; Prefix = "wafl-fn"; Confirm = "RESET"; Pass = $false },
    @{ Name = "blocks missing confirmation"; Runtime = "test"; Url = $validUrl; Fingerprint = $validFingerprint; Prefix = "wafl-fn"; Confirm = ""; Pass = $false },
    @{ Name = "blocks missing DB URL"; Runtime = "test"; Url = ""; Fingerprint = $validFingerprint; Prefix = "wafl-fn"; Confirm = "RESET WAF-FN SCHEMA"; Pass = $false }
)

foreach ($scenario in $scenarios) {
    $result = TestResetDatabaseSchemaGuard `
        -Runtime $scenario.Runtime `
        -DatabaseUrl $scenario.Url `
        -ApprovedDbFingerprint $scenario.Fingerprint `
        -TestPrefix $scenario.Prefix `
        -Confirmation $scenario.Confirm

    if ([bool]$result.Passed -ne [bool]$scenario.Pass) {
        throw "Scenario failed: $($scenario.Name)"
    }

    if (-not $result.Passed -and $result.ExitCode -eq 0) {
        throw "Blocked scenario returned zero exit code: $($scenario.Name)"
    }
}

Write-Host "PASS reset schema guard contract"
