# ==========================================
# PeaceByPiece Download Watcher
# Encoding: UTF-8 with BOM
# 백그라운드 다운로드 감시 및 패치 처리 전용 실행 파일
# ==========================================

param(
    [switch]$Background
)

$PipelineCommonPath = Join-Path $PSScriptRoot "pipeline-common.ps1"
$PipelinePatchProcessingPath = Join-Path $PSScriptRoot "pipeline-patch-processing.ps1"

foreach ($requiredScript in @($PipelineCommonPath, $PipelinePatchProcessingPath)) {
    if (-not (Test-Path -LiteralPath $requiredScript)) {
        throw "Pipeline 구성 스크립트를 찾을 수 없습니다: $requiredScript"
    }
}

. $PipelineCommonPath
. $PipelinePatchProcessingPath

function InitializeDownloadWatcher {
    foreach ($path in @(
        $PatchDownloadDir,
        $PatchSuccessDir,
        $PatchFailedDir,
        $BuildZipDir,
        $LogDir,
        $RepoStatusDir,
        $NewestResultDIr,
        (Split-Path -Parent $WatcherPidFile),
        (Split-Path -Parent $WatcherStateFile),
        (Split-Path -Parent $WatcherLogFile),
        (Split-Path -Parent $RuntimeOptionsFile)
    )) {
        EnsureDirectory -Path $path
    }
}

function StartDownloadWatcherLoop {
    $startedAt = (Get-Date).ToString('o')
    $PID | Set-Content -LiteralPath $WatcherPidFile -Encoding UTF8
    WriteWatcherState -ProcessId $PID -Status 'running' -StartedAt $startedAt -LastMessage 'watcher started'
    WriteWatcherLog "[START] pid=$PID watchPath=$PatchDownloadDir"

    try {
        while ($true) {
            RefreshRuntimeOptions
            WriteWatcherState -ProcessId $PID -Status 'running' -StartedAt $startedAt -LastMessage 'watching'

            try {
                ProcessOnePatchIfReady
            }
            catch {
                $message = $_.Exception.Message
                WriteWatcherLog "[ERROR] $message"
                WriteWatcherState -ProcessId $PID -Status 'error' -StartedAt $startedAt -LastMessage $message
            }

            Start-Sleep -Seconds $WatchIntervalSeconds
        }
    }
    finally {
        WriteWatcherLog "[STOP] pid=$PID"
        WriteWatcherState -ProcessId $PID -Status 'stopped' -StartedAt $startedAt -LastMessage 'watcher stopped'
        Remove-Item -LiteralPath $WatcherPidFile -Force -ErrorAction SilentlyContinue
    }
}

InitializeDownloadWatcher
StartDownloadWatcherLoop
