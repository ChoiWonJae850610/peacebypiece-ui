# ==========================================
# PeaceByPiece Download Watcher
# Encoding: UTF-8 with BOM
# 다운로드 폴더 감시 및 패치 처리 전용 실행 파일
# 현재 단계에서는 foreground 실행이며, M 키로 메인 메뉴에 복귀한다.
# ==========================================

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
        $NewestResultDIr
    )) {
        EnsureDirectory -Path $path
    }
}

function WaitWatchIntervalOrMenuKey {
    param([int]$Seconds)

    $endAt = (Get-Date).AddSeconds($Seconds)

    while ((Get-Date) -lt $endAt) {
        if ([Console]::KeyAvailable) {
            $key = [Console]::ReadKey($true)

            if ($key.KeyChar -eq 'm' -or $key.KeyChar -eq 'M') {
                return $true
            }
        }

        Start-Sleep -Milliseconds 200
    }

    return $false
}

function StartDownloadWatcher {
    $previousTreatControlCAsInput = [Console]::TreatControlCAsInput
    [Console]::TreatControlCAsInput = $true

    try {
        while ($true) {
            cls
            Write-Host "========================================================="
            LogInfo "PeaceByPiece Download Watcher $Script_Version has been started."
            LogInfo "패치 데이터 경로   : $PatchDownloadDir"
            LogInfo "프로젝트 루트 경로 : $ProjectDir"
            LogInfo "현재 프로젝트 버전 : $(GetProjectAppVersion)"
            LogInfo "NPM 빌드 여부      : $NPMBuild"
            LogInfo "Git Push 여부      : $GitPushYN"
            LogInfo "Timeout             : $PatchWaitTimeoutSeconds seconds"
            LogInfo "감시 중 m 또는 M을 누르면 메인 메뉴로 돌아갑니다."
            Write-Host "========================================================="

            try {
                ProcessOnePatchIfReady
            }
            catch {
                LogError $_.Exception.Message
                LogWarn "패치 처리 중 오류가 발생했습니다."
                LogWarn "환경 오류 가능성이 있으므로 입력 파일은 남겨 둡니다."
            }

            if (WaitWatchIntervalOrMenuKey -Seconds $WatchIntervalSeconds) {
                return
            }
        }
    }
    finally {
        [Console]::TreatControlCAsInput = $previousTreatControlCAsInput
    }
}

InitializeDownloadWatcher
StartDownloadWatcher
