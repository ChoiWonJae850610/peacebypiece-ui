# ==========================================
# PeaceByPiece Patch Processing Engine
# Encoding: UTF-8 with BOM
# commit-meta 파싱, 다운로드 안정화, 안전 검사, 패치 적용, Git/build/archive 처리
# pipeline-common.ps1 로드 후 사용
# ==========================================

# ==========================================
# 2. commit-meta.md 파싱 함수
# ==========================================

function GetMetaValue {
    param(
        [string]$Content,
        [string]$Key
    )

    $pattern = "(?m)^\s*" + [regex]::Escape($Key) + "\s*:\s*(.*)$"
    $match = [regex]::Match($Content, $pattern)

    if ($match.Success) {
        return $match.Groups[1].Value.Trim()
    }

    return ""
}

function AssertMetaFormat {
    param([string]$MetaPath)

    if (-not (Test-Path -LiteralPath $MetaPath)) {
        throw "commit-meta.md 파일이 없습니다."
    }

    $content = ReadUtf8Text -Path $MetaPath

    $requiredTokens = @(
        "Version :",
        "Summary :",
        "Description :",
        "수정 파일 목록 :",
        "추가 파일 목록 :",
        "삭제 파일 목록 :"
    )

    foreach ($token in $requiredTokens) {
        if ($content -notmatch [regex]::Escape($token)) {
            throw "commit-meta.md 필수 토큰 누락: $token"
        }
    }

    $version = GetMetaValue -Content $content -Key "Version"
    $summary = GetMetaValue -Content $content -Key "Summary"

    if ([string]::IsNullOrWhiteSpace($version)) {
        throw "commit-meta.md의 Version 값이 비어 있습니다."
    }

    if ([string]::IsNullOrWhiteSpace($summary)) {
        throw "commit-meta.md의 Summary 값이 비어 있습니다."
    }

    return @{
        Content = $content
        Version = $version
        Summary = $summary
    }
}

function GetSectionItemsFromMeta {
    param(
        [string]$Content,
        [string]$SectionName
    )

    # 예:
    # 수정 파일 목록 :
    # - lib/admin/history/presentation.ts
    # lib/admin/history/presentation.ts
    #
    # v15 수정:
    # - 기존에는 '-' 또는 '*' bullet로 시작하는 줄만 파일 목록으로 인식했다.
    # - 최근 commit-meta.md는 plain line 형식도 사용하므로 non-empty plain line도 파일 목록으로 인식한다.
    # - 다음 섹션 제목이 나오면 읽기를 멈춘다.
    $sectionHeaders = @(
        "Version",
        "Summary",
        "Description",
        "수정 파일 목록",
        "추가 파일 목록",
        "삭제 파일 목록",
        "작업 상세",
        "Package 변경 허용",
        "허용 dependency"
    )

    $lines = $Content -split "`r?`n"
    $capture = $false
    $items = New-Object System.Collections.Generic.List[string]

    foreach ($line in $lines) {
        if ($line -match ('^\s*' + [regex]::Escape($SectionName) + '\s*:')) {
            $capture = $true
            continue
        }

        if ($capture) {
            foreach ($header in $sectionHeaders) {
                if ($header -ne $SectionName -and $line -match ('^\s*' + [regex]::Escape($header) + '\s*:')) {
                    return $items
                }
            }

            $trimmed = $line.Trim()

            if ([string]::IsNullOrWhiteSpace($trimmed)) {
                continue
            }

            if ($trimmed -eq "없음" -or $trimmed -eq "(없음)" -or $trimmed -eq "none" -or $trimmed -eq "None") {
                continue
            }

            $value = $trimmed

            if ($trimmed -match '^[-*]\s+(.+)$') {
                $value = $Matches[1].Trim()
            }

            # Markdown code fence나 설명 문장은 파일 목록이 아니므로 제외한다.
            if ($value -match '^```') {
                continue
            }

            # 파일 목록은 보통 경로 구분자, transport 구분자(__), 또는 확장자를 포함한다.
            # commit-meta의 설명 문구가 실수로 섹션 안에 들어온 경우를 막는다.
            if ($value -notmatch '[\/]' -and $value -notmatch '__' -and $value -notmatch '\.[A-Za-z0-9]+(\.txt)?$') {
                continue
            }

            $items.Add($value)
        }
    }

    return $items
}


function TestTextWrappedRelativePathAllowed {
    param([string]$RelativePath)

    $extension = [System.IO.Path]::GetExtension($RelativePath).ToLowerInvariant()

    foreach ($allowedExtension in $TextWrappedPatchFileExtensions) {
        if ($extension -eq $allowedExtension) {
            return $true
        }
    }

    return $false
}

function NormalizeMetaPathItem {
    param([string]$Item)

    $value = $Item.Trim()

    if ([string]::IsNullOrWhiteSpace($value)) {
        return $value
    }

    # commit-meta.md에는 원칙적으로 repo 상대 경로가 들어와야 한다.
    # 단, ChatGPT/자동화 전송 과정에서 아래처럼 transport 파일명이 목록에 들어오는 경우가 있다.
    # components__admin__dashboard__AdminStatsDashboard.tsx.txt
    # 이 경우 실제 프로젝트 경로로 정규화한다.
    $hasDirectorySeparator = ($value -match '[\/]')

    if (-not $hasDirectorySeparator -and $value -match '__') {
        $value = $value -replace '__', [System.IO.Path]::DirectorySeparatorChar
    }

    # 보안 필터 때문에 .tsx.txt / .ts.txt / .js.txt 등으로 들어온 항목은
    # 실제 프로젝트 파일명으로 복원한다.
    if ($value.EndsWith('.txt')) {
        $withoutTextSuffix = $value.Substring(0, $value.Length - 4)

        if (TestTextWrappedRelativePathAllowed -RelativePath $withoutTextSuffix) {
            $value = $withoutTextSuffix
        }
    }

    return $value
}

