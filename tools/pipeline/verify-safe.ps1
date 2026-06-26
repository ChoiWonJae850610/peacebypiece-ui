param(
    [ValidateSet("system-admin-storage", "id-control-roadmap", "roadmap-development-contract", "system-admin-internal-access", "repository-cleanup", "source-architecture-cleanup", "automation-infrastructure", "workspace-commonization", "functions-automation")]
    [string]$Profile = "system-admin-storage",
    [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"

$PipelineCommonPath = Join-Path $PSScriptRoot "pipeline-common.ps1"
if (-not (Test-Path -LiteralPath $PipelineCommonPath)) {
    throw "Pipeline common script not found: $PipelineCommonPath"
}

. $PipelineCommonPath

function InvokeSafeGit {
    param([string[]]$Arguments)

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        return @(git `
            -c color.ui=false `
            -c core.pager=cat `
            -c core.quotepath=false `
            -c i18n.logOutputEncoding=utf-8 `
            -C $ProjectDir @Arguments 2>&1)
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
}

function TestGitNoiseLine {
    param([string]$Line)

    return $Line -match '^\s*warning:\s+in the working copy of '
}

function GetChangedFiles {
    $names = New-Object System.Collections.Generic.List[string]
    foreach ($line in (InvokeSafeGit -Arguments @("diff", "--name-only"))) {
        if (-not [string]::IsNullOrWhiteSpace([string]$line) -and -not (TestGitNoiseLine -Line ([string]$line))) {
            $names.Add([string]$line)
        }
    }
    foreach ($line in (InvokeSafeGit -Arguments @("diff", "--cached", "--name-only"))) {
        if (-not [string]::IsNullOrWhiteSpace([string]$line) -and -not (TestGitNoiseLine -Line ([string]$line))) {
            $names.Add([string]$line)
        }
    }
    foreach ($line in (InvokeSafeGit -Arguments @("ls-files", "--others", "--exclude-standard"))) {
        if (-not [string]::IsNullOrWhiteSpace([string]$line) -and -not (TestGitNoiseLine -Line ([string]$line))) {
            $names.Add([string]$line)
        }
    }
    return @($names | Sort-Object -Unique)
}

function GetGitSingleLine {
    param([string[]]$Arguments)

    $output = @(InvokeSafeGit -Arguments $Arguments)
    if ($LASTEXITCODE -ne 0 -or $output.Count -eq 0) {
        return ""
    }

    return [string]($output | Where-Object { -not (TestGitNoiseLine -Line ([string]$_)) } | Select-Object -First 1)
}

function GetSha256Hex {
    param([byte[]]$Bytes)

    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $hash = $sha256.ComputeHash($Bytes)
        return -join ($hash | ForEach-Object { $_.ToString("x2") })
    }
    finally {
        $sha256.Dispose()
    }
}

function GetTextSha256Hex {
    param([string]$Text)

    return GetSha256Hex -Bytes ([System.Text.Encoding]::UTF8.GetBytes($Text))
}

function GetFileSha256Hex {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return "missing"
    }

    return GetSha256Hex -Bytes ([System.IO.File]::ReadAllBytes($Path))
}

function GetChangedFingerprint {
    param([string[]]$ChangedFiles)

    $parts = New-Object System.Collections.Generic.List[string]
    foreach ($path in ($ChangedFiles | Sort-Object)) {
        $normalized = $path -replace '\\', '/'
        $fullPath = Join-Path $ProjectDir $normalized
        $parts.Add("$normalized=$((GetFileSha256Hex -Path $fullPath))")
    }

    $diffOutput = @(InvokeSafeGit -Arguments @("diff", "--binary", "--no-ext-diff"))
    foreach ($line in $diffOutput) {
        if (-not (TestGitNoiseLine -Line ([string]$line))) {
            $parts.Add([string]$line)
        }
    }
    $cachedDiffOutput = @(InvokeSafeGit -Arguments @("diff", "--cached", "--binary", "--no-ext-diff"))
    foreach ($line in $cachedDiffOutput) {
        if (-not (TestGitNoiseLine -Line ([string]$line))) {
            $parts.Add([string]$line)
        }
    }

    return GetTextSha256Hex -Text ($parts -join "`n")
}

function TestTextFile {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return $false
    }

    $item = Get-Item -LiteralPath $Path
    if ($item.Length -gt 1048576) {
        return $false
    }

    $stream = [System.IO.File]::OpenRead($Path)
    try {
        $buffer = New-Object byte[] ([Math]::Min(4096, $item.Length))
        $read = $stream.Read($buffer, 0, $buffer.Length)
        for ($i = 0; $i -lt $read; $i++) {
            if ($buffer[$i] -eq 0) {
                return $false
            }
        }
        return $true
    }
    finally {
        $stream.Dispose()
    }
}

function TestSafeExamplePath {
    param([string]$RelativePath)

    $lower = $RelativePath.ToLowerInvariant() -replace '\\', '/'
    $leaf = [System.IO.Path]::GetFileName($lower)
    if ($lower -match '(^|/)(docs|tests|test|__tests__|fixtures|mocks|examples?|audits|보관문서)/') {
        return $true
    }
    return $leaf -match '(example|sample|placeholder|dummy|test|mock|fixture|contract)'
}

function FindSensitiveChangedFiles {
    param([string[]]$ChangedFiles)

    $suspicious = New-Object System.Collections.Generic.List[string]
    $patterns = @(
        "-----BEGIN (RSA |DSA |EC |OPENSSH |)PRIVATE KEY-----",
        "(?i)\bBearer\s+[A-Za-z0-9._~+/=-]{32,}",
        "\bAKIA[0-9A-Z]{16}\b",
        "(?i)\bcloudflare[_-]?(api[_-]?)?token\b\s*[:=]\s*[`"'][A-Za-z0-9_\-\.]{24,}[`"']",
        "(?i)(postgres|postgresql|mysql|mongodb)://[^/\s:@]+:[^@\s]+@",
        "(?i)\b(secret|api[_-]?key|access[_-]?token|auth[_-]?token|password|passwd|pwd|credential)\b\s*[:=]\s*[`"'](?!\s*(example|sample|placeholder|dummy|test|mock|changeme|your-|<))[A-Za-z0-9_\-./+=@$!%*#?&]{16,}[`"']",
        "(?i)https?://[^/\s]*(prod|production)[^/\s]*\."
    )

    foreach ($relativePath in $ChangedFiles) {
        if (TestSafeExamplePath -RelativePath $relativePath) {
            continue
        }

        $fullPath = Join-Path $ProjectDir $relativePath
        if (-not (TestTextFile -Path $fullPath)) {
            continue
        }

        $content = Get-Content -LiteralPath $fullPath -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
        foreach ($pattern in $patterns) {
            if ($content -match $pattern) {
                $suspicious.Add($relativePath)
                break
            }
        }
    }

    return @($suspicious | Sort-Object -Unique)
}

