# ==========================================
# PeaceByPiece Download Watcher
# Encoding: UTF-8 with BOM
# 0.24.34.8.1 hotfix: repair known pipeline parser error before dot-sourcing
# ==========================================

param(
    [switch]$Background
)

$ErrorActionPreference = "Stop"

$PipelineCommonPath = Join-Path $PSScriptRoot "pipeline-common.ps1"
$PipelinePatchProcessingPath = Join-Path $PSScriptRoot "pipeline-patch-processing.ps1"

function AssertWatcherDependencyFile {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path)) {
        throw "Pipeline 구성 스크립트를 찾을 수 없습니다: $Path"
    }
}

function RepairPipelinePatchProcessingIfNeeded {
    param([string]$Path)

    AssertWatcherDependencyFile -Path $Path

    $raw = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)

    # Previous 0.24.34.8 generated an invalid double-quoted regex line for APP_VERSION.
    # Replace that assignment before dot-sourcing pipeline-patch-processing.ps1.
    $fixedPatternLine = '        $pattern = ''(?m)^\s*export\s+const\s+APP_VERSION\s*=\s*["'''']([^"'''']+)["'''']\s*;?'''
    $linePattern = '(?m)^\s*\$pattern\s*=\s*.+APP_VERSION.+$'
    $regex = New-Object System.Text.RegularExpressions.Regex($linePattern)
    $updated = $regex.Replace($raw, $fixedPatternLine, 1)

    if ($updated -ne $raw) {
        $backupPath = "$Path.bak-0.24.34.8.1"
        if (-not (Test-Path -LiteralPath $backupPath)) {
            [System.IO.File]::WriteAllText($backupPath, $raw, [System.Text.UTF8Encoding]::new($true))
        }
        [System.IO.File]::WriteAllText($Path, $updated, [System.Text.UTF8Encoding]::new($true))
    }
}

function EnsureWatcherDirectory {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return
    }

    EnsureDirectory -Path $Path
}

function EnsureWatcherDirectoryForFile {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return
    }

    $parentPath = Split-Path -Parent $Path
    EnsureWatcherDirectory -Path $parentPath
}

foreach ($requiredScript in @($PipelineCommonPath, $PipelinePatchProcessingPath)) {
    AssertWatcherDependencyFile -Path $requiredScript
}

RepairPipelinePatchProcessingIfNeeded -Path $PipelinePatchProcessingPath

. $PipelineCommonPath
. $PipelinePatchProcessingPath

foreach ($requiredFunctionName in @(
    "EnsureDirectory",
    "RefreshRuntimeOptions",
    "WriteWatcherLog",
    "WriteWatcherState",
    "ProcessOnePatchIfReady"
)) {
    if ($null -eq (Get-Command -Name $requiredFunctionName -CommandType Function -ErrorAction SilentlyContinue)) {
        throw "download watcher 필수 함수를 찾을 수 없습니다: $requiredFunctionName"
    }
}

function InitializeDownloadWatcher {
    $requiredDirectories = @(
        $PatchDownloadDir,
        $PatchSuccessDir,
        $PatchFailedDir,
        $BuildZipDir,
        $LogDir,
        $RepoStatusDir,
        $NewestResultDir
    )

    foreach ($path in $requiredDirectories) {
        EnsureWatcherDirectory -Path $path
    }

    foreach ($filePath in @(
        $WatcherPidFile,
        $WatcherStateFile,
        $WatcherLogFile,
        $RuntimeOptionsFile
    )) {
        EnsureWatcherDirectoryForFile -Path $filePath
    }

    WriteWatcherLog "[INIT] watcher directories checked"
}

function StartDownloadWatcherLoop {
    $startedAt = (Get-Date).ToString("o")
    $currentProcessId = [int]$PID

    try {
        $currentProcessId | Set-Content -LiteralPath $WatcherPidFile -Encoding UTF8
        WriteWatcherState -ProcessId $currentProcessId -Status "running" -StartedAt $startedAt -LastMessage "watcher started"
        WriteWatcherLog "[START] pid=$currentProcessId watchPath=$PatchDownloadDir"

        while ($true) {
            try {
                RefreshRuntimeOptions
                WriteWatcherState -ProcessId $currentProcessId -Status "running" -StartedAt $startedAt -LastMessage "watching"
                ProcessOnePatchIfReady
            }
            catch {
                $message = $_.Exception.Message
                WriteWatcherLog "[ERROR] $message"
                WriteWatcherState -ProcessId $currentProcessId -Status "error" -StartedAt $startedAt -LastMessage $message
            }

            Start-Sleep -Seconds $WatchIntervalSeconds
        }
    }
    finally {
        WriteWatcherLog "[STOP] pid=$currentProcessId"
        WriteWatcherState -ProcessId $currentProcessId -Status "stopped" -StartedAt $startedAt -LastMessage "watcher stopped"
        Remove-Item -LiteralPath $WatcherPidFile -Force -ErrorAction SilentlyContinue
    }
}

InitializeDownloadWatcher
StartDownloadWatcherLoop
