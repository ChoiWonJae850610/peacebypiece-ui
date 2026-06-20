param(
    [ValidateSet("system-admin-storage")]
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
    foreach ($line in (InvokeSafeGit -Arguments @("ls-files", "--others", "--exclude-standard"))) {
        if (-not [string]::IsNullOrWhiteSpace([string]$line) -and -not (TestGitNoiseLine -Line ([string]$line))) {
            $names.Add([string]$line)
        }
    }
    return @($names | Sort-Object -Unique)
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
    if ($CheckOnly) {
        Write-Host "      $Command $($Arguments -join ' ')"
        return [pscustomobject]@{ Name = $Name; Passed = $true; Skipped = $true; ExitCode = 0 }
    }

    $resolved = Get-Command $Command -ErrorAction SilentlyContinue
    if ($null -eq $resolved) {
        Write-Host "[FAIL] command not found: $Command" -ForegroundColor Red
        return [pscustomobject]@{ Name = $Name; Passed = $false; Skipped = $false; ExitCode = 127 }
    }

    Push-Location $ProjectDir
    try {
        & $resolved.Source @Arguments
        $exitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    $passed = ($exitCode -eq 0)
    Write-Host ("[{0}] {1}" -f $(if ($passed) { "PASS" } else { "FAIL" }), $Name)
    return [pscustomobject]@{ Name = $Name; Passed = $passed; Skipped = $false; ExitCode = $exitCode }
}

function InvokePowerShellParseCheck {
    $psFiles = @(
        "tools/pipeline/peacebypiece-auto-pipeline.ps1",
        "tools/pipeline/pipeline-common.ps1",
        "tools/pipeline/verify-safe.ps1",
        "tools/pipeline/finish-version.ps1"
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

$profileCommands = @{
    "system-admin-storage" = @(
        @{ Name = "system storage usage contract"; Command = "node"; Arguments = @("tests/system-storage-usage-real-data-contract.mjs") },
        @{ Name = "system dashboard contract"; Command = "node"; Arguments = @("tests/system-dashboard-real-data-contract.mjs") },
        @{ Name = "system billing contract"; Command = "node"; Arguments = @("tests/system-billing-real-data-contract.mjs") },
        @{ Name = "internal system routes contract"; Command = "node"; Arguments = @("tests/internal-system-routes-contract.mjs") },
        @{ Name = "dev/test context system admin contract"; Command = "node"; Arguments = @("tests/dev-test-context-system-admin-contract.mjs") }
    )
}

$results = New-Object System.Collections.Generic.List[object]
$changedFiles = @(GetChangedFiles)

Write-Host "PeaceByPiece safe verification"
Write-Host "Profile: $Profile"
Write-Host "CheckOnly: $CheckOnly"
Write-Host "Project: $ProjectDir"
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

foreach ($commandSpec in $profileCommands[$Profile]) {
    $results.Add((InvokeCheck -Name $commandSpec.Name -Command $commandSpec.Command -Arguments $commandSpec.Arguments))
}

$failedResults = @($results | Where-Object { -not $_.Passed })
$status = if ($failedResults.Count -eq 0) { "PASS" } else { "FAIL" }

EnsureDirectory -Path $RepoStatusDir
$resultPath = Join-Path $RepoStatusDir ("verify-safe-{0}-{1}.txt" -f $Profile, (GetTimestamp))
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("VERIFY_SAFE_RESULT: $status")
$lines.Add("GeneratedAt: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$lines.Add("ProjectDir: $ProjectDir")
$lines.Add("Profile: $Profile")
$lines.Add("CheckOnly: $CheckOnly")
$lines.Add("")
$lines.Add("ChangedFiles:")
if ($changedFiles.Count -eq 0) { $lines.Add("(none)") } else { foreach ($path in $changedFiles) { $lines.Add($path) } }
$lines.Add("")
$lines.Add("Results:")
foreach ($result in $results) {
    $lines.Add(("{0}: Passed={1}; Skipped={2}; ExitCode={3}" -f $result.Name, $result.Passed, $result.Skipped, $result.ExitCode))
}
[System.IO.File]::WriteAllLines($resultPath, $lines, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "VERIFY_SAFE_RESULT: $status"
Write-Host "Result file: $resultPath"

if ($failedResults.Count -gt 0) {
    exit 1
}

exit 0