function InvokeCheck {
    param(
        [string]$Name,
        [string]$Command,
        [string[]]$Arguments
    )

    Write-Host "[RUN] $Name"
    $commandLine = "$Command $($Arguments -join ' ')"
    if ($CheckOnly) {
        Write-Host "      $commandLine"
        if ($Command -in @("node", "npm")) {
            $targetFile = if ($Command -eq "node" -and $Arguments.Count -gt 0) { Join-Path $ProjectDir $Arguments[0] } else { "" }
            if ($targetFile -and -not (Test-Path -LiteralPath $targetFile -PathType Leaf)) {
                return [pscustomobject]@{ Name = $Name; CommandLine = $commandLine; Passed = $false; Skipped = $true; ExitCode = 2; FindingCount = ""; HighRiskCount = ""; OutputSummary = "missing test file" }
            }
        }
        return [pscustomobject]@{ Name = $Name; CommandLine = $commandLine; Passed = $true; Skipped = $true; ExitCode = 0; FindingCount = ""; HighRiskCount = ""; OutputSummary = "check-only" }
    }

    $resolved = Get-Command $Command -ErrorAction SilentlyContinue
    if ($null -eq $resolved) {
        Write-Host "[FAIL] command not found: $Command" -ForegroundColor Red
        return [pscustomobject]@{ Name = $Name; CommandLine = $commandLine; Passed = $false; Skipped = $false; ExitCode = 127; FindingCount = ""; HighRiskCount = ""; OutputSummary = "command not found" }
    }

    Push-Location $ProjectDir
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = @(& $resolved.Source @Arguments 2>&1)
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
        Pop-Location
    }

    foreach ($line in $output) {
        Write-Host ([string]$line)
    }

    $passed = ($exitCode -eq 0)
    $findingCount = ""
    $highRiskCount = ""
    $outputText = ($output | ForEach-Object { [string]$_ }) -join "`n"
    if ($outputText -match 'WAFL mutation audit completed:\s*(\d+)\s+finding\(s\),\s*(\d+)\s+high-risk') {
        $findingCount = $matches[1]
        $highRiskCount = $matches[2]
    }
    Write-Host ("[{0}] {1}" -f $(if ($passed) { "PASS" } else { "FAIL" }), $Name)
    return [pscustomobject]@{ Name = $Name; CommandLine = $commandLine; Passed = $passed; Skipped = $false; ExitCode = $exitCode; FindingCount = $findingCount; HighRiskCount = $highRiskCount; OutputSummary = "" }
}

