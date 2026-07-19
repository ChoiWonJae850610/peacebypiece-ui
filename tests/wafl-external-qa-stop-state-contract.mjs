import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const stopScript = fs.readFileSync("tools/dev/stop-wafl-external-qa.ps1", "utf8");
const commonScript = fs.readFileSync("tools/dev/wafl-external-qa-common.ps1", "utf8");

assert.match(stopScript, /\$state \| Add-Member -NotePropertyName "stoppedProcessIds" -NotePropertyValue @\(\$stopped\) -Force/);
assert.match(stopScript, /\$state \| Add-Member -NotePropertyName "stopSkipped" -NotePropertyValue @\(\$skipped\) -Force/);
assert.doesNotMatch(stopScript, /\$state\.(?:stoppedProcessIds|stopSkipped)\s*=/);

assert.match(stopScript, /foreach \(\$record in @\(\$state\.processes\)/);
assert.match(stopScript, /if \(-not \$process\) \{ \$alreadyStopped\.Add\("\$\(\$record\.role\):already-stopped"\); continue \}/);
assert.match(stopScript, /Get-WaflQaRunnerProcessDisposition/);
assert.match(stopScript, /pid-reused-runner-already-stopped/);
assert.match(stopScript, /\$state \| Add-Member -NotePropertyName "protectedPidReuses"/);
assert.match(stopScript, /\$state\.status = if \(\$skipped\.Count -eq 0\) \{ "stopped" \}/);
assert.match(commonScript, /\[string\]\$Marker\.ownerMarker -eq \[string\]\$State\.ownerMarker/);
assert.match(stopScript, /Get-CimInstance Win32_Process -Filter/);
assert.match(stopScript, /if \(-not \$cimProcess\)[\s\S]*Get-WmiObject -Class Win32_Process -Filter/);
assert.equal((stopScript.match(/Get-WmiObject -Class Win32_Process -Filter/g) ?? []).length, 1);
assert.match(`${stopScript}\n${commonScript}`, /\$cimProcess\.ExecutablePath/);
assert.match(commonScript, /executable-path-unavailable/);
assert.match(stopScript, /Test-WaflQaStopProcessOwnership/);
assert.match(stopScript, /Test-WaflQaAlternativeServeProcessMetadata/);
assert.match(stopScript, /exact-metadata-fallback-unavailable/);
assert.match(stopScript, /exact-process-exit-unconfirmed/);
assert.match(stopScript, /Get-WaflQaFunnelSemanticState/);
assert.match(commonScript, /serve-bounded-fallback/);
assert.match(commonScript, /serve-command-line-mismatch/);
assert.match(commonScript, /start-time-mismatch/);
assert.match(commonScript, /AllowFunnelTrueCount/);
assert.match(stopScript, /Stop-Process -Id \$record\.pid/);
assert.doesNotMatch(stopScript, /Stop-Process\s+-(?:Name|ProcessName)|taskkill|killall/);
assert.doesNotMatch(stopScript, /tailscale\s+(?:serve|funnel)\s+reset|tailscale\s+down/i);
assert.doesNotMatch(stopScript, /\b6284\b/);

const regression = String.raw`
$ErrorActionPreference = 'Stop'
. (Join-Path (Get-Location) 'tools\dev\wafl-external-qa-common.ps1')
$stopped = [System.Collections.Generic.List[int]]::new()
$stopped.Add(12332)
$skipped = [System.Collections.Generic.List[string]]::new()
$skipped.Add('expo:not-running')

$newState = [pscustomobject]@{ status = 'running' }
$newState | Add-Member -NotePropertyName 'stoppedProcessIds' -NotePropertyValue @($stopped) -Force
$newState | Add-Member -NotePropertyName 'stopSkipped' -NotePropertyValue @($skipped) -Force
if ($newState.stoppedProcessIds.Count -ne 1 -or $newState.stoppedProcessIds[0] -ne 12332) { throw 'new-state-stopped-failed' }
if ($newState.stopSkipped.Count -ne 1 -or $newState.stopSkipped[0] -ne 'expo:not-running') { throw 'new-state-skipped-failed' }

$existingState = [pscustomobject]@{ stoppedProcessIds = @(1); stopSkipped = @('old') }
$existingState | Add-Member -NotePropertyName 'stoppedProcessIds' -NotePropertyValue @($stopped) -Force
$existingState | Add-Member -NotePropertyName 'stopSkipped' -NotePropertyValue @($skipped) -Force
if ($existingState.stoppedProcessIds.Count -ne 1 -or $existingState.stoppedProcessIds[0] -ne 12332) { throw 'force-stopped-failed' }
if ($existingState.stopSkipped.Count -ne 1 -or $existingState.stopSkipped[0] -ne 'expo:not-running') { throw 'force-skipped-failed' }

$started = [DateTime]::Parse('2026-07-19T00:00:00Z')
$state = [pscustomobject]@{ ownerMarker = 'run-1'; mobileTransport = 'DeveloperAutoConnect'; nextPort = 3100 }
$record = [pscustomobject]@{ role = 'tailscale-serve'; pid = 29116; startedAtUtc = '2026-07-19T00:00:00Z'; executablePath = 'C:\Program Files\Tailscale\tailscale.exe' }
$marker = [pscustomobject]@{ ownerMarker = 'run-1'; role = 'tailscale-serve'; pid = 29116; startedAtUtc = '2026-07-19T00:00:00Z' }
$process = [pscustomobject]@{ Id = 29116; StartTime = $started }
$candidateDisposition = Get-WaflQaRunnerProcessDisposition -State $state -Record $record -Marker $marker -Process $process
if ($candidateDisposition.Outcome -ne 'ownership-candidate' -or -not $candidateDisposition.Terminate) { throw 'matching-disposition-failed' }
$reusedProcess = [pscustomobject]@{ Id = 29116; StartTime = $started.AddMinutes(10); ProcessName = 'node'; Path = 'C:\Program Files\Tailscale\tailscale.exe' }
$reusedDisposition = Get-WaflQaRunnerProcessDisposition -State $state -Record $record -Marker $marker -Process $reusedProcess
if ($reusedDisposition.Outcome -ne 'pid-reused-runner-already-stopped' -or $reusedDisposition.Terminate) { throw 'pid-reuse-disposition-failed' }
$sameNameReusedProcess = [pscustomobject]@{ Id = 29116; StartTime = $started.AddMinutes(10); ProcessName = 'expo' }
if ((Get-WaflQaRunnerProcessDisposition -State $state -Record $record -Marker $marker -Process $sameNameReusedProcess).Terminate) { throw 'same-name-pid-reuse-termination-allowed' }
$missingStartMarker = [pscustomobject]@{ ownerMarker = 'run-1'; role = 'tailscale-serve'; pid = 29116; startedAtUtc = '' }
if ((Get-WaflQaRunnerProcessDisposition -State $state -Record $record -Marker $missingStartMarker -Process $process).Outcome -ne 'ownership-failure') { throw 'missing-marker-time-treated-as-reuse' }
$wrongOwnerMarker = [pscustomobject]@{ ownerMarker = 'other-run'; role = 'tailscale-serve'; pid = 29116; startedAtUtc = '2026-07-19T00:00:00Z' }
if ((Get-WaflQaRunnerProcessDisposition -State $state -Record $record -Marker $wrongOwnerMarker -Process $reusedProcess).Outcome -ne 'ownership-failure') { throw 'wrong-owner-treated-as-reuse' }
$strictCim = [pscustomobject]@{ ProcessId = 29116; ExecutablePath = 'C:\Program Files\Tailscale\tailscale.exe'; CommandLine = $null }
$strict = Test-WaflQaStopProcessOwnership -State $state -Record $record -Marker $marker -Process $process -CimProcess $strictCim
if (-not $strict.Owned -or $strict.UsedFallback) { throw 'strict-path-failed' }

$fallbackCim = [pscustomobject]@{ ProcessId = 29116; ExecutablePath = $null; CommandLine = '"C:\Program Files\Tailscale\tailscale.exe" serve --https=443 http://127.0.0.1:3100' }
$fallback = Test-WaflQaStopProcessOwnership -State $state -Record $record -Marker $marker -Process $process -CimProcess $fallbackCim -ServeFallbackConfigSafe $true
if (-not $fallback.Owned -or -not $fallback.UsedFallback) { throw 'bounded-fallback-failed' }

$lateProcess = [pscustomobject]@{ StartTime = $started.AddSeconds(5) }
if ((Test-WaflQaStopProcessOwnership -State $state -Record $record -Marker $marker -Process $lateProcess -CimProcess $fallbackCim -ServeFallbackConfigSafe $true).Owned) { throw 'start-time-mismatch-allowed' }
$wrongCommand = [pscustomobject]@{ ProcessId = 29116; ExecutablePath = $null; CommandLine = '"C:\Program Files\Tailscale\tailscale.exe" status' }
if ((Test-WaflQaStopProcessOwnership -State $state -Record $record -Marker $marker -Process $process -CimProcess $wrongCommand -ServeFallbackConfigSafe $true).Owned) { throw 'command-mismatch-allowed' }
$wrongMarker = [pscustomobject]@{ ownerMarker = 'other-run'; role = 'tailscale-serve'; pid = 29116; startedAtUtc = '2026-07-19T00:00:00Z' }
if ((Test-WaflQaStopProcessOwnership -State $state -Record $record -Marker $wrongMarker -Process $process -CimProcess $fallbackCim -ServeFallbackConfigSafe $true).Owned) { throw 'unrelated-marker-allowed' }

$alternative = [pscustomobject]@{
    ProcessId = 29116
    CreationDate = $started
    ExecutablePath = 'C:\Program Files\Tailscale\tailscale.exe'
    CommandLine = '"C:\Program Files\Tailscale\tailscale.exe" serve --https=443 http://127.0.0.1:3100'
}
$alternativeOwned = Test-WaflQaAlternativeServeProcessMetadata -State $state -Record $record -Marker $marker -Process $process -Metadata $alternative -ServeFallbackConfigSafe $true
if (-not $alternativeOwned.Owned -or -not $alternativeOwned.UsedFallback) { throw 'alternative-metadata-rejected' }

$missingCreation = [pscustomobject]@{ ProcessId = 29116; CreationDate = $null; ExecutablePath = $alternative.ExecutablePath; CommandLine = $alternative.CommandLine }
if ((Test-WaflQaAlternativeServeProcessMetadata -State $state -Record $record -Marker $marker -Process $process -Metadata $missingCreation -ServeFallbackConfigSafe $true).Owned) { throw 'missing-creation-allowed' }
$wrongCreation = [pscustomobject]@{ ProcessId = 29116; CreationDate = $started.AddSeconds(1); ExecutablePath = $alternative.ExecutablePath; CommandLine = $alternative.CommandLine }
if ((Test-WaflQaAlternativeServeProcessMetadata -State $state -Record $record -Marker $marker -Process $process -Metadata $wrongCreation -ServeFallbackConfigSafe $true).Owned) { throw 'wrong-creation-allowed' }
$wrongPath = [pscustomobject]@{ ProcessId = 29116; CreationDate = $started; ExecutablePath = 'C:\Other\tailscale.exe'; CommandLine = $alternative.CommandLine }
if ((Test-WaflQaAlternativeServeProcessMetadata -State $state -Record $record -Marker $marker -Process $process -Metadata $wrongPath -ServeFallbackConfigSafe $true).Owned) { throw 'wrong-path-allowed' }
$wrongAlternativeCommand = [pscustomobject]@{ ProcessId = 29116; CreationDate = $started; ExecutablePath = $alternative.ExecutablePath; CommandLine = '"C:\Program Files\Tailscale\tailscale.exe" status' }
if ((Test-WaflQaAlternativeServeProcessMetadata -State $state -Record $record -Marker $marker -Process $process -Metadata $wrongAlternativeCommand -ServeFallbackConfigSafe $true).Owned) { throw 'wrong-alternative-command-allowed' }
$wrongBackend = [pscustomobject]@{ ProcessId = 29116; CreationDate = $started; ExecutablePath = $alternative.ExecutablePath; CommandLine = '"C:\Program Files\Tailscale\tailscale.exe" serve --https=443 http://127.0.0.1:3101' }
if ((Test-WaflQaAlternativeServeProcessMetadata -State $state -Record $record -Marker $marker -Process $process -Metadata $wrongBackend -ServeFallbackConfigSafe $true).Owned) { throw 'wrong-backend-allowed' }
$wrongPid = [pscustomobject]@{ ProcessId = 29117; CreationDate = $started; ExecutablePath = $alternative.ExecutablePath; CommandLine = $alternative.CommandLine }
if ((Test-WaflQaAlternativeServeProcessMetadata -State $state -Record $record -Marker $marker -Process $process -Metadata $wrongPid -ServeFallbackConfigSafe $true).Owned) { throw 'wrong-pid-allowed' }
if ((Test-WaflQaAlternativeServeProcessMetadata -State $state -Record $record -Marker $wrongMarker -Process $process -Metadata $alternative -ServeFallbackConfigSafe $true).Owned) { throw 'markerless-alternative-allowed' }
if ((Test-WaflQaAlternativeServeProcessMetadata -State $state -Record $record -Marker $marker -Process $process -Metadata $alternative -ServeFallbackConfigSafe $false).Owned) { throw 'unsafe-config-alternative-allowed' }

foreach ($disabledJson in @('{}', '{"Foreground":{"x":{"AllowFunnel":false}}}', '{"Foreground":{"x":{"Web":{}}}}')) {
    $semantic = Get-WaflQaFunnelSemanticState -JsonText $disabledJson
    if (-not $semantic.Parsed -or -not $semantic.SchemaValid -or $semantic.Enabled) { throw 'disabled-funnel-rejected' }
}
$enabledSemantic = Get-WaflQaFunnelSemanticState -JsonText '{"Foreground":{"x":{"AllowFunnel":true}}}'
if (-not $enabledSemantic.Enabled -or $enabledSemantic.AllowFunnelTrueCount -ne 1) { throw 'enabled-funnel-missed' }
$malformedSemantic = Get-WaflQaFunnelSemanticState -JsonText '{broken'
if ($malformedSemantic.Parsed -or $malformedSemantic.SchemaValid -or $null -ne $malformedSemantic.Enabled) { throw 'malformed-funnel-accepted' }
'STOP_STATE_REGRESSION_PASS'
`;

const result = execFileSync("powershell.exe", ["-NoProfile", "-Command", regression], { encoding: "utf8" });
assert.match(result, /STOP_STATE_REGRESSION_PASS/);

console.log("WAFL external QA stop-state contract: PASS");