function NormalizeMetaPathItems {
    param([System.Collections.Generic.List[string]]$Items)

    $normalizedItems = New-Object System.Collections.Generic.List[string]

    foreach ($item in $Items) {
        $normalized = NormalizeMetaPathItem -Item $item

        if (-not [string]::IsNullOrWhiteSpace($normalized)) {
            $normalizedItems.Add($normalized)
        }
    }

    return $normalizedItems
}

function GetDescriptionForGit {
    param([string]$Content)

    $lines = $Content -split "`r?`n"
    $capture = $false
    $buffer = New-Object System.Collections.Generic.List[string]

    foreach ($line in $lines) {
        if ($line -match '^\s*Description\s*:') {
            $capture = $true
            $afterColon = ($line -replace '^\s*Description\s*:\s*', '')

            if (-not [string]::IsNullOrWhiteSpace($afterColon)) {
                $buffer.Add($afterColon.Trim())
            }

            continue
        }

        if ($capture -and $line -match '^\s*(수정 파일 목록|추가 파일 목록|삭제 파일 목록|작업 상세)\s*:') {
            break
        }

        if ($capture) {
            $buffer.Add($line)
        }
    }

    $description = ($buffer -join "`n").Trim()

    if ([string]::IsNullOrWhiteSpace($description)) {
        return "No description."
    }

    return $description
}

function TestPackageJsonPatchAllowedFromMeta {
    param([string]$Content)

    # 앞으로 commit-meta.md에는 아래 필드를 사용한다.
    #
    # Package 변경 허용 :
    # true
    #
    # 허용 dependency :
    # - recharts
    #
    # 기존 0.9.204 패치처럼 Description에 package 변경 허용 문구가 이미 들어간 경우도
    # 한 번 통과시킬 수 있도록 fallback을 둔다.
    $explicitValue = GetMetaValue -Content $Content -Key "Package 변경 허용"

    if ($explicitValue -match '^(true|yes|y|1|허용|allowed)$') {
        return $true
    }

    if (
        $Content -match 'package\.json' -and
        $Content -match 'package-lock\.json' -and
        $Content -match '(수정 허용|변경 허용|명시 허용|사용자의 명시 허용)'
    ) {
        return $true
    }

    return $false
}


# ==========================================
# 3. 경로 변환 / 안전 검사 함수
# ==========================================

function ConvertPatchFileNameToRelativePath {
    param([string]$FileName)

    if ($FileName -eq "commit-meta.md") {
        return "commit-meta.md"
    }

    return ($FileName -replace '__', [System.IO.Path]::DirectorySeparatorChar)
}

function ConvertRelativePathToPatchFileName {
    param([string]$RelativePath)

    $normalized = $RelativePath -replace '/', [System.IO.Path]::DirectorySeparatorChar
    $normalized = $normalized -replace '\\', [System.IO.Path]::DirectorySeparatorChar

    return ($normalized -replace [regex]::Escape([System.IO.Path]::DirectorySeparatorChar), '__')
}

function TestTextWrappedPatchFileAllowed {
    param([string]$PatchFileName)

    $extension = [System.IO.Path]::GetExtension($PatchFileName).ToLowerInvariant()

    foreach ($allowedExtension in $TextWrappedPatchFileExtensions) {
        if ($extension -eq $allowedExtension) {
            return $true
        }
    }

    return $false
}

function ResolvePatchSourceFilePath {
    param(
        [string]$InputPath,
        [string]$PatchFileName
    )

    $normalPath = Join-Path $InputPath $PatchFileName

    if (Test-Path -LiteralPath $normalPath) {
        return $normalPath
    }

    if (TestTextWrappedPatchFileAllowed -PatchFileName $PatchFileName) {
        $textWrappedPath = Join-Path $InputPath ($PatchFileName + ".txt")

        if (Test-Path -LiteralPath $textWrappedPath) {
            return $textWrappedPath
        }
    }

    return $normalPath
}

function TestPackagePatchRootName {
    param([string]$RelativePath)

    $first = ($RelativePath -split '[\\/]')[0]

    foreach ($packageRoot in $PackagePatchRootNames) {
        if ($first -eq $packageRoot -or $RelativePath -eq $packageRoot) {
            return $true
        }
    }

    return $false
}

function AssertSafeRelativePath {
    param(
        [string]$RelativePath,
        [bool]$AllowPackageJsonPatch = $false
    )

    if ([string]::IsNullOrWhiteSpace($RelativePath)) {
        throw "상대 경로가 비어 있습니다."
    }

    if ([System.IO.Path]::IsPathRooted($RelativePath)) {
        throw "절대 경로는 허용하지 않습니다: $RelativePath"
    }

    if ($RelativePath -match '(^|[\/\\])\.\.([\/\\]|$)') {
        throw "상위 폴더 이동 경로는 허용하지 않습니다: $RelativePath"
    }

    $first = ($RelativePath -split '[\\/]')[0]

    foreach ($protected in $ProtectedRootNames) {
        if ($first -eq $protected -or $RelativePath -eq $protected) {
            if ($AllowPackageJsonPatch -and (TestPackagePatchRootName -RelativePath $RelativePath)) {
                return
            }

            throw "보호 경로는 자동 수정할 수 없습니다: $RelativePath"
        }
    }
}