function InvokePowerShellParseCheck {
    $psFiles = @(
        "tools/pipeline/peacebypiece-auto-pipeline.ps1",
        "tools/pipeline/pipeline-common.ps1",
        "tools/pipeline/verify-safe.ps1",
        "tools/pipeline/finish-version.ps1",
        "tools/pipeline/approved-workflow.ps1"
    )

    $failed = New-Object System.Collections.Generic.List[string]
    foreach ($relativePath in $psFiles) {
        $path = Join-Path $ProjectDir $relativePath
        if (-not (Test-Path -LiteralPath $path)) {
            continue
        }
        $errors = $null
        [System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$null, [ref]$errors) | Out-Null
        if ($errors) {
            $failed.Add($relativePath)
        }
    }

    if ($failed.Count -gt 0) {
        Write-Host "[FAIL] PowerShell parse check: $($failed -join ', ')" -ForegroundColor Red
        return [pscustomobject]@{ Name = "PowerShell parse check"; Passed = $false; Skipped = $false; ExitCode = 1 }
    }

    Write-Host "[PASS] PowerShell parse check"
    return [pscustomobject]@{ Name = "PowerShell parse check"; Passed = $true; Skipped = $false; ExitCode = 0 }
}

function InvokeRepositoryCleanupCheck {
    $failures = New-Object System.Collections.Generic.List[string]
    $legacyReportPath = "reports/" + "functions-pdf-contract-latest.json"
    $missingSeedPatchPath = "db/schema/" + "patch_0_10_48_system_standards_seed_refresh.sql"
    $docsRoot = Join-Path $ProjectDir "docs"

    function FindRepositoryCleanupText {
        param(
            [string]$Root,
            [string]$Pattern
        )

        $path = Join-Path $ProjectDir $Root
        if (-not (Test-Path -LiteralPath $path)) {
            return @()
        }
        if (Test-Path -LiteralPath $path -PathType Leaf) {
            return @(Select-String -LiteralPath $path -Pattern $Pattern -SimpleMatch -ErrorAction SilentlyContinue)
        }
        $files = @(Get-ChildItem -LiteralPath $path -Recurse -File -ErrorAction SilentlyContinue)
        if ($files.Count -eq 0) {
            return @()
        }
        return @(Select-String -LiteralPath $files.FullName -Pattern $Pattern -SimpleMatch -ErrorAction SilentlyContinue)
    }

    function GetRepositoryCleanupDocsCount {
        param([string]$RelativeRoot)

        $path = Join-Path $ProjectDir $RelativeRoot
        if (-not (Test-Path -LiteralPath $path)) {
            return 0
        }
        return @(Get-ChildItem -LiteralPath $path -Recurse -File -Filter "*.md" -ErrorAction SilentlyContinue).Count
    }

    function TestRepositoryCleanupMarkdownLinks {
        param([string[]]$RelativePaths)

        $brokenLinks = New-Object System.Collections.Generic.List[string]
        foreach ($relativePath in $RelativePaths) {
            $normalized = $relativePath -replace '\\', '/'
            if ($normalized -notmatch '\.md$') {
                continue
            }
            $fullPath = Join-Path $ProjectDir $normalized
            if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
                continue
            }

            $content = Get-Content -LiteralPath $fullPath -Raw -Encoding UTF8
            $matches = [regex]::Matches($content, '\[[^\]]+\]\(([^)]+\.md(?:#[^)]+)?)\)')
            foreach ($match in $matches) {
                $target = [string]$match.Groups[1].Value
                if ($target -match '^[a-z]+://' -or $target.StartsWith('#') -or $target.StartsWith('mailto:')) {
                    continue
                }

                $targetPath = ($target -split '#', 2)[0]
                if ([string]::IsNullOrWhiteSpace($targetPath)) {
                    continue
                }

                $baseDir = Split-Path -Parent $fullPath
                $resolved = Join-Path $baseDir $targetPath
                if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
                    $brokenLinks.Add("$normalized -> $target")
                }
            }
        }

        return @($brokenLinks | Sort-Object -Unique)
    }

    $activeReportReferenceRoots = @("app", "components", "features", "lib", "scripts", "tests", "cloudflare", "package.json", "README.md", "docs/README.md")
    foreach ($root in $activeReportReferenceRoots) {
        $matches = @(FindRepositoryCleanupText -Root $root -Pattern $legacyReportPath)
        if ($matches.Count -gt 0) {
            $failures.Add("legacy report reference remains under $root")
        }
    }

    $activeSqlReferenceRoots = @("app", "components", "features", "lib", "scripts", "tests", "README.md", "docs/README.md", "db/README.md")
    foreach ($root in $activeSqlReferenceRoots) {
        $matches = @(FindRepositoryCleanupText -Root $root -Pattern $missingSeedPatchPath)
        if ($matches.Count -gt 0) {
            $failures.Add("missing SQL patch guidance remains under $root")
        }
    }

    $trackedFiles = @(InvokeSafeGit -Arguments @("ls-files") | ForEach-Object { ([string]$_) -replace '\\', '/' })
    if ($trackedFiles -notcontains "db/seed/system_standards_seed.sql") {
        $failures.Add("canonical system standards seed is missing")
    }

    $canonicalDuplicateFiles = @(Get-ChildItem -LiteralPath (Join-Path $ProjectDir "docs") -Recurse -File -Filter "wafl-ui-system.md" -ErrorAction SilentlyContinue)
    $removedDuplicateFiles = @(Get-ChildItem -LiteralPath (Join-Path $ProjectDir "docs") -Recurse -File -Filter "wafl-ui-system-0.19.50.md" -ErrorAction SilentlyContinue)
    if ($canonicalDuplicateFiles.Count -eq 0) {
        $failures.Add("canonical WAFL UI system document missing")
    }
    if ($removedDuplicateFiles.Count -gt 0) {
        $failures.Add("duplicate WAFL UI system suffix document still exists")
    }

    if (Test-Path -LiteralPath (Join-Path $ProjectDir $legacyReportPath) -PathType Leaf) {
        $failures.Add("legacy functions PDF report still exists")
    }

    $requiredCanonicalDocNames = @(
        "testing-and-automation.md",
        "simulator.md",
        "wafl-ui-system.md",
        "workorder.md",
        "material-order.md",
        "modal-and-focus.md"
    )
    foreach ($fileName in $requiredCanonicalDocNames) {
        $matches = @(Get-ChildItem -LiteralPath $docsRoot -Recurse -File -Filter $fileName -ErrorAction SilentlyContinue | Where-Object {
            (($_.FullName -replace '\\', '/') -match '/docs/.+/')
        })
        if ($matches.Count -eq 0) {
            $failures.Add("required canonical doc missing: $fileName")
        }
    }

    $movedArchiveTargets = @(
        @{ Directory = "qa-history"; FileName = "playwright-environment-setup-0.19.90.md" },
        @{ Directory = "qa-history"; FileName = "project-test-simulator-structure-0.23.72.md" },
        @{ Directory = "completed-features"; FileName = "wafl-ui-catalog-0.20.99.md" },
        @{ Directory = "qa-history"; FileName = "pipeline-background-watcher-0.23.85.md" },
        @{ Directory = "workorder"; FileName = "workorder-save-serialization-0.23.37.md" },
        @{ Directory = "material-order"; FileName = "material-order-line-immediate-persistence-0.23.47.md" },
        @{ Directory = "modal"; FileName = "modal-focus-input-policy-0.22.08.md" }
    )
    foreach ($target in $movedArchiveTargets) {
        $matches = @(Get-ChildItem -LiteralPath $docsRoot -Recurse -File -Filter $target.FileName -ErrorAction SilentlyContinue | Where-Object {
            (($_.FullName -replace '\\', '/') -match "/$([regex]::Escape($target.Directory))/$([regex]::Escape($target.FileName))$")
        })
        if ($matches.Count -eq 0) {
            $failures.Add("expected archive target missing: $($target.Directory)/$($target.FileName)")
        }
    }

    $removedRootDocs = @(
        "docs/playwright-environment-setup-0.19.90.md",
        "docs/project-test-simulator-structure-0.23.72.md",
        "docs/wafl-ui-catalog-0.20.99.md",
        "docs/pipeline-background-watcher-0.23.85.md",
        "docs/build-fix-0.20.38.md",
        "docs/codex-handoff-0.23.99.md",
        "docs/workorder-save-serialization-0.23.37.md",
        "docs/material-order-line-immediate-persistence-0.23.47.md",
        "docs/modal-focus-input-policy-0.22.08.md",
        "docs/full-smoke-qa-0.20.09.md"
    )
    foreach ($relativePath in $removedRootDocs) {
        if (Test-Path -LiteralPath (Join-Path $ProjectDir $relativePath) -PathType Leaf) {
            $failures.Add("old root doc still exists: $relativePath")
        }
    }

    $docsTotalCount = GetRepositoryCleanupDocsCount -RelativeRoot "docs"
    $docsRootCount = @(Get-ChildItem -LiteralPath $docsRoot -File -Filter "*.md" -ErrorAction SilentlyContinue).Count
    if ($docsTotalCount -gt 662) {
        $failures.Add("docs total count did not stay within cleanup target: $docsTotalCount")
    }
    if ($docsRootCount -gt 206) {
        $failures.Add("docs root count did not decrease to cleanup target: $docsRootCount")
    }

    $deletedDocReferences = New-Object System.Collections.Generic.List[string]
    $deletedDocs = @(
        "build-fix-0.20.38.md",
        "build-fix-0.20.44.md",
        "build-fix-0.20.58.md",
        "build-fix-0.20.59.md",
        "build-fix-modal-focus-0.20.62.md",
        "dev-test-console-audit-target-build-fix-0.23.79.md",
        "wafl-list-card-menu-build-fix-0.21.64.md",
        "codex-handoff-0.23.99.md",
        "workorder-mobile-structure-0.20.28.md",
        "workorder-mobile-structure-0.20.29.md",
        "material-order-mobile-structure-0.20.30.md",
        "material-order-mobile-structure-0.20.31.md",
        "full-smoke-qa-0.20.09.md"
    )
    foreach ($fileName in $deletedDocs) {
        $matches = @(FindRepositoryCleanupText -Root "docs" -Pattern $fileName | Where-Object {
            (([string]$_.Path) -replace '\\', '/') -notlike "*/docs/audits/docs-archive-manifest-0.24.11.md"
        })
        if ($matches.Count -gt 0) {
            $deletedDocReferences.Add($fileName)
        }
    }
    if ($deletedDocReferences.Count -gt 0) {
        $failures.Add("deleted doc reference remains outside manifest: $($deletedDocReferences -join ', ')")
    }

    $changedMarkdownLinks = @(TestRepositoryCleanupMarkdownLinks -RelativePaths $changedFiles)
    if ($changedMarkdownLinks.Count -gt 0) {
        $failures.Add("broken markdown link in changed docs: $($changedMarkdownLinks -join '; ')")
    }

    $oldArchiveSlugs = @(
        "81_wafl-a-type-workorder-production-sync-gate.md",
        "82_wafl-a-type-review-request-production-service-code-forward.md",
        "83_wafl-a-type-workorder-review-reject-regression.md",
        "84_wafl-a-type-workorder-service-code-screen-action-audit.md",
        "85_wafl-a-type-workorder-service-code-first-wire.md",
        "86_wafl-a-type-workorder-service-code-workflow-wire.md",
        "87_wafl-a-type-factory-order-replace-save.md",
        "88_wafl-a-type-production-current-table-sql-design.md",
        "89_wafl-a-type-production-current-table-schema-implementation.md"
    )
    foreach ($slug in $oldArchiveSlugs) {
        $matches = @(FindRepositoryCleanupText -Root "docs" -Pattern $slug)
        if ($matches.Count -gt 0) {
            $failures.Add("old archive link slug remains: $slug")
        }
    }

    foreach ($prefix in @("81-", "82-", "83-", "84-", "85-", "86-", "87-", "88-", "89-")) {
        if (-not ($trackedFiles | Where-Object { $_ -match "/$([regex]::Escape($prefix)).+\.md$" })) {
            $failures.Add("archive target with prefix $prefix is missing")
        }
    }

    if ($failures.Count -gt 0) {
        Write-Host "[FAIL] repository cleanup checks" -ForegroundColor Red
        foreach ($failure in $failures) { Write-Host " - $failure" }
        return [pscustomobject]@{ Name = "repository cleanup checks"; Passed = $false; Skipped = $false; ExitCode = 1 }
    }

    Write-Host "[PASS] repository cleanup checks"
    return [pscustomobject]@{ Name = "repository cleanup checks"; Passed = $true; Skipped = $false; ExitCode = 0 }
}

