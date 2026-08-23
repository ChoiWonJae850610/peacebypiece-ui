$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "..\tools\dev\wafl-external-qa-common.ps1")

$nodeToolchain = Resolve-WaflQaCanonicalNodeToolchain
if ($nodeToolchain.Version -ne "v24.14.0") { throw "CANONICAL_NODE_VERSION_CONTRACT_FAILED" }
if (-not (Test-Path -LiteralPath $nodeToolchain.Node -PathType Leaf)) { throw "CANONICAL_NODE_TOOLCHAIN_INCOMPLETE" }
$commonSource = Get-Content -LiteralPath (Join-Path $PSScriptRoot "..\tools\dev\wafl-external-qa-common.ps1") -Raw
foreach ($requiredFirewallContract in @(
    'function Test-WaflQaMetroFirewallRule',
    'WAFL-Metro-8081-Tailscale-Node24',
    'Profile -match "Private"',
    "RemoteAddress -join",
    '100\.64\.0\.0',
    'ProgramMatches'
)) {
    if (-not $commonSource.Contains($requiredFirewallContract)) {
        throw "CANONICAL_METRO_FIREWALL_STATIC_CONTRACT_FAILED"
    }
}

$values = @("100.64.0.1", "100.127.255.254", "100.128.0.1", "127.0.0.1", "192.168.1.5", "not-an-ip")
$expected = @($true, $true, $false, $false, $false, $false)
$actual = @($values | ForEach-Object { Test-WaflQaTailscaleIpv4 -Value $_ })
if (($actual | ConvertTo-Json -Compress) -ne ($expected | ConvertTo-Json -Compress)) {
    throw "TAILSCALE_IPV4_CONTRACT_FAILED"
}

$online = '{"BackendState":"Running","Self":{"Online":true}}' | ConvertFrom-Json
$runtime = Resolve-WaflQaTailscaleRuntime -Status $online -Ipv4Candidates @("100.70.80.90")
if ($runtime.Ipv4 -ne "100.70.80.90") { throw "TAILSCALE_IPV4_RESOLUTION_FAILED" }

$stringContent = "packager-status:running`r`n"
if (-not (Test-WaflQaPackagerStatusRunning -Content $stringContent)) {
    throw "EXPO_READINESS_STRING_CONTENT_FAILED"
}
$byteContent = [System.Text.Encoding]::UTF8.GetBytes("packager-status:running`n")
if (-not (Test-WaflQaPackagerStatusRunning -Content $byteContent)) {
    throw "EXPO_READINESS_BYTE_CONTENT_FAILED"
}

$offline = '{"BackendState":"Stopped","Self":{"Online":false}}' | ConvertFrom-Json
try {
    Resolve-WaflQaTailscaleRuntime -Status $offline -Ipv4Candidates @("100.70.80.90") | Out-Null
    throw "TAILSCALE_DISCONNECTED_NOT_REJECTED"
} catch {
    if ($_.Exception.Message -ne "TAILSCALE_DISCONNECTED") { throw }
}

$portState = [pscustomobject]@{
    repositoryRoot = 'C:\CWJ_Project\peacebypiece-2.0'
    processes = @([pscustomobject]@{ role = 'next'; pid = 3100 })
}
$noListeners = Get-WaflQaPort3000ListenerPolicy -State $portState -Listeners @() -ProcessMetadata @()
if (-not $noListeners.Ready -or $noListeners.WaflOwnedCount -ne 0 -or $noListeners.UnverifiedCount -ne 0) {
    throw 'WAFL_PORT3000_EMPTY_POLICY_FAILED'
}
$runnerListener = Get-WaflQaPort3000ListenerPolicy -State $portState `
    -Listeners @([pscustomobject]@{ OwningProcess = 3100 }) `
    -ProcessMetadata @([pscustomobject]@{ ProcessId = 3100; ParentProcessId = 1; ExecutablePath = 'C:\tools\node.exe'; CommandLine = 'node next start --port 3000' })
