# ==========================================
# PeaceByPiece Pipeline Common Runtime
# Encoding: UTF-8 with BOM
# 공통 환경, 설정, 경로, 로그 및 기본 유틸
# ==========================================

$env:NO_COLOR = "1"
$env:FORCE_COLOR = "0"
$env:GIT_PAGER = "cat"
$env:TERM = "dumb"
$env:LANG = "ko_KR.UTF-8"
$env:LC_ALL = "ko_KR.UTF-8"

# Windows PowerShell 5.x / x86 환경에서는 git log 같은 외부 명령 출력이
# 콘솔 코드페이지 기준으로 잘못 디코딩되어 한글 커밋 메시지가 깨질 수 있다.
# repo-state 파일을 만들기 전에 PowerShell이 외부 명령 출력을 UTF-8로 해석하도록 고정한다.
$script:Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $script:Utf8NoBomEncoding
[Console]::OutputEncoding = $script:Utf8NoBomEncoding
$OutputEncoding = $script:Utf8NoBomEncoding

# ==========================================
# 0. Pipeline config
# ==========================================

$PipelineConfigPath = Join-Path $PSScriptRoot "pipeline.config.psd1"
if (-not (Test-Path -LiteralPath $PipelineConfigPath)) {
    throw "Pipeline config 파일을 찾을 수 없습니다: $PipelineConfigPath"
}

$PipelineConfig = Import-PowerShellDataFile -LiteralPath $PipelineConfigPath
$Script_Version = [string]$PipelineConfig.ScriptVersion

function ResolvePipelineProjectDir {
    param([string]$ConfiguredPath)

    if (-not [string]::IsNullOrWhiteSpace($ConfiguredPath)) {
        return [System.IO.Path]::GetFullPath($ConfiguredPath)
    }

    $candidate = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
    if (Test-Path -LiteralPath (Join-Path $candidate "package.json")) {
        return $candidate
    }

    throw "프로젝트 루트를 자동으로 찾지 못했습니다. pipeline.config.psd1의 Paths.ProjectDir를 설정하세요."
}

$ProjectDir = ResolvePipelineProjectDir -ConfiguredPath ([string]$PipelineConfig.Paths.ProjectDir)
$PatchDownloadDir = [string]$PipelineConfig.Paths.PatchDownloadDir
$PatchSuccessDir = [string]$PipelineConfig.Paths.PatchSuccessDir
$PatchFailedDir = [string]$PipelineConfig.Paths.PatchFailedDir
$BuildZipDir = [string]$PipelineConfig.Paths.BuildZipDir
$LogDir = [string]$PipelineConfig.Paths.LogDir
$RepoStatusDir = [string]$PipelineConfig.Paths.RepoStatusDir
$DevServerPidFile = [string]$PipelineConfig.Paths.DevServerPidFile
$NewestResultDIr = [string]$PipelineConfig.Paths.NewestResultDir

$NPMBuild = [bool]$PipelineConfig.Options.NPMBuild
$BackupProjectToZip = [bool]$PipelineConfig.Options.BackupProjectToZip
$GitCommitPushYN = [bool]$PipelineConfig.Options.GitCommitPushYN
$GitPushYN = [bool]$PipelineConfig.Options.GitPushYN
$WatchIntervalSeconds = [int]$PipelineConfig.Options.WatchIntervalSeconds
$PatchWaitTimeoutSeconds = [int]$PipelineConfig.Options.PatchWaitTimeoutSeconds
$StableWaitSeconds = [int]$PipelineConfig.Options.StableWaitSeconds

$ProtectedRootNames = @("node_modules", ".git", ".next")
$PackagePatchRootNames = @()
$script:AllowPackageJsonPatch = $true
$TempFilePatterns = @("*.crdownload", "*.tmp", "*.download", "*.partial")
$TextWrappedPatchFileExtensions = @(".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".ps1", ".bat", ".cmd", ".sh", ".vbs", ".reg", ".css", ".sql")
$script:TempFirstSeenAtByPath = @{}
$script:LatestRepoStatePath = ""
$script:LatestBuildLogPath = ""
$script:LatestBackupZipPath = ""

# ==========================================
# 1. 공통 유틸 함수
# ==========================================

function EnsureDirectory {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message"
}

function LogWarn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function LogError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function WritePipelineTitle {
    Write-Host "PeaceByPiece Patch Auto Pipeline $Script_Version  $(GetProjectAppVersion)" -ForegroundColor Cyan
}

function WriteToggleMenuLine {
    param(
        [string]$Prefix,
        [string]$Status
    )

    Write-Host "$Prefix [" -NoNewline

    if ($Status -eq "ON") {
        Write-Host "ON" -ForegroundColor Green -NoNewline
    }
    else {
        Write-Host "OFF" -ForegroundColor Red -NoNewline
    }

    Write-Host "]"
}

function GetTimestamp {
    return (Get-Date).ToString("yyyyMMdd-HHmmss")
}

function ReadUtf8Text {
    param([string]$Path)

    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}


function GetProjectAppVersion {
    $appConstantsPath = Join-Path $ProjectDir "lib\constants\version.ts"

    if (-not (Test-Path -LiteralPath $appConstantsPath)) {
        return "APP_VERSION 확인 불가(app.ts 없음)"
    }

    try {
        $content = ReadUtf8Text -Path $appConstantsPath
        $pattern = "(?m)^\s*export\s+const\s+APP_VERSION\s*=\s*[`"']([^`"']+)[`"']\s*;?"
        $match = [regex]::Match($content, $pattern)

        if ($match.Success) {
            return $match.Groups[1].Value.Trim()
        }

        return "APP_VERSION 파싱 실패"
    }
    catch {
        return "APP_VERSION 확인 오류: $($_.Exception.Message)"
    }
}


