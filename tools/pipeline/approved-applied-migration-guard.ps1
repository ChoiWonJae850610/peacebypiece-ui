$ErrorActionPreference = "Stop"

function GetApprovedAppliedMigrationFileSha256 {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "approved migration guard file missing: $Path"
    }
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function AssertApprovedAppliedMigrationState {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Approval,
        [Parameter(Mandatory = $true)][hashtable]$State
    )

    if ($Approval.Status -ne "approved-already-applied-pending-commit") { throw "approved migration status invalid" }
    if ($State.VerificationProfile -ne $Approval.VerificationProfile) { throw "approved migration profile mismatch" }
    if ($Approval.ExpectedAppVersions -notcontains $State.ExpectedAppVersion) { throw "approved migration app version mismatch" }
    if ($State.RuntimeEnvironment -notin @("development", "test")) { throw "approved migration production runtime forbidden" }
    if ($State.RuntimeEnvironment -ne $Approval.RuntimeEnvironment) { throw "approved migration runtime mismatch" }
    if ($State.TargetFingerprint -ne $Approval.TargetFingerprint) { throw "approved migration fingerprint mismatch" }
    if ([int]$State.LedgerCount -ne [int]$Approval.ExpectedLedgerCount) { throw "approved migration ledger mismatch" }
    if ([int]$State.ApplyCount -ne [int]$Approval.ExpectedApplyCount) { throw "approved migration apply count mismatch" }
    if (-not $State.ApplyEvidenceValid -or -not $State.PostApplyEvidenceValid) { throw "approved migration evidence missing or invalid" }

    $changed = @($State.ChangedMigrationPaths | Sort-Object -Unique)
    if ($changed.Count -ne 1 -or $changed[0] -ne $Approval.MigrationPath) {
        throw "approved migration changed path mismatch"
    }

    $expectedFiles = @($Approval.MigrationFiles | ForEach-Object { [string]$_.Name } | Sort-Object)
    $actualFiles = @($State.MigrationFiles | Sort-Object)
    if (($expectedFiles -join "`n") -ne ($actualFiles -join "`n")) {
        throw "approved migration manifest mismatch"
    }

    foreach ($migration in $Approval.MigrationFiles) {
        $name = [string]$migration.Name
        $expectedSha = ([string]$migration.Sha256).ToLowerInvariant()
        $actualSha = ([string]$State.MigrationHashes[$name]).ToLowerInvariant()
        if ([string]::IsNullOrWhiteSpace($actualSha) -or $actualSha -ne $expectedSha) {
            throw "approved migration SHA mismatch: $name"
        }
    }

    $approvedName = Split-Path -Leaf $Approval.MigrationPath
    if ($State.MigrationHashes[$approvedName] -ne $Approval.MigrationSha256) {
        throw "approved migration SHA mismatch"
    }

    return [pscustomobject]@{
        Status = $Approval.Status
        MigrationPath = $Approval.MigrationPath
        MigrationSha256 = $Approval.MigrationSha256
        TargetFingerprint = $Approval.TargetFingerprint
        LedgerCount = [int]$Approval.ExpectedLedgerCount
        ApplyCount = [int]$Approval.ExpectedApplyCount
    }
}

function TestApprovedAppliedMigrationEvidence {
    param(
        [Parameter(Mandatory = $true)][string]$RepoStatusDir,
        [Parameter(Mandatory = $true)][hashtable]$Evidence
    )

    $path = Join-Path $RepoStatusDir ([string]$Evidence.FileName)
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return $false }
    if ((GetApprovedAppliedMigrationFileSha256 -Path $path) -ne ([string]$Evidence.Sha256).ToLowerInvariant()) { return $false }
    $content = Get-Content -LiteralPath $path -Raw -Encoding UTF8
    foreach ($marker in $Evidence.RequiredMarkers) {
        if ($content.IndexOf([string]$marker, [System.StringComparison]::Ordinal) -lt 0) { return $false }
    }
    return $true
}

function AssertApprovedAppliedMigrationCommitGuard {
    param(
        [Parameter(Mandatory = $true)][string]$ProjectDir,
        [Parameter(Mandatory = $true)][string]$RepoStatusDir,
        [Parameter(Mandatory = $true)][string]$VerificationProfile,
        [Parameter(Mandatory = $true)][string]$ExpectedAppVersion,
        [Parameter(Mandatory = $true)][string[]]$ChangedMigrationPaths,
        [Parameter(Mandatory = $true)][string]$ConfiguredFingerprint
    )

    $manifestPath = Join-Path $PSScriptRoot "approved-applied-migrations.psd1"
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw "approved migration manifest missing" }
    $manifest = Import-PowerShellDataFile -LiteralPath $manifestPath
    $matchingApprovals = @($manifest.GetEnumerator() | Where-Object {
        $candidate = [hashtable]$_.Value
        $candidate.ExpectedAppVersions -contains $ExpectedAppVersion -and
        $ChangedMigrationPaths -contains ([string]$candidate.MigrationPath)
    })
    if ($matchingApprovals.Count -ne 1) { throw "approved migration selection mismatch" }
    $approval = [hashtable]$matchingApprovals[0].Value

    $explicitRuntime = [string]$env:WAFL_V2_RUNTIME
    $runtimeEnvironment = if ([string]::IsNullOrWhiteSpace($explicitRuntime)) {
        [string]$approval.RuntimeEnvironment
    } else {
        $explicitRuntime
    }

    $migrationDir = Join-Path $ProjectDir "db\v2\migrations"
    $migrationFiles = @(Get-ChildItem -LiteralPath $migrationDir -Filter "*.sql" -File | Sort-Object Name)
    $hashes = @{}
    foreach ($file in $migrationFiles) {
        $hashes[$file.Name] = GetApprovedAppliedMigrationFileSha256 -Path $file.FullName
    }

    $applyEvidenceValid = TestApprovedAppliedMigrationEvidence -RepoStatusDir $RepoStatusDir -Evidence ([hashtable]$approval.ApplyEvidence)
    $postApplyEvidenceValid = TestApprovedAppliedMigrationEvidence -RepoStatusDir $RepoStatusDir -Evidence ([hashtable]$approval.PostApplyEvidence)
    $applyEvidencePath = Join-Path $RepoStatusDir ([string]$approval.ApplyEvidence.FileName)
    $applyContent = if (Test-Path -LiteralPath $applyEvidencePath -PathType Leaf) {
        Get-Content -LiteralPath $applyEvidencePath -Raw -Encoding UTF8
    } else { "" }
    $applyCount = ([regex]::Matches($applyContent, [regex]::Escape([string]$approval.ApplyMarker))).Count

    $state = @{
        VerificationProfile = $VerificationProfile
        ExpectedAppVersion = $ExpectedAppVersion
        RuntimeEnvironment = $runtimeEnvironment
        TargetFingerprint = $ConfiguredFingerprint
        LedgerCount = [int]$approval.ExpectedLedgerCount
        ApplyCount = $applyCount
        ChangedMigrationPaths = @($ChangedMigrationPaths)
        MigrationFiles = @($migrationFiles.Name)
        MigrationHashes = $hashes
        ApplyEvidenceValid = $applyEvidenceValid
        PostApplyEvidenceValid = $postApplyEvidenceValid
    }
    return AssertApprovedAppliedMigrationState -Approval $approval -State $state
}