function AssertPatchPathListSafe {
    param(
        [System.Collections.Generic.List[string]]$ModifiedRelativePaths,
        [System.Collections.Generic.List[string]]$AddedRelativePaths,
        [System.Collections.Generic.List[string]]$DeleteRelativePaths
    )

    # commit-meta.md를 읽은 직후 전체 경로를 먼저 검증한다.
    # 보호 파일이 있으면 기다리지 않고 즉시 failed_patch로 이동시키기 위한 사전 검사다.
    # package.json / package-lock.json은 commit-meta.md가 명시 허용한 수정/추가 패치에서만 예외 허용한다.
    foreach ($relativePath in $ModifiedRelativePaths) {
        AssertSafeRelativePath -RelativePath $relativePath -AllowPackageJsonPatch:$script:AllowPackageJsonPatch
    }

    foreach ($relativePath in $AddedRelativePaths) {
        AssertSafeRelativePath -RelativePath $relativePath -AllowPackageJsonPatch:$script:AllowPackageJsonPatch
    }

    foreach ($relativePath in $DeleteRelativePaths) {
        # 삭제 목록에서는 package.json / package-lock.json도 예외 허용하지 않는다.
        AssertSafeRelativePath -RelativePath $relativePath -AllowPackageJsonPatch:$false
    }
}


# ==========================================
# 4. 입력 폴더 상태 검사 함수
# ==========================================

function GetPatchFilesInInput {
    param([string]$InputPath)

    # incoming_patch 바로 아래 파일만 허용한다.
    # 폴더 방식은 사용하지 않는다.
    return @(Get-ChildItem -LiteralPath $InputPath -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -ne "desktop.ini" -and
        $_.Name -notlike "*.crdownload" -and
        $_.Name -notlike "*.tmp" -and
        $_.Name -notlike "*.download" -and
        $_.Name -notlike "*.partial"
    })
}

function GetTempDownloadFilesInInput {
    param([string]$InputPath)

    $result = New-Object System.Collections.Generic.List[System.IO.FileInfo]

    foreach ($pattern in $TempFilePatterns) {
        $tempFiles = @(Get-ChildItem -LiteralPath $InputPath -File -Filter $pattern -ErrorAction SilentlyContinue)

        foreach ($tempFile in $tempFiles) {
            $result.Add($tempFile)
        }
    }

    return $result
}

function WaitInputStable {
    param([string]$InputPath)

    # Drive/브라우저가 commit-meta.md를 막 만든 직후일 수 있으므로 짧게 안정화만 기다린다.
    # 임시 다운로드 파일과 필수 파일 누락은 WaitUntilRequiredPatchFilesReady에서 5분 타임아웃으로 처리한다.
    Start-Sleep -Seconds $StableWaitSeconds
}

function GetMissingRequiredPatchFiles {
    param(
        [string]$InputPath,
        [System.Collections.Generic.List[string]]$RequiredRelativePaths
    )

    $missingFiles = New-Object System.Collections.Generic.List[string]

    foreach ($relativePath in $RequiredRelativePaths) {
        $normalizedRelativePath = NormalizeMetaPathItem -Item $relativePath
        AssertSafeRelativePath -RelativePath $normalizedRelativePath -AllowPackageJsonPatch:$script:AllowPackageJsonPatch

        $expectedPatchFileName = ConvertRelativePathToPatchFileName -RelativePath $normalizedRelativePath
        $expectedPatchFilePath = ResolvePatchSourceFilePath -InputPath $InputPath -PatchFileName $expectedPatchFileName

        if (-not (Test-Path -LiteralPath $expectedPatchFilePath)) {
            $missingFiles.Add($expectedPatchFileName)
        }
    }

    return $missingFiles
}

function TestAllRequiredPatchFilesArrived {
    param(
        [string]$InputPath,
        [System.Collections.Generic.List[string]]$RequiredRelativePaths
    )

    $missingFiles = GetMissingRequiredPatchFiles -InputPath $InputPath -RequiredRelativePaths $RequiredRelativePaths

    if ($missingFiles.Count -gt 0) {
        LogWarn "아직 도착하지 않은 패치 파일이 있습니다. 작업하지 않고 대기합니다."
        foreach ($missing in $missingFiles) {
            LogWarn "Missing: $missing"
        }
        return $false
    }

    return $true
}