$profileCommands = @{
    "system-admin-storage" = @(
        @{ Name = "system storage usage contract"; Command = "node"; Arguments = @("tests/system-storage-usage-real-data-contract.mjs") },
        @{ Name = "system dashboard contract"; Command = "node"; Arguments = @("tests/system-dashboard-real-data-contract.mjs") },
        @{ Name = "system billing contract"; Command = "node"; Arguments = @("tests/system-billing-real-data-contract.mjs") },
        @{ Name = "internal system routes contract"; Command = "node"; Arguments = @("tests/internal-system-routes-contract.mjs") },
        @{ Name = "dev/test context system admin contract"; Command = "node"; Arguments = @("tests/dev-test-context-system-admin-contract.mjs") }
    );
    "id-control-roadmap" = @(
        @{ Name = "internal system routes contract"; Command = "node"; Arguments = @("tests/internal-system-routes-contract.mjs") },
        @{ Name = "dev/test context system admin contract"; Command = "node"; Arguments = @("tests/dev-test-context-system-admin-contract.mjs") },
        @{ Name = "simulator onboarding fixture contract"; Command = "node"; Arguments = @("tests/simulator-onboarding-fixture-contract.mjs") }
    );
    "roadmap-development-contract" = @(
        @{ Name = "roadmap development contract"; Command = "node"; Arguments = @("tests/roadmap-development-contract.mjs") },
        @{ Name = "internal system routes contract"; Command = "node"; Arguments = @("tests/internal-system-routes-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") },
        @{ Name = "pipeline repo state publication contract"; Command = "node"; Arguments = @("tests/pipeline-repo-state-publication-contract.mjs") }
    );
    "system-admin-internal-access" = @(
        @{ Name = "system admin internal access contract"; Command = "node"; Arguments = @("tests/system-admin-internal-access-contract.mjs") },
        @{ Name = "internal system routes contract"; Command = "node"; Arguments = @("tests/internal-system-routes-contract.mjs") },
        @{ Name = "dev/test context system admin contract"; Command = "node"; Arguments = @("tests/dev-test-context-system-admin-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") }
    );
    "repository-cleanup" = @(
        @{ Name = "functions PDF contract"; Command = "node"; Arguments = @("tests/functions-pdf-contract.mjs") }
    );
    "source-architecture-cleanup" = @(
        @{ Name = "source architecture cleanup contract"; Command = "node"; Arguments = @("tests/source-architecture-cleanup-contract.mjs") },
        @{ Name = "roadmap development contract"; Command = "node"; Arguments = @("tests/roadmap-development-contract.mjs") },
        @{ Name = "functions PDF contract"; Command = "node"; Arguments = @("tests/functions-pdf-contract.mjs") }
    );
    "automation-infrastructure" = @(
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") },
        @{ Name = "pipeline repo state publication contract"; Command = "node"; Arguments = @("tests/pipeline-repo-state-publication-contract.mjs") }
    );
    "workspace-commonization" = @(
        @{ Name = "workspace commonization contract"; Command = "node"; Arguments = @("tests/workspace-commonization-contract.mjs") },
        @{ Name = "WAFL UI foundation contract"; Command = "node"; Arguments = @("tests/wafl-ui-foundation-contract.mjs") },
        @{ Name = "customer workspace compact dashboard contract"; Command = "node"; Arguments = @("tests/customer-workspace-compact-dashboard-contract.mjs") },
        @{ Name = "roadmap development contract"; Command = "node"; Arguments = @("tests/roadmap-development-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") }
    );
    "functions-automation" = @(
        @{ Name = "functions catalog structure contract"; Command = "node"; Arguments = @("tests/functions-catalog-structure-contract.mjs") },
        @{ Name = "functions automation coverage contract"; Command = "node"; Arguments = @("tests/functions-automation-coverage-contract.mjs") },
        @{ Name = "functions storage contract"; Command = "node"; Arguments = @("tests/functions-storage-contract.mjs") },
        @{ Name = "functions environment audit contract"; Command = "node"; Arguments = @("tests/functions-environment-audit-contract.mjs") },
        @{ Name = "functions PDF contract"; Command = "node"; Arguments = @("tests/functions-pdf-contract.mjs") },
        @{ Name = "simulator attachment manifest contract"; Command = "node"; Arguments = @("tests/simulator-attachment-manifest-contract.mjs") },
        @{ Name = "simulator attachment lifecycle contract"; Command = "node"; Arguments = @("tests/simulator-attachment-lifecycle-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") }
    )
}

