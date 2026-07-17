import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const stopScript = fs.readFileSync("tools/dev/stop-wafl-external-qa.ps1", "utf8");

assert.match(stopScript, /\$state \| Add-Member -NotePropertyName "stoppedProcessIds" -NotePropertyValue @\(\$stopped\) -Force/);
assert.match(stopScript, /\$state \| Add-Member -NotePropertyName "stopSkipped" -NotePropertyValue @\(\$skipped\) -Force/);
assert.doesNotMatch(stopScript, /\$state\.(?:stoppedProcessIds|stopSkipped)\s*=/);

assert.match(stopScript, /foreach \(\$record in @\(\$state\.processes\)/);
assert.match(stopScript, /\$marker\.ownerMarker -eq \$state\.ownerMarker/);
assert.match(stopScript, /Get-CimInstance Win32_Process -Filter/);
assert.match(stopScript, /\$cimProcess\.ExecutablePath/);
assert.match(stopScript, /executable-path-unavailable/);
assert.match(stopScript, /Stop-Process -Id \$record\.pid/);
assert.doesNotMatch(stopScript, /Stop-Process\s+-(?:Name|ProcessName)|taskkill|killall/);
assert.doesNotMatch(stopScript, /\b6284\b/);

const regression = String.raw`
$ErrorActionPreference = 'Stop'
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
'STOP_STATE_REGRESSION_PASS'
`;

const result = execFileSync("powershell.exe", ["-NoProfile", "-Command", regression], { encoding: "utf8" });
assert.match(result, /STOP_STATE_REGRESSION_PASS/);

console.log("WAFL external QA stop-state contract: PASS");