function WaitUntilRequiredPatchFilesReady {
    param(
        [string]$InputPath,
        [System.Collections.Generic.List[string]]$RequiredRelativePaths,
        [int]$TimeoutSeconds
    )

    # v8 정책:
    # - 현재 patch의 기준은 commit-meta.md에 적힌 수정/추가 파일 목록이다.
    # - 목록에 있는 파일만 모두 도착하면 진행한다.
    # - incoming_patch에 남아 있는 .crdownload/.tmp 같은 임시 파일은,
    #   현재 commit-meta.md의 필수 파일이 아니면 이 patch를 막지 않는다.
    # - 필수 파일이 끝까지 오지 않으면 5분 뒤 failed_patch로 이동한다.
    $startedAt = Get-Date
    $lastMissingText = ""

    while ($true) {
        $missingFiles = GetMissingRequiredPatchFiles -InputPath $InputPath -RequiredRelativePaths $RequiredRelativePaths

        if ($missingFiles.Count -eq 0) {
            $tempFiles = @(GetTempDownloadFilesInInput -InputPath $InputPath)

            if ($tempFiles.Count -gt 0) {
                LogWarn "임시 다운로드 파일이 남아 있지만 현재 commit-meta.md의 필수 파일은 모두 도착했습니다. 이 patch는 계속 진행합니다."
                foreach ($tempFile in $tempFiles) {
                    LogWarn "Ignored temp file: $($tempFile.Name)"
                }
            }

            return @{
                Success = $true
                Reason = ""
                Missing = @()
            }
        }

        $elapsed = [int]((Get-Date) - $startedAt).TotalSeconds
        $missingText = ($missingFiles -join ", ")

        if ($missingText -ne $lastMissingText) {
            LogWarn "아직 도착하지 않은 필수 패치 파일이 있습니다."
            foreach ($missing in $missingFiles) {
                LogWarn "Missing: $missing"
            }
            $lastMissingText = $missingText
        }
        else {
            LogWarn "필수 패치 파일 대기 중... 경과 ${elapsed}초 / 제한 ${TimeoutSeconds}초"
        }

        if ($elapsed -ge $TimeoutSeconds) {
            return @{
                Success = $false
                Reason = "필수 패치 파일이 $TimeoutSeconds초 안에 모두 도착하지 않아 패치를 중단했습니다. Missing: $missingText"
                Missing = @($missingFiles)
            }
        }

        Start-Sleep -Seconds $WatchIntervalSeconds
    }
}

function AssertProjectReady {
    if (-not (Test-Path -LiteralPath $ProjectDir)) {
        throw "프로젝트 폴더를 찾을 수 없습니다: $ProjectDir"
    }

    $gitDir = Join-Path $ProjectDir ".git"

    if (-not (Test-Path -LiteralPath $gitDir)) {
        throw "프로젝트 폴더가 git 저장소가 아닙니다: $ProjectDir"
    }
}


# ==========================================
# 5. 패치 적용 함수
# ==========================================

function CopyRequiredPatchFilesToProject {
    param(
        [string]$InputPath,
        [System.Collections.Generic.List[string]]$RequiredRelativePaths
    )

    foreach ($relativePath in $RequiredRelativePaths) {
        AssertSafeRelativePath -RelativePath $relativePath -AllowPackageJsonPatch:$script:AllowPackageJsonPatch

        $normalizedRelativePath = NormalizeMetaPathItem -Item $relativePath
        $patchFileName = ConvertRelativePathToPatchFileName -RelativePath $normalizedRelativePath
        $sourcePath = ResolvePatchSourceFilePath -InputPath $InputPath -PatchFileName $patchFileName
        $targetPath = Join-Path $ProjectDir $normalizedRelativePath
        $targetDir = Split-Path -Parent $targetPath

        if (-not (Test-Path -LiteralPath $sourcePath)) {
            throw "패치 소스 파일을 찾을 수 없습니다: $patchFileName"
        }

        EnsureDirectory -Path $targetDir
        Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force

        if ((Split-Path -Leaf $sourcePath) -ne $patchFileName) {
            LogInfo "Applied text-wrapped file: $(Split-Path -Leaf $sourcePath) -> $normalizedRelativePath"
        }
        else {
            LogInfo "Applied: $normalizedRelativePath"
        }
    }
}

function DeleteFilesFromProject {
    param([System.Collections.Generic.List[string]]$DeleteRelativePaths)

    foreach ($deletePath in $DeleteRelativePaths) {
        $normalizedDeletePath = $deletePath -replace '/', [System.IO.Path]::DirectorySeparatorChar
        AssertSafeRelativePath -RelativePath $normalizedDeletePath -AllowPackageJsonPatch:$false

        $targetDeletePath = Join-Path $ProjectDir $normalizedDeletePath

        if (Test-Path -LiteralPath $targetDeletePath) {
            Remove-Item -LiteralPath $targetDeletePath -Force
            LogInfo "Deleted: $normalizedDeletePath"
        }
        else {
            LogWarn "삭제 대상 파일이 없습니다: $normalizedDeletePath"
        }
    }
}

function CopyCommitMetaToProject {
    param([string]$MetaPath)

    Copy-Item -LiteralPath $MetaPath -Destination (Join-Path $ProjectDir "commit-meta.md") -Force
    LogInfo "Applied: commit-meta.md"
}


# ==========================================
# 6. git / build / 백업 함수
# ==========================================