$results = New-Object System.Collections.Generic.List[object]
$changedFiles = @(GetChangedFiles)
$branch = GetGitSingleLine -Arguments @("branch", "--show-current")
$headHash = GetGitSingleLine -Arguments @("rev-parse", "HEAD")
$changedFingerprint = GetChangedFingerprint -ChangedFiles $changedFiles

Write-Host "PeaceByPiece safe verification"
Write-Host "Profile: $Profile"
Write-Host "CheckOnly: $CheckOnly"
Write-Host "Project: $ProjectDir"
Write-Host "Branch: $branch"
Write-Host "HEAD: $headHash"
Write-Host "ChangedFingerprint: $changedFingerprint"
Write-Host ""

$diffCheck = InvokeCheck -Name "git diff --check" -Command "git" -Arguments @("-C", $ProjectDir, "diff", "--check")
$results.Add($diffCheck)
$results.Add((InvokePowerShellParseCheck))

$packageChanges = @($changedFiles | Where-Object { $_ -in @("package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock") })
if ($packageChanges.Count -gt 0) {
    Write-Host "[FAIL] package/lockfile changed: $($packageChanges -join ', ')" -ForegroundColor Red
    $results.Add([pscustomobject]@{ Name = "package/lockfile unchanged"; Passed = $false; Skipped = $false; ExitCode = 1 })
}
else {
    Write-Host "[PASS] package/lockfile unchanged"
    $results.Add([pscustomobject]@{ Name = "package/lockfile unchanged"; Passed = $true; Skipped = $false; ExitCode = 0 })
}

