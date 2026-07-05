# ==========================================
# PeaceByPiece Dev Server Watcher
# Encoding: UTF-8 with BOM
# npm run dev 백그라운드 실행 및 상태 기록 전용 실행 파일
# ==========================================

param(
    [switch]$Background,
    [switch]$Stop,
    [switch]$Status,
    [switch]$RestartOnExit
)

$ErrorActionPreference = "Stop"

$PipelineCommonPath = Join-Path $PSScriptRoot "pipeline-common.ps1"
if (-not (Test-Path -LiteralPath $PipelineCommonPath)) {
    throw "Pipeline common 스크립트를 찾을 수 없습니다: $PipelineCommonPath"
}

. $PipelineCommonPath

$DevServerRuntimeDir = Split-Path -Parent $DevServerPidFile
$DevServerLogFile = Join-Path $DevServerRuntimeDir "dev-server.log"
$DevServerStateFile = Join-Path $DevServerRuntimeDir "dev-server-state.json"

function EnsureDevServerRuntimeDirectory {
    EnsureDirectory -Path $DevServerRuntimeDir
}

function WriteDevServerLog {
    param([string]$Message)

    EnsureDevServerRuntimeDirectory
    $line = "{0} {1}" -f (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"), $Message
    Add-Content -LiteralPath $DevServerLogFile -Value $line -Encoding UTF8
}

function WriteDevServerState {
    param(
        [int]$ProcessId,
        [string]$StatusValue,
        [string]$StartedAt,
        [string]$LastMessage,
        [int]$ChildProcessId = 0
    )

    EnsureDevServerRuntimeDirectory
    [ordered]@{
        pid = $ProcessId
        childPid = $ChildProcessId
        status = $StatusValue
        startedAt = $StartedAt
        updatedAt = (Get-Date).ToString("o")
        lastMessage = $LastMessage
        projectDir = $ProjectDir
        command = "npm run dev"
    } | ConvertTo-Json | Set-Content -LiteralPath $DevServerStateFile -Encoding UTF8
}

function GetProcessFromPidFile {
    param([string]$PidFile)

    if (-not (Test-Path -LiteralPath $PidFile)) {
        return $null
    }

    try {
        $pidText = (Get-Content -LiteralPath $PidFile -Raw -ErrorAction Stop).Trim()
        if ($pidText -notmatch '^\d+$') {
            Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
            return $null
        }

        $process = Get-Process -Id ([int]$pidText) -ErrorAction SilentlyContinue
        if ($null -eq $process) {
            Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
            return $null
        }

        return $process
    }
    catch {
        Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
        return $null
    }
}

function StopExistingDevServerWatcher {
    $existing = GetProcessFromPidFile -PidFile $DevServerPidFile
    if ($null -eq $existing) {
        Remove-Item -LiteralPath $DevServerPidFile -Force -ErrorAction SilentlyContinue
        WriteDevServerLog "[STOP] no running dev server watcher"
        WriteDevServerState -ProcessId 0 -StatusValue "stopped" -StartedAt "" -LastMessage "no running process"
        return
    }

    $processId = $existing.Id
    WriteDevServerLog "[STOP_REQUEST] pid=$processId"
    taskkill /PID $processId /T /F | Out-Null
    Remove-Item -LiteralPath $DevServerPidFile -Force -ErrorAction SilentlyContinue
    WriteDevServerState -ProcessId $processId -StatusValue "stopped" -StartedAt "" -LastMessage "stopped by dev-server-watcher.ps1 -Stop"
}

function WriteDevServerStatusAndExit {
    $existing = GetProcessFromPidFile -PidFile $DevServerPidFile
    if ($null -eq $existing) {
        Write-Host "npm run dev watcher: OFF"
        if (Test-Path -LiteralPath $DevServerStateFile) {
            Get-Content -LiteralPath $DevServerStateFile -Encoding UTF8
        }
        return
    }

    Write-Host "npm run dev watcher: ON PID=$($existing.Id)"
    if (Test-Path -LiteralPath $DevServerStateFile) {
        Get-Content -LiteralPath $DevServerStateFile -Encoding UTF8
    }
}

function StartNpmDevProcess {
    if (-not (Test-Path -LiteralPath $ProjectDir -PathType Container)) {
        throw "프로젝트 루트 경로를 찾을 수 없습니다: $ProjectDir"
    }

    $command = 'npm run dev'
    $arguments = '/d /s /c "cd /d ""{0}"" && {1} >> ""{2}"" 2>&1"' -f $ProjectDir, $command, $DevServerLogFile

    WriteDevServerLog "[NPM_START] $command projectDir=$ProjectDir"
    return Start-Process -FilePath "cmd.exe" -ArgumentList $arguments -WindowStyle Hidden -PassThru
}

if ($Stop) {
    StopExistingDevServerWatcher
    return
}

if ($Status) {
    WriteDevServerStatusAndExit
    return
}

EnsureDevServerRuntimeDirectory

$existingWatcher = GetProcessFromPidFile -PidFile $DevServerPidFile
if ($null -ne $existingWatcher -and $existingWatcher.Id -ne $PID) {
    WriteDevServerLog "[SKIP] already running pid=$($existingWatcher.Id)"
    Write-Host "npm run dev watcher가 이미 실행 중입니다. PID: $($existingWatcher.Id)"
    return
}

$startedAt = (Get-Date).ToString("o")
$currentProcessId = [int]$PID
$currentProcessId | Set-Content -LiteralPath $DevServerPidFile -Encoding UTF8
WriteDevServerState -ProcessId $currentProcessId -StatusValue "starting" -StartedAt $startedAt -LastMessage "dev server watcher starting"
WriteDevServerLog "[START] watcherPid=$currentProcessId background=$Background restartOnExit=$RestartOnExit"

$npmProcess = $null

try {
    while ($true) {
        if ($null -eq $npmProcess -or $npmProcess.HasExited) {
            if ($null -ne $npmProcess -and -not $RestartOnExit) {
                $exitCode = $npmProcess.ExitCode
                WriteDevServerLog "[NPM_EXIT] childPid=$($npmProcess.Id) exitCode=$exitCode"
                WriteDevServerState -ProcessId $currentProcessId -StatusValue "stopped" -StartedAt $startedAt -LastMessage "npm run dev exited: $exitCode" -ChildProcessId $npmProcess.Id
                break
            }

            $npmProcess = StartNpmDevProcess
            WriteDevServerState -ProcessId $currentProcessId -StatusValue "running" -StartedAt $startedAt -LastMessage "npm run dev running" -ChildProcessId $npmProcess.Id
        }
        else {
            WriteDevServerState -ProcessId $currentProcessId -StatusValue "running" -StartedAt $startedAt -LastMessage "npm run dev running" -ChildProcessId $npmProcess.Id
        }

        Start-Sleep -Seconds 3
    }
}
catch {
    $message = $_.Exception.Message
    $childProcessId = 0
    if ($null -ne $npmProcess) {
        $childProcessId = [int]$npmProcess.Id
    }
    WriteDevServerLog "[ERROR] $message"
    WriteDevServerState -ProcessId $currentProcessId -StatusValue "error" -StartedAt $startedAt -LastMessage $message -ChildProcessId $childProcessId
    throw
}
finally {
    WriteDevServerLog "[STOP] watcherPid=$currentProcessId"

    if ($null -ne $npmProcess -and -not $npmProcess.HasExited) {
        try {
            taskkill /PID $npmProcess.Id /T /F | Out-Null
            WriteDevServerLog "[NPM_STOP] childPid=$($npmProcess.Id)"
        }
        catch {
            WriteDevServerLog "[NPM_STOP_ERROR] $($_.Exception.Message)"
        }
    }

    Remove-Item -LiteralPath $DevServerPidFile -Force -ErrorAction SilentlyContinue
}