function InvokeGitOutput {
    param([string[]]$Arguments)

    $output = & git `
        -c color.ui=false `
        -c core.pager=cat `
        -c core.quotepath=false `
        -c i18n.logOutputEncoding=utf-8 `
        -C $ProjectDir @Arguments 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        return @(
            "[git command failed] git $($Arguments -join ' ')",
            "ExitCode: $exitCode",
            ($output | Out-String).Trim()
        )
    }

    return @($output)
}

function GetAppVersionLineFromProject {
    $appVersionPath = Join-Path $ProjectDir "lib\constants\app.ts"

    if (-not (Test-Path -LiteralPath $appVersionPath)) {
        return "APP_VERSION file not found: $appVersionPath"
    }

    $match = Select-String -Path $appVersionPath -Pattern "APP_VERSION" -ErrorAction SilentlyContinue | Select-Object -First 1

    if ($null -eq $match) {
        return "APP_VERSION line not found in lib\constants\app.ts"
    }

    return $match.Line.Trim()
}

function SaveRepoStateSnapshot {
    param([string]$Version)

    EnsureDirectory -Path $RepoStatusDir

    $timestamp = GetTimestamp
    $safeVersion = if ($Version) { $Version -replace '[^0-9A-Za-z._-]', '_' } else { "unknown" }
    $stateFilePath = Join-Path $RepoStatusDir "repo-state-$safeVersion-$timestamp.txt"

    $lines = New-Object System.Collections.Generic.List[string]

    $lines.Add("Generated At:")
    $lines.Add((Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
    $lines.Add("")

    $lines.Add("Patch Version:")
    $lines.Add($Version)
    $lines.Add("")

    $lines.Add("Push Completed:")
    $lines.Add("true")
    $lines.Add("")

    $lines.Add("Project Dir:")
    $lines.Add($ProjectDir)
    $lines.Add("")

    $lines.Add("Branch:")
    foreach ($line in (InvokeGitOutput -Arguments @("branch", "--show-current"))) { $lines.Add([string]$line) }
    $lines.Add("")

    $lines.Add("Local HEAD Commit:")
    foreach ($line in (InvokeGitOutput -Arguments @("rev-parse", "HEAD"))) { $lines.Add([string]$line) }
    $lines.Add("")

    $lines.Add("Origin Master Commit:")
    foreach ($line in (InvokeGitOutput -Arguments @("rev-parse", "origin/master"))) { $lines.Add([string]$line) }
    $lines.Add("")

    $lines.Add("Latest Commit:")
    foreach ($line in (InvokeGitOutput -Arguments @("log", "--oneline", "-1"))) { $lines.Add([string]$line) }
    $lines.Add("")

    $lines.Add("Recent Commits:")
    foreach ($line in (InvokeGitOutput -Arguments @("log", "--oneline", "-3"))) { $lines.Add([string]$line) }
    $lines.Add("")

    $lines.Add("Branch Verbose:")
    foreach ($line in (InvokeGitOutput -Arguments @("branch", "-vv"))) { $lines.Add([string]$line) }
    $lines.Add("")

    $lines.Add("Status Short:")
    $statusShort = @(InvokeGitOutput -Arguments @("status", "--short"))
    if ($statusShort.Count -eq 0) {
        $lines.Add("clean")
    }
    else {
        foreach ($line in $statusShort) { $lines.Add([string]$line) }
    }
    $lines.Add("")

    $lines.Add("Status Full:")
    foreach ($line in (InvokeGitOutput -Arguments @("status"))) { $lines.Add([string]$line) }
    $lines.Add("")

    $lines.Add("APP_VERSION:")
    $lines.Add((GetAppVersionLineFromProject))
    $lines.Add("")

    $lines.Add("Remote:")
    foreach ($line in (InvokeGitOutput -Arguments @("remote", "-v"))) { $lines.Add([string]$line) }

    [System.IO.File]::WriteAllLines($stateFilePath, $lines, [System.Text.Encoding]::UTF8)
    $script:LatestRepoStatePath = $stateFilePath
    LogInfo "Repo state snapshot saved: $stateFilePath"
}

function CommitAndPush {
    param(
        [string]$Summary,
        [string]$Description,
        [string]$Version
    )

    if (-not $GitCommitPushYN) {
        LogWarn "GitCommitPushYN = false 상태입니다. Git Commit / Push를 생략합니다."
        return
    }

    LogInfo "Git status before add:"
    git -c color.ui=false -c core.pager=cat -C $ProjectDir status --short

    LogInfo "Running git add -A..."
    git -c color.ui=false -c core.pager=cat -C $ProjectDir add -A

    if ($LASTEXITCODE -ne 0) {
        throw "git add 실패"
    }

    LogInfo "Git status after add:"
    git -c color.ui=false -c core.pager=cat -C $ProjectDir status --short

    git -c color.ui=false -c core.pager=cat -C $ProjectDir diff --cached --quiet
    $diffExitCode = $LASTEXITCODE

    if ($diffExitCode -eq 0) {
        LogWarn "Staged 변경사항이 없습니다. Commit을 생략합니다."
        return
    }

    if ($diffExitCode -ne 1) {
        throw "git diff --cached 검사 실패"
    }

    LogInfo "Running git commit..."
    git -c color.ui=false -c core.pager=cat -C $ProjectDir commit -m $Summary -m $Description

    if ($LASTEXITCODE -ne 0) {
        throw "Git Commit 실패"
    }

    if ($GitPushYN) {
        LogInfo "Running git push..."
        git -c color.ui=false -c core.pager=cat -C $ProjectDir push

        if ($LASTEXITCODE -ne 0) {
            throw "Git Push 실패"
        }

        SaveRepoStateSnapshot -Version $Version
    }

    LogInfo "Git Commit / Push 완료"
}


function RenameBuildLogWithStatusAndLineCount {
    param(
        [string]$BuildLogPath,
        [int]$ExitCode
    )

    if ([string]::IsNullOrWhiteSpace($BuildLogPath)) {
        return $BuildLogPath
    }

    if (-not (Test-Path -LiteralPath $BuildLogPath)) {
        return $BuildLogPath
    }

    $lineCount = 0

    try {
        foreach ($line in [System.IO.File]::ReadLines($BuildLogPath)) {
            $lineCount++
        }
    }
    catch {
        LogWarn "빌드 로그 라인 수 계산 실패: $($_.Exception.Message)"
        $lineCount = 0
    }

    if ($ExitCode -eq 0) {
        $statusPrefix = "OK"
    }
    else {
        $statusPrefix = "FAIL"
    }

    $dir = Split-Path -Parent $BuildLogPath
    $leafName = Split-Path -Leaf $BuildLogPath
    $newLeafName = "{0}_{1}_{2}" -f $statusPrefix, $lineCount, $leafName
    $newPath = Join-Path $dir $newLeafName

    try {
        if ($BuildLogPath -ne $newPath) {
            if (Test-Path -LiteralPath $newPath) {
                Remove-Item -LiteralPath $newPath -Force
            }

            Rename-Item -LiteralPath $BuildLogPath -NewName $newLeafName -Force
        }

        return $newPath
    }
    catch {
        LogWarn "빌드 로그 파일명 변경 실패: $($_.Exception.Message)"
        return $BuildLogPath
    }
}

function InvokeNpmBuild {
    param(
        [string]$Version,
        [bool]$CopyLogToNewest = $false,
        [bool]$ThrowOnFailure = $false
    )

    EnsureDirectory -Path $LogDir

    $timestamp = GetTimestamp
    $buildLog = Join-Path $LogDir "build-$Version-$timestamp.txt"
    $script:LatestBuildLogPath = $buildLog

    LogInfo "Running npm build..."
    LogInfo "Build log: $buildLog"

    Push-Location $ProjectDir

    try {
        $env:NO_COLOR = "1"
        $env:FORCE_COLOR = "0"

        # Next.js는 --no-color 옵션을 지원하지 않으므로 npm run build만 실행한다.
        cmd /c "npm run build > `"$buildLog`" 2>&1"
        $buildExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    $buildLog = RenameBuildLogWithStatusAndLineCount -BuildLogPath $buildLog -ExitCode $buildExitCode
    $script:LatestBuildLogPath = $buildLog
    LogInfo "Build log finalized: $buildLog"

    if ($CopyLogToNewest) {
        EnsureDirectory -Path $NewestResultDIr
        CopyFileToNewestResultDir -SourcePath $buildLog
    }

    if ($buildExitCode -eq 0) {
        LogInfo "build 완료"
    }
    else {
        LogError "build 실패. 로그 확인: $buildLog"

        if ($ThrowOnFailure) {
            throw "build 실패. 로그 확인: $buildLog"
        }
    }

    return [int]$buildExitCode
}

