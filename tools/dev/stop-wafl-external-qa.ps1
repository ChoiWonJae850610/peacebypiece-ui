$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "wafl-external-qa-common.ps1")

$state = Read-WaflQaState
$root = Get-WaflQaRepositoryRoot
if ([System.IO.Path]::GetFullPath([string]$state.repositoryRoot) -ne $root) { throw "State repository ownership mismatch." }

$stopped = New-Object System.Collections.Generic.List[int]
$skipped = New-Object System.Collections.Generic.List[string]
$alreadyStopped = New-Object System.Collections.Generic.List[string]
$protectedPidReuses = New-Object System.Collections.Generic.List[string]
foreach ($record in @($state.processes) | Sort-Object { switch ($_.role) { "tailscale-serve" { 1 } "expo" { 2 } "next" { 3 } "cloudflared" { 4 } default { 5 } } }) {
    $process = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
    if (-not $process) { $alreadyStopped.Add("$($record.role):already-stopped"); continue }
    if (-not (Test-Path -LiteralPath $record.markerPath -PathType Leaf)) { $skipped.Add("$($record.role):marker-missing"); continue }
    $marker = Get-Content -LiteralPath $record.markerPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $disposition = Get-WaflQaRunnerProcessDisposition -State $state -Record $record -Marker $marker -Process $process
    if ($disposition.Outcome -eq 'pid-reused-runner-already-stopped') {
        $protectedPidReuses.Add("$($record.role):pid-reused-runner-already-stopped")
        $alreadyStopped.Add("$($record.role):already-stopped")
        continue
    }
    if (-not $disposition.Terminate) {
        $skipped.Add("$($record.role):$($disposition.Reason)")
        continue
    }
    $cimProcess = Get-CimInstance Win32_Process -Filter ("ProcessId = {0}" -f [int]$record.pid) -ErrorAction SilentlyContinue
    $alternativeMetadata = $null
    if (-not $cimProcess) {
        $eligibility = Test-WaflQaServeMetadataFallbackEligibility -State $state -Record $record -Marker $marker -Process $process
        if (-not $eligibility.Eligible) {
            $skipped.Add("$($record.role):$($eligibility.Reason)")
            continue
        }
        $alternativeMetadata = Get-WmiObject -Class Win32_Process -Filter ("ProcessId = {0}" -f [int]$record.pid) -ErrorAction SilentlyContinue
        if (-not $alternativeMetadata) {
            $skipped.Add("$($record.role):exact-metadata-fallback-unavailable")
            continue
        }
    }
    $serveFallbackConfigSafe = $false
    if ((-not $cimProcess -or [string]::IsNullOrWhiteSpace([string]$cimProcess.ExecutablePath)) -and [string]$record.role -eq 'tailscale-serve') {
        $tailscalePath = Get-WaflQaTailscalePath
        if ($tailscalePath) {
            $expectedBackend = "http://127.0.0.1:$([int]$state.nextPort)"
            $serveStatusText = (@(& $tailscalePath serve status --json 2>$null) -join "`n")
            $serveExit = $LASTEXITCODE
            $funnelStatusText = (@(& $tailscalePath funnel status --json 2>$null) -join "`n")
            $funnelExit = $LASTEXITCODE
            $serveSemantic = Get-WaflQaServeProxySemanticState -JsonText $serveStatusText -ExpectedBackend $expectedBackend
            $funnelSemantic = Get-WaflQaFunnelSemanticState -JsonText $funnelStatusText
            $serveFallbackConfigSafe = $serveExit -eq 0 `
                -and $funnelExit -eq 0 `
                -and $serveSemantic.Parsed `
                -and $serveSemantic.SchemaValid `
                -and $serveSemantic.ExactExpectedOnly `
                -and $funnelSemantic.Parsed `
                -and $funnelSemantic.SchemaValid `
                -and -not $funnelSemantic.Enabled
        }
    }
    $ownership = if ($alternativeMetadata) {
        Test-WaflQaAlternativeServeProcessMetadata -State $state -Record $record -Marker $marker -Process $process -Metadata $alternativeMetadata -ServeFallbackConfigSafe $serveFallbackConfigSafe
    }
    else {
        Test-WaflQaStopProcessOwnership -State $state -Record $record -Marker $marker -Process $process -CimProcess $cimProcess -ServeFallbackConfigSafe $serveFallbackConfigSafe
    }
    if (-not $ownership.Owned) { $skipped.Add("$($record.role):$($ownership.Reason)"); continue }
    Stop-Process -Id $record.pid -ErrorAction Stop
    if ([string]$record.role -eq 'tailscale-serve') {
        $process.WaitForExit(5000)
        if (Get-Process -Id $record.pid -ErrorAction SilentlyContinue) {
            $skipped.Add("$($record.role):exact-process-exit-unconfirmed")
            continue
        }
    }
    $stopped.Add([int]$record.pid)
}

if ($state.PSObject.Properties.Name -contains "serveConfigOwnership" -and $state.serveConfigOwnership -eq "foreground-process") {
    $tailscalePath = Get-WaflQaTailscalePath
    if (-not $tailscalePath) {
        $skipped.Add("tailscale-serve:cli-missing-after-stop")
    }
    else {
        $serveCleared = $false
        $deadline = [DateTime]::UtcNow.AddSeconds(8)
        while ([DateTime]::UtcNow -lt $deadline -and -not $serveCleared) {
            $serveStatus = @(& $tailscalePath serve status --json 2>$null)
            $serveCleared = $LASTEXITCODE -eq 0 -and (Test-WaflQaEmptyJsonObject -Value $serveStatus)
            if (-not $serveCleared) { Start-Sleep -Milliseconds 200 }
        }
        if (-not $serveCleared) { $skipped.Add("tailscale-serve:foreground-config-not-cleared") }
        else {
            $state.tailscaleServeReady = $false
            $state.developerAutoConnectReady = $false
            $state.serveConfigOwnership = "released"
        }
        $funnelStatusText = (@(& $tailscalePath funnel status --json 2>$null) -join "`n")
        $funnelExit = $LASTEXITCODE
        $funnelSemantic = Get-WaflQaFunnelSemanticState -JsonText $funnelStatusText
        if ($funnelExit -ne 0 -or -not $funnelSemantic.Parsed -or -not $funnelSemantic.SchemaValid -or $funnelSemantic.Enabled) {
            $skipped.Add("tailscale-funnel:unexpected-config")
            $state.funnelUnchanged = $false
        }
        else { $state.funnelUnchanged = $true }
    }
}

$state.status = if ($skipped.Count -eq 0) { "stopped" } else { "stop-partial" }
$state.updatedAtUtc = [DateTime]::UtcNow.ToString("o")
$state | Add-Member -NotePropertyName "stoppedProcessIds" -NotePropertyValue @($stopped) -Force
$state | Add-Member -NotePropertyName "stopSkipped" -NotePropertyValue @($skipped) -Force
$state | Add-Member -NotePropertyName "alreadyStopped" -NotePropertyValue @($alreadyStopped) -Force
$state | Add-Member -NotePropertyName "protectedPidReuses" -NotePropertyValue @($protectedPidReuses) -Force
Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $state
Write-Host ("Stopped owned process IDs: {0}" -f (($stopped | ForEach-Object { $_ }) -join ", "))
if ($protectedPidReuses.Count -gt 0) { Write-Host ("Preserved reused process IDs without termination: {0}" -f $protectedPidReuses.Count) }
if ($skipped.Count -gt 0) { Write-Warning ("Skipped without termination: {0}" -f ($skipped -join ", ")) }
