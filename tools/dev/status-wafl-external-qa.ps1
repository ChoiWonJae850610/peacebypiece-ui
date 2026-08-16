$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "wafl-external-qa-common.ps1")

$state = Read-WaflQaState
$checks = [ordered]@{}

try {
    $nodeToolchain = Resolve-WaflQaCanonicalNodeToolchain
    $checks.NodeVersion = $nodeToolchain.Version -eq "v24.14.0" -and [string]$state.nodeVersion -eq "24.14.0"
} catch { $checks.NodeVersion = $false }

$roleAlive = @{}
foreach ($record in @($state.processes)) {
    $roleAlive[[string]$record.role] = [bool](Get-Process -Id ([int]$record.pid) -ErrorAction SilentlyContinue)
}
$nextRecord = @($state.processes | Where-Object role -eq 'next') | Select-Object -First 1
$metroRecord = @($state.processes | Where-Object role -eq 'expo') | Select-Object -First 1
$serveRecord = @($state.processes | Where-Object role -eq 'tailscale-serve') | Select-Object -First 1
$nextPid = if ($nextRecord) { [int]$nextRecord.pid } else { 0 }
$metroPid = if ($metroRecord) { [int]$metroRecord.pid } else { 0 }
$checks.NextProcess = $roleAlive.next -eq $true
$checks.MetroProcess = $roleAlive.expo -eq $true
$checks.ServeProcess = $roleAlive.'tailscale-serve' -eq $true
$nextListener = @(Get-NetTCPConnection -State Listen -LocalPort ([int]$state.nextPort) -ErrorAction SilentlyContinue)
$metroListener = @(Get-NetTCPConnection -State Listen -LocalPort ([int]$state.expoPort) -ErrorAction SilentlyContinue)
$port3000Listener = @(Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue)
$checks.NextListener = $nextPid -gt 0 -and @($nextListener | Where-Object OwningProcess -eq $nextPid).Count -gt 0
$checks.MetroListener = $metroPid -gt 0 -and @($metroListener | Where-Object OwningProcess -eq $metroPid).Count -gt 0
$checks.Port3000Clear = $port3000Listener.Count -eq 0