$migrationChanges = @($changedFiles | Where-Object { $_ -match '^(db/migrations/|db/schema/|.*migration.*\.sql$)' })
if ($migrationChanges.Count -gt 0) {
    Write-Host "[FAIL] unexpected DB migration/schema changes: $($migrationChanges -join ', ')" -ForegroundColor Red
    $results.Add([pscustomobject]@{ Name = "DB migration unchanged"; Passed = $false; Skipped = $false; ExitCode = 1 })
}
else {
    Write-Host "[PASS] DB migration unchanged"
    $results.Add([pscustomobject]@{ Name = "DB migration unchanged"; Passed = $true; Skipped = $false; ExitCode = 0 })
}

$sensitiveFiles = @(FindSensitiveChangedFiles -ChangedFiles $changedFiles)
if ($sensitiveFiles.Count -gt 0) {
    Write-Host "[FAIL] suspicious secret/production value paths:" -ForegroundColor Red
    foreach ($path in $sensitiveFiles) { Write-Host " - $path" }
    $results.Add([pscustomobject]@{ Name = "secret/production scan"; Passed = $false; Skipped = $false; ExitCode = 1 })
}
else {
    Write-Host "[PASS] secret/production scan"
    $results.Add([pscustomobject]@{ Name = "secret/production scan"; Passed = $true; Skipped = $false; ExitCode = 0 })
}

