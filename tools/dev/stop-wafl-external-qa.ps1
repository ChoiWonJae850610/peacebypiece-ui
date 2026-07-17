$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "wafl-external-qa-common.ps1")

$state = Read-WaflQaState
$root = Get-WaflQaRepositoryRoot
if ([System.IO.Path]::GetFullPath([string]$state.repositoryRoot) -ne $root) { throw "State repository ownership mismatch." }

$stopped = New-Object System.Collections.Generic.List[int]
$skipped = New-Object System.Collections.Generic.List[string]
foreach ($record in @($state.processes) | Sort-Object { switch ($_.role) { "expo" { 1 } "next" { 2 } "cloudflared" { 3 } default { 4 } } }) {
    $process = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
    if (-not $process) { continue }
    if (-not (Test-Path -LiteralPath $record.markerPath -PathType Leaf)) { $skipped.Add("$($record.role):marker-missing"); continue }
    $marker = Get-Content -LiteralPath $record.markerPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $cimProcess = Get-CimInstance Win32_Process -Filter ("ProcessId = {0}" -f [int]$record.pid) -ErrorAction SilentlyContinue
    if (-not $cimProcess -or [string]::IsNullOrWhiteSpace([string]$cimProcess.ExecutablePath)) {
        $skipped.Add("$($record.role):executable-path-unavailable")
        continue
    }
    $actualPath = [System.IO.Path]::GetFullPath([string]$cimProcess.ExecutablePath)
    $expectedStart = [DateTime]::Parse([string]$record.startedAtUtc).ToUniversalTime()
    $actualStart = $process.StartTime.ToUniversalTime()
    $owned = $marker.ownerMarker -eq $state.ownerMarker `
        -and [int]$marker.pid -eq [int]$record.pid `
        -and [string]$marker.role -eq [string]$record.role `
        -and $actualPath -eq [System.IO.Path]::GetFullPath([string]$record.executablePath) `
        -and [Math]::Abs(($actualStart - $expectedStart).TotalSeconds) -lt 2
    if (-not $owned) { $skipped.Add("$($record.role):ownership-mismatch"); continue }
    Stop-Process -Id $record.pid -ErrorAction Stop
    $stopped.Add([int]$record.pid)
}

$state.status = if ($skipped.Count -eq 0) { "stopped" } else { "stop-partial" }
$state.updatedAtUtc = [DateTime]::UtcNow.ToString("o")
$state | Add-Member -NotePropertyName "stoppedProcessIds" -NotePropertyValue @($stopped) -Force
$state | Add-Member -NotePropertyName "stopSkipped" -NotePropertyValue @($skipped) -Force
Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $state
Write-Host ("Stopped owned process IDs: {0}" -f (($stopped | ForEach-Object { $_ }) -join ", "))
if ($skipped.Count -gt 0) { Write-Warning ("Skipped without termination: {0}" -f ($skipped -join ", ")) }
