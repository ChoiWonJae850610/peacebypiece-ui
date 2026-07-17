$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "wafl-external-qa-common.ps1")

$state = Read-WaflQaState
Write-Host ("Status: {0}" -f $state.status)
Write-Host ("APP_VERSION: {0}" -f $state.appVersion)
Write-Host ("Last successful stage: {0}" -f $state.lastSuccessfulStage)
if ($state.PSObject.Properties.Name -contains "mobileTransport" -and $state.mobileTransport) { Write-Host ("Mobile transport: {0}" -f $state.mobileTransport) }
if ($state.publicOrigin) { Write-Host ("Viewer base origin: {0}" -f $state.publicOrigin) }
if ($state.PSObject.Properties.Name -contains "expoUrl" -and $state.expoUrl) { Write-Host ("Expo Go URL (same tailnet only): {0}" -f $state.expoUrl) }
foreach ($record in @($state.processes)) {
    $process = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
    Write-Host ("{0}: PID {1}, alive={2}" -f $record.role, $record.pid, [bool]$process)
}
Write-Host "Stop command: .\tools\dev\stop-wafl-external-qa.ps1"