$results.Add((InvokeCheck -Name "npm run build" -Command "npm" -Arguments @("run", "build")))
$results.Add((InvokeCheck -Name "npm run audit:wafl-mutations" -Command "npm" -Arguments @("run", "audit:wafl-mutations")))

if ($Profile -eq "repository-cleanup") {
    $results.Add((InvokeRepositoryCleanupCheck))
}

foreach ($commandSpec in $profileCommands[$Profile]) {
    $results.Add((InvokeCheck -Name $commandSpec.Name -Command $commandSpec.Command -Arguments $commandSpec.Arguments))
}

$failedResults = @($results | Where-Object { -not $_.Passed })
$status = if ($CheckOnly) { "CHECK_ONLY" } elseif ($failedResults.Count -eq 0) { "PASS" } else { "FAIL" }

EnsureDirectory -Path $RepoStatusDir
$resultPath = Join-Path $RepoStatusDir ("verify-safe-{0}-{1}.txt" -f $Profile, (GetTimestamp))
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("VERIFY_SAFE_RESULT: $status")
$lines.Add("GeneratedAt: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$lines.Add("ProjectDir: $ProjectDir")
$lines.Add("Branch: $branch")
$lines.Add("HeadHash: $headHash")
$lines.Add("Profile: $Profile")
$lines.Add("CheckOnly: $CheckOnly")
$lines.Add("ChangedFingerprint: $changedFingerprint")
$lines.Add("ExecutedAt: $(Get-Date -Format 'o')")
$lines.Add("")
$lines.Add("ChangedFiles:")
if ($changedFiles.Count -eq 0) { $lines.Add("(none)") } else { foreach ($path in $changedFiles) { $lines.Add($path) } }
$lines.Add("")
$lines.Add("Results:")
foreach ($result in $results) {
    $lines.Add(("{0}: Passed={1}; Skipped={2}; ExitCode={3}; Command={4}; FindingCount={5}; HighRiskCount={6}; Summary={7}" -f $result.Name, $result.Passed, $result.Skipped, $result.ExitCode, $result.CommandLine, $result.FindingCount, $result.HighRiskCount, $result.OutputSummary))
}
[System.IO.File]::WriteAllLines($resultPath, $lines, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "VERIFY_SAFE_RESULT: $status"
Write-Host "Result file: $resultPath"

if ($failedResults.Count -gt 0) {
    exit 1
}

exit 0
