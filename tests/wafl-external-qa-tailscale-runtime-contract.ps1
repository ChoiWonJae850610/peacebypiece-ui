$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "..\tools\dev\wafl-external-qa-common.ps1")

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

Write-Host "WAFL external QA Tailscale disconnected / IPv4 parsing contract: PASS"
