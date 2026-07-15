$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$project = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
. (Join-Path $project "tools\pipeline\approved-applied-migration-guard.ps1")
$manifest = Import-PowerShellDataFile -LiteralPath (Join-Path $project "tools\pipeline\approved-applied-migrations.psd1")
$approval = [hashtable]$manifest.Alpha42Migration012

function NewGuardState {
    $hashes = @{}
    foreach ($migration in $approval.MigrationFiles) { $hashes[[string]$migration.Name] = [string]$migration.Sha256 }
    return @{
        VerificationProfile = "automation-infrastructure"
        ExpectedAppVersion = "2.0.0-alpha.41"
        RuntimeEnvironment = "development"
        TargetFingerprint = "01e5dcc7fea3"
        LedgerCount = 12
        ApplyCount = 1
        ChangedMigrationPaths = @("db/v2/migrations/012_v2_document_access_token_purpose.sql")
        MigrationFiles = @($approval.MigrationFiles | ForEach-Object { [string]$_.Name })
        MigrationHashes = $hashes
        ApplyEvidenceValid = $true
        PostApplyEvidenceValid = $true
    }
}

function AssertGuardFails {
    param([Parameter(Mandatory = $true)][scriptblock]$Mutation, [Parameter(Mandatory = $true)][string]$Name)
    $state = NewGuardState
    & $Mutation $state
    try {
        AssertApprovedAppliedMigrationState -Approval $approval -State $state | Out-Null
        throw "guard case unexpectedly passed: $Name"
    }
    catch {
        if ($_.Exception.Message -like "guard case unexpectedly passed:*") { throw }
    }
}

$pass = AssertApprovedAppliedMigrationState -Approval $approval -State (NewGuardState)
if ($pass.Status -ne "approved-already-applied-pending-commit") { throw "exact approved state did not pass" }

AssertGuardFails -Name "SHA one-character mismatch" -Mutation { param($state) $state.MigrationHashes["012_v2_document_access_token_purpose.sql"] = "5" + $state.MigrationHashes["012_v2_document_access_token_purpose.sql"].Substring(1) }
AssertGuardFails -Name "migration content hash mismatch" -Mutation { param($state) $state.MigrationHashes["012_v2_document_access_token_purpose.sql"] = "0" * 64 }
AssertGuardFails -Name "ledger 11/11" -Mutation { param($state) $state.LedgerCount = 11 }
AssertGuardFails -Name "apply count zero" -Mutation { param($state) $state.ApplyCount = 0 }
AssertGuardFails -Name "apply count two" -Mutation { param($state) $state.ApplyCount = 2 }
AssertGuardFails -Name "different fingerprint" -Mutation { param($state) $state.TargetFingerprint = "ffffffffffff" }
AssertGuardFails -Name "production runtime" -Mutation { param($state) $state.RuntimeEnvironment = "production" }
AssertGuardFails -Name "migration 011 changed" -Mutation { param($state) $state.ChangedMigrationPaths = @("db/v2/migrations/011_v2_document_access_viewer_functions.sql", "db/v2/migrations/012_v2_document_access_token_purpose.sql") }
AssertGuardFails -Name "migration 011 content changed" -Mutation { param($state) $state.MigrationHashes["011_v2_document_access_viewer_functions.sql"] = "0" * 64 }
AssertGuardFails -Name "migration 013 added" -Mutation { param($state) $state.MigrationFiles += "013_unapproved.sql"; $state.MigrationHashes["013_unapproved.sql"] = "0" * 64 }
AssertGuardFails -Name "approval evidence missing" -Mutation { param($state) $state.ApplyEvidenceValid = $false }

Write-Output "APPROVED_APPLIED_MIGRATION_PLAN_GUARD_CONTRACT: PASS"