function NPMBuildVerification {
    param([string]$Version)

    if (-not $script:NPMBuild) {
        LogWarn "NPM Build=false 상태입니다. build를 생략합니다."
        return
    }

    InvokeNpmBuild -Version $Version -CopyLogToNewest $false -ThrowOnFailure $true | Out-Null
}

function BackupProjectToZip {
    param([string]$Version)

    if (-not $BackupProjectToZip) {
        return
    }

    try {
        EnsureDirectory -Path $BuildZipDir

        $zipPath = Join-Path $BuildZipDir "peacebypiece-ui-$Version.zip"

        LogInfo "Creating backup zip: $zipPath"

        Push-Location $ProjectDir

        try {
            if (Test-Path -LiteralPath $zipPath) {
                Remove-Item -LiteralPath $zipPath -Force
            }

            tar -a -c -f $zipPath --exclude=node_modules --exclude=.next --exclude=.git --exclude=.tmp --exclude=.env.local --exclude=*.log .

            if ($LASTEXITCODE -ne 0) {
                LogWarn "백업 zip 생성 실패. git commit 결과에는 영향 없음."
            }
            elseif (Test-Path -LiteralPath $zipPath) {
                $script:LatestBackupZipPath = $zipPath
            }
        }
        finally {
            Pop-Location
        }
    }
    catch {
        LogWarn "백업 zip 생성 생략: $($_.Exception.Message)"
    }
}


function CopyFileToNewestResultDir {
    param([string]$SourcePath)

    if ([string]::IsNullOrWhiteSpace($SourcePath)) {
        return
    }

    if (-not (Test-Path -LiteralPath $SourcePath)) {
        LogWarn "Newest 복사 생략. 파일 없음: $SourcePath"
        return
    }

    $destinationPath = Join-Path $NewestResultDIr (Split-Path -Leaf $SourcePath)
    Copy-Item -LiteralPath $SourcePath -Destination $destinationPath -Force
    LogInfo "Newest copied: $destinationPath"
}

function PublishNewestResultFiles {
    EnsureDirectory -Path $NewestResultDIr

    # 기존 최신본은 모두 비우고 이번 처리 결과만 남긴다.
    Get-ChildItem -LiteralPath $NewestResultDIr -Force -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item -LiteralPath $_.FullName -Recurse -Force
    }

    if ($BackupProjectToZip) {
        CopyFileToNewestResultDir -SourcePath $script:LatestBackupZipPath
    }

    CopyFileToNewestResultDir -SourcePath $script:LatestRepoStatePath

    if ($script:NPMBuild) {
        CopyFileToNewestResultDir -SourcePath $script:LatestBuildLogPath
    }

    LogInfo "Newest result folder updated: $NewestResultDIr"
}


