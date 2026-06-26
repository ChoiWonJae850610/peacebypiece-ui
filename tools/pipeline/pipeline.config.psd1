@{
    ScriptVersion = "v19.8"

    Paths = @{
        # 빈 값이면 tools/pipeline 기준으로 Git 프로젝트 루트를 자동 탐색합니다.
        ProjectDir = ""
        PatchDownloadDir = "C:\CWJ_Project\Patch\Download"
        PatchSuccessDir = "C:\CWJ_Project\Patch\PeacebyPiece\0. Success"
        PatchFailedDir = "C:\CWJ_Project\Patch\PeacebyPiece\1. Failed"
        BuildZipDir = "C:\CWJ_Project\Patch\PeacebyPiece\3. Project_Zips"
        LogDir = "C:\CWJ_Project\Patch\PeacebyPiece\2. Logs\NPM_Build"
        RepoStatusDir = "C:\CWJ_Project\Patch\PeacebyPiece\2. Logs\Repo_Status"
        DevServerPidFile = "C:\CWJ_Project\Patch\PeacebyPiece\2. Logs\dev-server.pid"
        WatcherPidFile = "C:\CWJ_Project\Patch\PeacebyPiece\2. Logs\download-watcher.pid"
        WatcherStateFile = "C:\CWJ_Project\Patch\PeacebyPiece\2. Logs\download-watcher-state.json"
        WatcherLogFile = "C:\CWJ_Project\Patch\PeacebyPiece\2. Logs\download-watcher.log"
        RuntimeOptionsFile = "C:\CWJ_Project\Patch\PeacebyPiece\2. Logs\pipeline-runtime-options.json"
        NewestResultDir = "C:\CWJ_Project\Patch\PeacebyPiece\4. Newest"
    }

    Options = @{
        NPMBuild = $true
        BackupProjectToZip = $true
        GitCommitPushYN = $true
        GitPushYN = $true
        WatchIntervalSeconds = 3
        PatchWaitTimeoutSeconds = 300
        StableWaitSeconds = 3
    }

    Simulator = @{
        TestPrefix = "wafl-fn"
        AllowedRuntimes = @("development", "dev", "local", "test", "demo")
        # host/database 문자열의 SHA-256 앞 12자리. 비밀번호나 URL이 아닙니다.
        ApprovedDbFingerprint = "01e5dcc7fea3"
        # Worker URL 또는 host 문자열의 SHA-256 앞 12자리. 실제 URL이나 secret이 아닙니다.
        ApprovedWorkerUrlFingerprint = "b49fb0bd3ff1"
        ApprovedWorkerHostFingerprint = "446bdb61c239"
        ApprovedWorkerUrlAllowlist = ""
    }
}
