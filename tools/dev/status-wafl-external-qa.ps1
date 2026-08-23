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
$port3000Metadata = @()
foreach ($listenerPid in @($port3000Listener | ForEach-Object { [int]$_.OwningProcess } | Sort-Object -Unique)) {
    try {
        $metadata = Get-CimInstance Win32_Process -Filter ("ProcessId = {0}" -f $listenerPid) -ErrorAction Stop
        if ($null -ne $metadata) { $port3000Metadata += $metadata }
    } catch {}
}
$port3000Policy = Get-WaflQaPort3000ListenerPolicy -State $state -Listeners $port3000Listener -ProcessMetadata $port3000Metadata
$checks.Port3000Clear = $port3000Policy.Ready
$checks.MetroFirewall = $false
if ($metroPid -gt 0) {
    try {
        $metroProcessPath = (Get-Process -Id $metroPid -ErrorAction Stop).Path
        $checks.MetroFirewall = (Test-WaflQaMetroFirewallRule -NodePath $metroProcessPath -Port ([int]$state.expoPort)).Ready
    } catch {}
}
$expoStderrPath = Join-Path (Get-WaflQaStateDirectory) "expo.stderr.log"
$metroStaleStreamErrors = if (Test-Path -LiteralPath $expoStderrPath -PathType Leaf) {
    @(Select-String -LiteralPath $expoStderrPath -Pattern "ERR_STREAM_UNABLE_TO_PIPE" -SimpleMatch -ErrorAction SilentlyContinue).Count
} else { 0 }
$checks.MetroStreamHealthy = $metroStaleStreamErrors -eq 0

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
$cloudflaredProcesses = @(Get-Process -Name cloudflared -ErrorAction SilentlyContinue)
$cloudflaredMetadata = @()
$cloudflaredDiagnostics = @()
foreach ($cloudflaredProcess in $cloudflaredProcesses) {
    $metadata = $null
    try { $metadata = Get-CimInstance Win32_Process -Filter ("ProcessId = {0}" -f $cloudflaredProcess.Id) -ErrorAction Stop } catch {}
    if ($null -ne $metadata) {
        $service = $null
        try { $service = Get-CimInstance Win32_Service -Filter ("ProcessId = {0}" -f $cloudflaredProcess.Id) -ErrorAction Stop | Select-Object -First 1 } catch {}
        $signatureStatus = ''
        $cloudflareSigner = $false
        try {
            $signature = Get-AuthenticodeSignature -FilePath ([string]$metadata.ExecutablePath) -ErrorAction Stop
            $signatureStatus = [string]$signature.Status
            $cloudflareSigner = [string]$signature.SignerCertificate.Subject -match '(?i)Cloudflare'
        } catch {}
        $cloudflaredMetadata += [pscustomobject]@{
            ProcessId = [int]$metadata.ProcessId
            ParentProcessId = [int]$metadata.ParentProcessId
            ExecutablePath = [string]$metadata.ExecutablePath
            CommandLine = [string]$metadata.CommandLine
            IsWindowsService = $null -ne $service
            SignatureStatus = $signatureStatus
            CloudflareSigner = $cloudflareSigner
        }
    }

    $configText = ''
    try {
        $diagnosticListeners = @(Get-NetTCPConnection -State Listen -OwningProcess $cloudflaredProcess.Id -ErrorAction Stop)
        foreach ($diagnosticPort in @($diagnosticListeners.LocalPort | Sort-Object -Unique)) {
            try {
                $response = Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/config" -f $diagnosticPort) -Method Get -TimeoutSec 5
                if ([int]$response.StatusCode -eq 200 -and -not [string]::IsNullOrWhiteSpace([string]$response.Content)) {
                    $configText = [string]$response.Content
                    break
                }
            } catch {}
        }
    } catch {}
    $cloudflaredDiagnostics += [pscustomobject]@{
        ProcessId = [int]$cloudflaredProcess.Id
        Available = -not [string]::IsNullOrWhiteSpace($configText)
        JsonText = $configText
    }
}
$cloudflaredPolicy = Get-WaflQaCloudflaredProcessPolicy -State $state -Processes $cloudflaredProcesses -ProcessMetadata $cloudflaredMetadata -DiagnosticConfigs $cloudflaredDiagnostics
$checks.CloudflaredClear = $cloudflaredPolicy.Ready

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
    -and [string]$state.makerQaProfile -in @("alpha64-current-maker", "alpha65-current-maker", "alpha67-current-maker") `
    -and [string]$state.mutationMode -in @("current-maker-alpha64", "current-maker-alpha65", "current-maker-alpha67")

$readSmoke = Invoke-WaflQaDeveloperReadSmoke -State $state
$checks.DeveloperAutoConnect = $readSmoke.AutoConnectHttp -eq 200
$checks.CompanyContext = $readSmoke.AuthMeHttp -eq 200 -and $readSmoke.CompanyContextReady
$checks.WorkOrderList = $readSmoke.WorkOrderListHttp -eq 200 -and $readSmoke.WorkOrderListReady
$checks.OwnerFixtureDetail = $readSmoke.OwnerFixtureDetailHttp -in @(200, 204) -and $readSmoke.OwnerFixtureDetailReady

$canonicalReady = @($checks.Values | Where-Object { $_ -ne $true }).Count -eq 0
Write-Host ("Status record: {0}" -f $state.status)
Write-Host ("APP_VERSION: {0}" -f $state.appVersion)
Write-Host ("Read API guard: {0}" -f $state.readApiGuard)
Write-Host ("DB fingerprint verified: {0}" -f $state.fingerprintVerified)
Write-Host ("Node 24.14.0: {0}" -f $checks.NodeVersion)
Write-Host ("Profile: {0} / {1}" -f $state.makerQaProfile, $state.mutationMode)
Write-Host ("Next: PID {0}, 3100 listener={1}, HTTP={2}" -f $nextRecord.pid, $checks.NextListener, $nextHttp)
Write-Host ("Metro: PID {0}, 8081 listener={1}, manifest/bundle={2}/{3}, bytes>0={4}" -f $metroRecord.pid, $checks.MetroListener, $manifestHttp, $bundleHttp, ($bundleBytes -gt 0))
Write-Host ("Metro Tailscale inbound firewall: {0}" -f $checks.MetroFirewall)
Write-Host ("Metro stream healthy: {0}, stale-stream-errors={1}" -f $checks.MetroStreamHealthy, $metroStaleStreamErrors)
Write-Host ("Serve: PID {0}, 443->3100={1}" -f $serveRecord.pid, $checks.ServeRoute)
Write-Host ("Tailscale/Metro/manifest/client host equality: {0}" -f $checks.HostEquality)
Write-Host ("Next canonical environment contract: {0}" -f $checks.EnvironmentContract)
Write-Host ("Developer auto-connect ready: {0}" -f $checks.DeveloperAutoConnect)
Write-Host ("DeveloperAutoConnect: HTTP {0}, ready={1}" -f $readSmoke.AutoConnectHttp, $checks.DeveloperAutoConnect)
Write-Host ("Auth/company context: HTTP {0}, ready={1}" -f $readSmoke.AuthMeHttp, $checks.CompanyContext)
Write-Host ("WorkOrder list read: HTTP {0}, ready={1}" -f $readSmoke.WorkOrderListHttp, $checks.WorkOrderList)
Write-Host ("WorkOrder read target: HTTP {0}, source={1}, ready={2}" -f $readSmoke.OwnerFixtureDetailHttp, $readSmoke.OwnerFixtureSource, $checks.OwnerFixtureDetail)
Write-Host ("WAFL-owned port 3000 clear: {0}; verified unrelated listeners={1}; unverified={2}; forbidden tunnel clear: {3}" -f $checks.Port3000Clear, $port3000Policy.VerifiedUnrelatedCount, $port3000Policy.UnverifiedCount, ($checks.CloudflaredClear -and $checks.FunnelClear))
Write-Host ("Cloudflared provenance: clear={0}; WAFL-owned={1}; forbidden={2}; approved public viewer={3}; verified unrelated={4}; unverified={5}" -f $cloudflaredPolicy.Ready, $cloudflaredPolicy.WaflOwnedCount, $cloudflaredPolicy.ForbiddenCount, $cloudflaredPolicy.ApprovedPublicViewerCount, $cloudflaredPolicy.VerifiedUnrelatedCount, $cloudflaredPolicy.UnverifiedCount)
Write-Host ("Runtime canonical READY: {0}" -f $canonicalReady)
if (-not $canonicalReady) { exit 1 }