# ==========================================
# 7. 처리 완료 / 실패 파일 이동 함수
# ==========================================

function MoveInputFilesToArchive {
    param(
        [string]$DestinationRoot,
        [string]$Version,
        [bool]$IncludeTempFiles = $false
    )

    EnsureDirectory -Path $DestinationRoot

    $timestamp = GetTimestamp
    $safeVersion = if ($Version) { $Version -replace '[^0-9A-Za-z._-]', '_' } else { "unknown" }
    $target = Join-Path $DestinationRoot "patch-$safeVersion-$timestamp"

    EnsureDirectory -Path $target

    if ($IncludeTempFiles) {
        $filesToMove = @(Get-ChildItem -LiteralPath $PatchDownloadDir -File -ErrorAction SilentlyContinue | Where-Object {
            $_.Name -ne "desktop.ini"
        })
    }
    else {
        $filesToMove = @(GetPatchFilesInInput -InputPath $PatchDownloadDir)
    }

    foreach ($file in $filesToMove) {
        Move-Item -LiteralPath $file.FullName -Destination (Join-Path $target $file.Name) -Force
    }

    return $target
}

function MoveInputFilesToFailedArchive {
    param(
        [string]$Version,
        [string]$Reason
    )

    $target = MoveInputFilesToArchive -DestinationRoot $PatchFailedDir -Version $Version -IncludeTempFiles $true
    $reasonPath = Join-Path $target "fail-reason.txt"

    $message = @(
        "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
        "Version: $Version",
        "Reason: $Reason"
    ) -join "`r`n"

    [System.IO.File]::WriteAllText($reasonPath, $message, [System.Text.Encoding]::UTF8)
    LogError "Patch moved to failed archive: $target"
}


function MoveStaleTempFilesToFailedArchive {
    param(
        [string]$InputPath,
        [int]$MaxAgeSeconds
    )

    $tempFiles = @(GetTempDownloadFilesInInput -InputPath $InputPath)

    if ($tempFiles.Count -eq 0) {
        # 임시 파일이 모두 사라졌으면 추적 정보도 비운다.
        $script:TempFirstSeenAtByPath.Clear()
        return
    }

    $now = Get-Date
    $currentPathMap = @{}

    foreach ($file in $tempFiles) {
        $key = $file.FullName
        $currentPathMap[$key] = $true

        if (-not $script:TempFirstSeenAtByPath.ContainsKey($key)) {
            $script:TempFirstSeenAtByPath[$key] = $now
            LogWarn "임시 다운로드 파일 감지됨. 감지 시점부터 $MaxAgeSeconds초 동안 대기합니다: $($file.Name)"
        }
    }

    # 이미 사라진 임시 파일의 추적 정보 제거
    foreach ($key in @($script:TempFirstSeenAtByPath.Keys)) {
        if (-not $currentPathMap.ContainsKey($key)) {
            $script:TempFirstSeenAtByPath.Remove($key)
        }
    }

    $staleFiles = New-Object System.Collections.Generic.List[System.IO.FileInfo]

    foreach ($file in $tempFiles) {
        $key = $file.FullName
        $firstSeenAt = $script:TempFirstSeenAtByPath[$key]
        $elapsedSeconds = [int]($now - $firstSeenAt).TotalSeconds

        if ($elapsedSeconds -ge $MaxAgeSeconds) {
            $staleFiles.Add($file)
        }
        else {
            LogWarn "임시 다운로드 파일 대기 중... 경과 ${elapsedSeconds}초 / 제한 ${MaxAgeSeconds}초: $($file.Name)"
        }
    }

    if ($staleFiles.Count -eq 0) {
        return
    }

    EnsureDirectory -Path $PatchFailedDir

    $timestamp = GetTimestamp
    $target = Join-Path $PatchFailedDir "orphan-temp-$timestamp"
    EnsureDirectory -Path $target

    foreach ($file in $staleFiles) {
        $key = $file.FullName
        Move-Item -LiteralPath $file.FullName -Destination (Join-Path $target $file.Name) -Force
        $script:TempFirstSeenAtByPath.Remove($key)
    }

    $reasonPath = Join-Path $target "fail-reason.txt"
    $message = @(
        "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
        "Version: unknown",
        "Reason: commit-meta.md 없이 임시 다운로드 파일만 감지 후 $MaxAgeSeconds초 이상 남아 있어 정리했습니다."
    ) -join "`r`n"

    [System.IO.File]::WriteAllText($reasonPath, $message, [System.Text.Encoding]::UTF8)
    LogWarn "Stale temp files moved to failed archive: $target"
}


