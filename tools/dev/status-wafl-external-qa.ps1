$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "wafl-external-qa-common.ps1")

$state = Read-WaflQaState
Write-Host ("Status: {0}" -f $state.status)
Write-Host ("APP_VERSION: {0}" -f $state.appVersion)
Write-Host ("Last successful stage: {0}" -f $state.lastSuccessfulStage)
if ($state.PSObject.Properties.Name -contains "readApiGuard") { Write-Host ("Read API guard: {0}" -f $state.readApiGuard) }
if ($state.PSObject.Properties.Name -contains "readApiRuntime") { Write-Host ("Read API runtime: {0}" -f $state.readApiRuntime) }
if ($state.PSObject.Properties.Name -contains "fingerprintVerified") { Write-Host ("DB fingerprint verified: {0}" -f $state.fingerprintVerified) }
if ($state.PSObject.Properties.Name -contains "fingerprintPrefix" -and $state.fingerprintPrefix) { Write-Host ("DB fingerprint prefix: {0}" -f $state.fingerprintPrefix) }
if ($state.PSObject.Properties.Name -contains "commandApi") { Write-Host ("Command API: {0}" -f $state.commandApi) }
if ($state.PSObject.Properties.Name -contains "mutationMode") { Write-Host ("Mutation mode: {0}" -f $state.mutationMode) }
if ($state.PSObject.Properties.Name -contains "tailscaleServeReady") { Write-Host ("Tailscale Serve ready: {0}" -f $state.tailscaleServeReady) }
if ($state.PSObject.Properties.Name -contains "developerAutoConnectReady") { Write-Host ("Developer auto-connect ready: {0}" -f $state.developerAutoConnectReady) }
if ($state.PSObject.Properties.Name -contains "developerIdentityVerified") { Write-Host ("Developer identity verified: {0}" -f $state.developerIdentityVerified) }
if ($state.PSObject.Properties.Name -contains "developerLoginHashPrefix" -and $state.developerLoginHashPrefix) { Write-Host ("Developer login hash prefix: {0}" -f $state.developerLoginHashPrefix) }
if ($state.PSObject.Properties.Name -contains "serveConfigOwnership") { Write-Host ("Serve ownership: {0}" -f $state.serveConfigOwnership) }
if ($state.PSObject.Properties.Name -contains "mobileTransport" -and $state.mobileTransport) { Write-Host ("Mobile transport: {0}" -f $state.mobileTransport) }
if ($state.publicOrigin) { Write-Host ("Viewer base origin: {0}" -f $state.publicOrigin) }
if ($state.PSObject.Properties.Name -contains "expoUrl" -and $state.expoUrl) { Write-Host ("Development Client Metro URL (same tailnet only): {0}" -f $state.expoUrl) }
foreach ($record in @($state.processes)) {
    $process = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
    Write-Host ("{0}: PID {1}, alive={2}" -f $record.role, $record.pid, [bool]$process)
}
Write-Host "Stop command: .\tools\dev\stop-wafl-external-qa.ps1"