$nextHttp = 0
try { $nextHttp = [int](Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/v" -f $state.nextPort) -Method Get -TimeoutSec 10).StatusCode } catch {}
$checks.NextHttp = $nextHttp -eq 200

$tailscalePath = Get-WaflQaTailscalePath
$tailscaleRuntime = $null
if ($tailscalePath) { try { $tailscaleRuntime = Get-WaflQaTailscaleRuntime -TailscalePath $tailscalePath } catch {} }
$checks.TailscaleRunning = $null -ne $tailscaleRuntime
$checks.TailscaleHostCurrent = $checks.TailscaleRunning -and [string]$state.tailscaleIpv4 -eq [string]$tailscaleRuntime.Ipv4

$serveJson = ""
if ($tailscalePath) { try { $serveJson = (@(& $tailscalePath serve status --json 2>$null) -join "`n") } catch {} }
$serveSemantic = Get-WaflQaServeProxySemanticState -JsonText $serveJson -ExpectedBackend ("http://127.0.0.1:{0}" -f $state.nextPort)
$checks.ServeRoute = $serveSemantic.ExactExpectedOnly -eq $true
$funnelJson = ""
if ($tailscalePath) { try { $funnelJson = (@(& $tailscalePath funnel status --json 2>$null) -join "`n") } catch {} }
$funnelSemantic = Get-WaflQaFunnelSemanticState -JsonText $funnelJson
$checks.FunnelClear = $funnelSemantic.Parsed -and $funnelSemantic.SchemaValid -and $funnelSemantic.Enabled -eq $false
$checks.CloudflaredClear = @(Get-Process -Name cloudflared -ErrorAction SilentlyContinue).Count -eq 0

$manifestHttp = 0
$bundleHttp = 0
$bundleBytes = 0
$hostEquality = $false
try {
    $manifestResponse = Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/manifest?platform=ios" -f $state.expoPort) -Method Get -TimeoutSec 15
    $manifestHttp = [int]$manifestResponse.StatusCode
    $manifest = $manifestResponse.Content | ConvertFrom-Json -ErrorAction Stop
    $launchUri = [Uri][string]$manifest.launchAsset.url
    $redirect = Get-WaflQaRedirectResponse -Uri ("http://127.0.0.1:{0}/_expo/link?choice=expo-dev-client&platform=ios" -f $state.expoPort) -TimeoutSeconds 15
    $redirectUri = [Uri][string]$redirect.Location
    $redirectQuery = [System.Web.HttpUtility]::ParseQueryString($redirectUri.Query)
    $clientMetroUri = [Uri][string]$redirectQuery.Get("url")
    $hostEquality = $redirect.StatusCode -eq 307 `
        -and $launchUri.Host -eq [string]$tailscaleRuntime.Ipv4 `
        -and $clientMetroUri.Host -eq [string]$tailscaleRuntime.Ipv4 `
        -and $launchUri.Port -eq [int]$state.expoPort `
        -and $clientMetroUri.Port -eq [int]$state.expoPort
    $bundle = Invoke-WaflQaBundleTransfer -Uri $launchUri.AbsoluteUri -TimeoutSeconds 180
    $bundleHttp = $bundle.StatusCode
    $bundleBytes = $bundle.Bytes
} catch {}
$checks.Manifest = $manifestHttp -eq 200
$checks.Bundle = $bundleHttp -eq 200 -and $bundleBytes -gt 0
$checks.HostEquality = $hostEquality

$checks.EnvironmentContract = ($state.PSObject.Properties.Name -contains 'databaseEnvironmentInjected') `
    -and [bool]$state.databaseEnvironmentInjected `
    -and ($state.PSObject.Properties.Name -contains 'serverEnvironmentContractReady') `
    -and [bool]$state.serverEnvironmentContractReady `
    -and ($state.PSObject.Properties.Name -contains 'capabilityProfileReady') `
    -and [bool]$state.capabilityProfileReady `
    -and [string]$state.runtimeQaMode -eq "current-maker" `
    -and [string]$state.makerQaProfile -eq "alpha64-current-maker" `
    -and [string]$state.mutationMode -eq "current-maker-alpha64"

$readSmoke = Invoke-WaflQaDeveloperReadSmoke -State $state
$checks.DeveloperAutoConnect = $readSmoke.AutoConnectHttp -eq 200
$checks.CompanyContext = $readSmoke.AuthMeHttp -eq 200 -and $readSmoke.CompanyContextReady
$checks.WorkOrderList = $readSmoke.WorkOrderListHttp -eq 200 -and $readSmoke.WorkOrderListReady
$checks.OwnerFixtureDetail = $readSmoke.OwnerFixtureDetailHttp -eq 200 -and $readSmoke.OwnerFixtureDetailReady

$canonicalReady = @($checks.Values | Where-Object { $_ -ne $true }).Count -eq 0
Write-Host ("Status record: {0}" -f $state.status)
Write-Host ("APP_VERSION: {0}" -f $state.appVersion)
Write-Host ("Read API guard: {0}" -f $state.readApiGuard)
Write-Host ("DB fingerprint verified: {0}" -f $state.fingerprintVerified)
Write-Host ("Node 24.14.0: {0}" -f $checks.NodeVersion)
Write-Host ("Profile: {0} / {1}" -f $state.makerQaProfile, $state.mutationMode)
Write-Host ("Next: PID {0}, 3100 listener={1}, HTTP={2}" -f $nextRecord.pid, $checks.NextListener, $nextHttp)
Write-Host ("Metro: PID {0}, 8081 listener={1}, manifest/bundle={2}/{3}, bytes>0={4}" -f $metroRecord.pid, $checks.MetroListener, $manifestHttp, $bundleHttp, ($bundleBytes -gt 0))
Write-Host ("Serve: PID {0}, 443->3100={1}" -f $serveRecord.pid, $checks.ServeRoute)
Write-Host ("Tailscale/Metro/manifest/client host equality: {0}" -f $checks.HostEquality)
Write-Host ("Next canonical environment contract: {0}" -f $checks.EnvironmentContract)
Write-Host ("Developer auto-connect ready: {0}" -f $checks.DeveloperAutoConnect)
Write-Host ("DeveloperAutoConnect: HTTP {0}, ready={1}" -f $readSmoke.AutoConnectHttp, $checks.DeveloperAutoConnect)
Write-Host ("Auth/company context: HTTP {0}, ready={1}" -f $readSmoke.AuthMeHttp, $checks.CompanyContext)
Write-Host ("WorkOrder list read: HTTP {0}, ready={1}" -f $readSmoke.WorkOrderListHttp, $checks.WorkOrderList)
Write-Host ("Owner fixture detail read: HTTP {0}, ready={1}" -f $readSmoke.OwnerFixtureDetailHttp, $checks.OwnerFixtureDetail)
Write-Host ("Port 3000 clear: {0}; forbidden tunnel clear: {1}" -f $checks.Port3000Clear, ($checks.CloudflaredClear -and $checks.FunnelClear))
Write-Host ("Runtime canonical READY: {0}" -f $canonicalReady)
if (-not $canonicalReady) { exit 1 }