function ExpandIncomingPatchZipIfReady {
    param([string]$InputPath)

    # ChatGPT가 제공하는 patch zip을 감지하면 incoming_patch 바로 아래에 압축 해제하고 zip은 삭제한다.
    # 이후 즉시 return하여 다음 루프에서 commit-meta.md 기준 기존 처리 흐름으로 재진입한다.
    $zipFiles = @(Get-ChildItem -LiteralPath $InputPath -File -Filter "peacebypiece-patch-*.zip" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime)

    if ($zipFiles.Count -eq 0) {
        return $false
    }

    $zipFile = $zipFiles[0]
    LogInfo "Patch zip 감지됨: $($zipFile.Name)"

    WaitInputStable -InputPath $InputPath

    try {
        Expand-Archive -LiteralPath $zipFile.FullName -DestinationPath $InputPath -Force -ErrorAction Stop
    }
    catch {
        throw "patch zip 압축 해제 실패: $($zipFile.FullName) / $($_.Exception.Message)"
    }

    # Expand-Archive는 외부 실행 파일이 아니므로 $LASTEXITCODE로 성공/실패를 판단하지 않는다.
    # 이전 git/npm 명령의 LASTEXITCODE가 남아 있으면 정상 압축 해제 후에도 실패로 오판할 수 있다.
    $extractedMetaPath = Join-Path $InputPath "commit-meta.md"
    if (-not (Test-Path -LiteralPath $extractedMetaPath)) {
        throw "patch zip 압축 해제 후 commit-meta.md를 찾지 못했습니다: $($zipFile.FullName)"
    }

    Remove-Item -LiteralPath $zipFile.FullName -Force
    LogInfo "Patch zip 압축 해제 및 삭제 완료: $($zipFile.Name)"

    return $true
}


# ==========================================
# 8. 패치 1회 처리 함수
# ==========================================

function ProcessOnePatchIfReady {
    $script:AllowPackageJsonPatch = $false

    if (ExpandIncomingPatchZipIfReady -InputPath $PatchDownloadDir) {
        return
    }

    $metaPath = Join-Path $PatchDownloadDir "commit-meta.md"

    # C 스타일로 보면:
    # if (!exists(commit_meta)) return;
    if (-not (Test-Path -LiteralPath $metaPath)) {
        # commit-meta.md가 없으면 patch로 판단하지 않는다.
        # 단, 브라우저/Drive 임시 파일이 5분 이상 혼자 남아 있으면 failed_patch로 정리한다.
        MoveStaleTempFilesToFailedArchive -InputPath $PatchDownloadDir -MaxAgeSeconds $PatchWaitTimeoutSeconds
        return
    }

    LogInfo "commit-meta.md 감지됨"

    WaitInputStable -InputPath $PatchDownloadDir

    $version = "unknown"

    try {
        $meta = AssertMetaFormat -MetaPath $metaPath
        $version = $meta.Version
        $summary = $meta.Summary
        $description = GetDescriptionForGit -Content $meta.Content
        $script:AllowPackageJsonPatch = TestPackageJsonPatchAllowedFromMeta -Content $meta.Content

        if ($script:AllowPackageJsonPatch) {
            LogWarn "commit-meta.md에서 package.json / package-lock.json 변경 허용을 감지했습니다."
        }

        $modifiedFiles = NormalizeMetaPathItems -Items (GetSectionItemsFromMeta -Content $meta.Content -SectionName "수정 파일 목록")
        $addedFiles = NormalizeMetaPathItems -Items (GetSectionItemsFromMeta -Content $meta.Content -SectionName "추가 파일 목록")
        $deleteFiles = NormalizeMetaPathItems -Items (GetSectionItemsFromMeta -Content $meta.Content -SectionName "삭제 파일 목록")

        AssertPatchPathListSafe `
            -ModifiedRelativePaths $modifiedFiles `
            -AddedRelativePaths $addedFiles `
            -DeleteRelativePaths $deleteFiles
    }
    catch {
        # commit-meta 형식 오류, 보호 파일 수정 시도, 위험 경로 등은 사용자 개입 없이 failed_patch로 정리한다.
        MoveInputFilesToFailedArchive -Version $version -Reason "commit-meta 검증 실패: $($_.Exception.Message)"
        return
    }

    AssertProjectReady

    $requiredFiles = New-Object System.Collections.Generic.List[string]

    foreach ($item in $modifiedFiles) {
        $requiredFiles.Add($item)
    }

    foreach ($item in $addedFiles) {
        $requiredFiles.Add($item)
    }

    # 수정/추가 파일이 전혀 없고 삭제 파일만 있는 패치도 허용한다.
    # 단, 수정/추가 목록에 적힌 필수 파일이 부족하면 5분 동안만 기다린다.
    # v8부터 임시 다운로드 파일은 현재 필수 파일이 아닌 경우 정상 patch 처리를 막지 않는다.
    $waitResult = WaitUntilRequiredPatchFilesReady `
        -InputPath $PatchDownloadDir `
        -RequiredRelativePaths $requiredFiles `
        -TimeoutSeconds $PatchWaitTimeoutSeconds

    if (-not $waitResult.Success) {
        MoveInputFilesToFailedArchive -Version $version -Reason $waitResult.Reason
        return
    }

    LogInfo "Patch version: $version"
    LogInfo "Patch summary: $summary"

    CopyRequiredPatchFilesToProject -InputPath $PatchDownloadDir -RequiredRelativePaths $requiredFiles
    CopyCommitMetaToProject -MetaPath $metaPath
    DeleteFilesFromProject -DeleteRelativePaths $deleteFiles

    # 순서 중요:
    # 1) git commit/push 먼저
    # 2) build는 검증용
    # 3) 백업 zip은 보조 산출물
    CommitAndPush -Summary $summary -Description $description -Version $version

    try {
        NPMBuildVerification -Version $version
    }
    catch {
        LogWarn $_.Exception.Message
        LogWarn "build 실패는 commit/push를 되돌리지 않습니다. 다음 패치에서 수정하세요."
    }

    BackupProjectToZip -Version $version

    PublishNewestResultFiles

    MoveInputFilesToArchive -DestinationRoot $PatchSuccessDir -Version $version | Out-Null

    LogInfo "Patch processed: $version"
}