if ($runnerListener.Ready -or $runnerListener.WaflOwnedCount -ne 1) { throw 'WAFL_PORT3000_RUNNER_PID_NOT_BLOCKED' }
$repositoryListener = Get-WaflQaPort3000ListenerPolicy -State $portState `
    -Listeners @([pscustomobject]@{ OwningProcess = 4000 }) `
    -ProcessMetadata @([pscustomobject]@{ ProcessId = 4000; ParentProcessId = 1; ExecutablePath = 'C:\tools\node.exe'; CommandLine = 'node C:\CWJ_Project\peacebypiece-2.0\node_modules\next\dist\bin\next start --port 3000' })
if ($repositoryListener.Ready -or $repositoryListener.WaflOwnedCount -ne 1) { throw 'WAFL_PORT3000_REPOSITORY_COMMAND_NOT_BLOCKED' }
$foreignListener = Get-WaflQaPort3000ListenerPolicy -State $portState `
    -Listeners @([pscustomobject]@{ OwningProcess = 4032 }) `
    -ProcessMetadata @([pscustomobject]@{ ProcessId = 4032; ParentProcessId = 21948; ExecutablePath = 'C:\CWJ_Project\KDN_Opportunity_Monitor\.tools\node\node.exe'; CommandLine = 'node C:\CWJ_Project\KDN_Opportunity_Monitor\node_modules\next\dist\bin\next start --hostname 127.0.0.1 --port 3000' })
if (-not $foreignListener.Ready -or $foreignListener.VerifiedUnrelatedCount -ne 1 -or $foreignListener.WaflOwnedCount -ne 0) {
    throw 'VERIFIED_UNRELATED_PORT3000_NOT_ALLOWED'
}
$unknownListener = Get-WaflQaPort3000ListenerPolicy -State $portState `
    -Listeners @([pscustomobject]@{ OwningProcess = 5000 }) `
    -ProcessMetadata @()
if ($unknownListener.Ready -or $unknownListener.UnverifiedCount -ne 1) { throw 'UNKNOWN_PORT3000_PROVENANCE_NOT_BLOCKED' }

$cloudState = [pscustomobject]@{
    repositoryRoot = 'C:\CWJ_Project\peacebypiece-2.0'
    ownerMarker = 'wafl-owner-marker'
    tailscaleIpv4 = '100.70.80.90'
    tailscaleServeHostname = 'wafl-device.example.ts.net'
    publicOrigin = 'https://wafl-device.example.ts.net'
    publicDocumentViewerOrigin = 'https://share.wafl.co.kr'
    expoUrl = 'http://100.70.80.90:8081'
    metroAdvertisedHost = '100.70.80.90'
    iosManifestLaunchHost = '100.70.80.90'
    developerClientLaunchHost = '100.70.80.90'
    nextPort = 3100
    expoPort = 8081
    processes = @([pscustomobject]@{ role = 'next'; pid = 3100 })
}
$cloudProcess = [pscustomobject]@{ Id = 26756 }
$cloudMetadata = [pscustomobject]@{
    ProcessId = 26756
    ParentProcessId = 1172
    ExecutablePath = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
    CommandLine = 'cloudflared.exe tunnel run --token-file C:\ProgramData\cloudflared\token'
    IsWindowsService = $true
    SignatureStatus = 'Valid'
    CloudflareSigner = $true
}
$unrelatedConfig = [pscustomobject]@{
    ProcessId = 26756
    Available = $true
    JsonText = '{"config":{"ingress":[{"hostname":"other.example.com","service":"http://127.0.0.1:3217"},{"hostname":"","service":"http_status:404"}]}}'
}
$unrelatedCloudflared = Get-WaflQaCloudflaredProcessPolicy -State $cloudState -Processes @($cloudProcess) -ProcessMetadata @($cloudMetadata) -DiagnosticConfigs @($unrelatedConfig)
if (-not $unrelatedCloudflared.Ready -or $unrelatedCloudflared.VerifiedUnrelatedCount -ne 1 -or $unrelatedCloudflared.UnverifiedCount -ne 0) {
    throw 'VERIFIED_UNRELATED_CLOUDFLARED_NOT_ALLOWED'
}
$waflRouteConfig = [pscustomobject]@{
    ProcessId = 26756
    Available = $true
    JsonText = '{"config":{"ingress":[{"hostname":"other.example.com","service":"http://127.0.0.1:3100"},{"hostname":"","service":"http_status:404"}]}}'
}
$waflRouteCloudflared = Get-WaflQaCloudflaredProcessPolicy -State $cloudState -Processes @($cloudProcess) -ProcessMetadata @($cloudMetadata) -DiagnosticConfigs @($waflRouteConfig)
if ($waflRouteCloudflared.Ready -or $waflRouteCloudflared.ForbiddenCount -ne 1) { throw 'WAFL_ROUTE_CLOUDFLARED_NOT_BLOCKED' }
$approvedViewerConfig = [pscustomobject]@{
    ProcessId = 26756
    Available = $true
    JsonText = '{"config":{"ingress":[{"hostname":"share.wafl.co.kr","service":"http://127.0.0.1:3100"},{"hostname":"","service":"http_status:404"}]}}'
}
$approvedViewerCloudflared = Get-WaflQaCloudflaredProcessPolicy -State $cloudState -Processes @($cloudProcess) -ProcessMetadata @($cloudMetadata) -DiagnosticConfigs @($approvedViewerConfig)
if (-not $approvedViewerCloudflared.Ready -or $approvedViewerCloudflared.ApprovedPublicViewerCount -ne 1 -or $approvedViewerCloudflared.ForbiddenCount -ne 0) {
    throw 'EXACT_BRANDED_PUBLIC_VIEWER_ROUTE_NOT_ALLOWED'
}
$wrongViewerHostConfig = [pscustomobject]@{
    ProcessId = 26756
    Available = $true
    JsonText = '{"config":{"ingress":[{"hostname":"other.example.com","service":"http://127.0.0.1:3100"},{"hostname":"","service":"http_status:404"}]}}'
}
$wrongViewerHostCloudflared = Get-WaflQaCloudflaredProcessPolicy -State $cloudState -Processes @($cloudProcess) -ProcessMetadata @($cloudMetadata) -DiagnosticConfigs @($wrongViewerHostConfig)
if ($wrongViewerHostCloudflared.Ready -or $wrongViewerHostCloudflared.ForbiddenCount -ne 1) { throw 'NON_VIEWER_NEXT_ROUTE_NOT_BLOCKED' }
$unknownCloudflared = Get-WaflQaCloudflaredProcessPolicy -State $cloudState -Processes @($cloudProcess) -ProcessMetadata @($cloudMetadata) -DiagnosticConfigs @()
if ($unknownCloudflared.Ready -or $unknownCloudflared.UnverifiedCount -ne 1) { throw 'UNKNOWN_CLOUDFLARED_PROVENANCE_NOT_BLOCKED' }
$quickMetadata = $cloudMetadata.PSObject.Copy()
$quickMetadata.IsWindowsService = $false
$quickMetadata.CommandLine = 'cloudflared.exe tunnel --url http://127.0.0.1:3217'
$quickCloudflared = Get-WaflQaCloudflaredProcessPolicy -State $cloudState -Processes @($cloudProcess) -ProcessMetadata @($quickMetadata) -DiagnosticConfigs @()
if ($quickCloudflared.Ready -or $quickCloudflared.ForbiddenCount -ne 1) { throw 'QUICK_TUNNEL_CLOUDFLARED_NOT_BLOCKED' }

Write-Host "WAFL external QA Tailscale disconnected / IPv4 parsing contract: PASS"
