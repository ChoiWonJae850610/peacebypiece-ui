param(
    [ValidateSet("system-admin-storage", "id-control-roadmap", "roadmap-development-contract", "system-admin-internal-access", "repository-cleanup", "source-architecture-cleanup", "automation-infrastructure", "workspace-commonization", "functions-automation", "billing-foundation", "billing-operations", "public-signup-e2e", "public-signup-authenticated-e2e", "workorder-size-pdf", "public-signup-first-draft-fix", "customer-product-ux-cleanup", "workorder-pdf-live-integration", "product-ui-runtime-verification")]
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

function InvokeWaflV2Alpha22EvidenceCheck {
    $name = "WAFL v2 alpha.22 DB runtime evidence"
    $commandLine = "Logs/DB_Audit alpha.22 apply/validate/seed/verify evidence"
    if ($CheckOnly) {
        return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $true; Skipped = $true; ExitCode = 0; FindingCount = ""; HighRiskCount = ""; OutputSummary = "check-only" }
    }

    $dbAuditDir = Join-Path (Split-Path -Parent $RepoStatusDir) "DB_Audit"
    if (-not (Test-Path -LiteralPath $dbAuditDir -PathType Container)) {
        return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $false; Skipped = $false; ExitCode = 1; FindingCount = ""; HighRiskCount = ""; OutputSummary = "DB_Audit directory missing" }
    }

    function GetLatestEvidenceText {
        param([string]$Pattern)
        $file = Get-ChildItem -LiteralPath $dbAuditDir -File -Filter $Pattern -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1
        if ($null -eq $file) { return "" }
        return Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
    }

    $applyText = GetLatestEvidenceText -Pattern "OK_Apply_Wafl_V2_Alpha22_Migrations_*.txt"
    $validateText = GetLatestEvidenceText -Pattern "OK_Wafl_V2_Alpha22_Post_Apply_Validation_*.txt"
    $seedA = GetLatestEvidenceText -Pattern "OK_Wafl_V2_Alpha22_Seed_A500_*.txt"
    $seedB = GetLatestEvidenceText -Pattern "OK_Wafl_V2_Alpha22_Seed_B5000_*.txt"
    $seedC = GetLatestEvidenceText -Pattern "OK_Wafl_V2_Alpha22_Seed_C_MULTI_*.txt"
    $verifyText = GetLatestEvidenceText -Pattern "OK_Wafl_V2_Alpha22_Verification_*.txt"
    $checks = @(
        ($applyText -match 'Migration ledger rows:\s*6' -and $applyText -match 'Result:\s*PASS'),
        ($validateText -match 'V1 baseline fingerprint unchanged:' -and $validateText -match 'Post-apply critical mismatch:\s*0' -and $validateText -match 'Result:\s*PASS'),
        ($seedA -match 'Seed result:\s*profile=a500 workOrders=500' -and $seedA -match 'Result:\s*PASS'),
        ($seedB -match 'Seed result:\s*profile=b5000 workOrders=5000' -and $seedB -match 'Result:\s*PASS'),
        ($seedC -match 'Seed result:\s*profile=c-multi workOrders=5400' -and $seedC -match 'Result:\s*PASS'),
        ($verifyText -match '"tenantIsolation":"PASS"' -and
            $verifyText -match '"privilegedAudit":"PASS"' -and
            $verifyText -match '"optimisticConcurrency":"PASS"' -and
            $verifyText -match '"idempotency":"PASS"' -and
            $verifyText -match 'Cursor 500:\s*\{"rows":500' -and
            $verifyText -match 'Cursor 5000:\s*\{"rows":5000' -and
            $verifyText -match 'Document number concurrency:\s*\{"attempts":12,"unique":12' -and
            $verifyText -match 'Result:\s*PASS'),
        ($verifyText -match 'Performance 500:' -and $verifyText -match 'Performance 5000:'),
        ($verifyText -match 'Business data mutation:\s*false' -and
            $verifyText -match 'R2 mutation:\s*false' -and
            $verifyText -match 'Production mutation:\s*false')
    )
    $passed = @($checks | Where-Object { -not $_ }).Count -eq 0
    if ($passed) {
        $performance500 = [regex]::Match($verifyText, 'Performance 500:\s*(\{.*\})').Groups[1].Value
        $performance5000 = [regex]::Match($verifyText, 'Performance 5000:\s*(\{.*\})').Groups[1].Value
        $script:WaflV2Alpha22Evidence = [pscustomobject]@{
            Performance500 = $performance500
            Performance5000 = $performance5000
        }
    }
    return [pscustomobject]@{
        Name = $name
        CommandLine = $commandLine
        Passed = $passed
        Skipped = $false
        ExitCode = if ($passed) { 0 } else { 1 }
        FindingCount = ""
        HighRiskCount = ""
        OutputSummary = if ($passed) { "ledger=6; seeds=500+5000+5400; runtime/performance PASS" } else { "required alpha.22 evidence missing or failed" }
    }
}

function InvokeWaflV2Alpha23EvidenceCheck {
    $name = "WAFL v2 alpha.23 WorkOrder list API runtime evidence"
    $commandLine = "Logs/DB_Audit alpha.23 authenticated read-only API evidence"
    if ($CheckOnly) {
        return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $true; Skipped = $true; ExitCode = 0; FindingCount = ""; HighRiskCount = ""; OutputSummary = "check-only" }
    }

    $dbAuditDir = Join-Path (Split-Path -Parent $RepoStatusDir) "DB_Audit"
    function GetLatestAlpha23EvidenceText {
        param([string]$Pattern)
        $file = Get-ChildItem -LiteralPath $dbAuditDir -File -Filter $Pattern -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1
        if ($null -eq $file) { return "" }
        return Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
    }

    $evidenceFile = Get-ChildItem -LiteralPath $dbAuditDir -File -Filter "OK_Wafl_V2_Alpha23_List_API_Verification_*.txt" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if ($null -eq $evidenceFile) {
        return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $false; Skipped = $false; ExitCode = 1; FindingCount = ""; HighRiskCount = ""; OutputSummary = "alpha.23 runtime evidence missing" }
    }

    $evidence = Get-Content -LiteralPath $evidenceFile.FullName -Raw -Encoding UTF8
    $indexApplyText = GetLatestAlpha23EvidenceText -Pattern "OK_Apply_Wafl_V2_Alpha23_Material_Index_*.txt"
    $checks = @(
        ($indexApplyText -match 'Migration applied:\s*007_v2_work_order_list_material_lookup_index.sql' -and
            $indexApplyText -match 'Migration ledger rows:\s*7' -and
            $indexApplyText -match 'V1 baseline fingerprint unchanged:' -and
            $indexApplyText -match 'work_order_material_lines_company_revision_cover_idx' -and
            $indexApplyText -match 'DB schema mutation:\s*true; approved dev/test additive index 007 only' -and
            $indexApplyText -match 'Result:\s*PASS'),
        ($evidence -match 'Target guard:\s*PASS runtime=' -and $evidence -match 'Production target:\s*blocked'),
        ($evidence -match 'Cursor 500:\s*\{.*"rows":500.*"pages":10.*"duplicateCount":0.*"missingCount":0'),
        ($evidence -match 'Cursor 5000:\s*\{.*"rows":5000.*"pages":100.*"duplicateCount":0.*"missingCount":0'),
        ($evidence -match 'Tenant isolation:\s*PASS'),
        ($evidence -match 'Company C authenticated access policy:\s*FORBIDDEN \(approval_pending\)'),
        ($evidence -match 'Typed errors: AUTH_REQUIRED/FORBIDDEN/CURSOR_INVALID/LIMIT_EXCEEDED/VALIDATION_ERROR PASS'),
        ($evidence -match 'DB schema mutation:\s*false' -and $evidence -match 'Dev/Test seed mutation:\s*false'),
        ($evidence -match 'Business data mutation:\s*false' -and $evidence -match 'R2 mutation:\s*false' -and $evidence -match 'Production mutation:\s*false'),
        ($evidence -match 'Result:\s*PASS')
    )
    $passed = @($checks | Where-Object { -not $_ }).Count -eq 0
    if ($passed) {
        $cursor500 = [regex]::Match($evidence, 'Cursor 500:\s*(\{.*\})').Groups[1].Value
        $cursor5000 = [regex]::Match($evidence, 'Cursor 5000:\s*(\{.*\})').Groups[1].Value
        $defaultPayload = [regex]::Match($evidence, 'Default 30 payload bytes:\s*([0-9]+)').Groups[1].Value
        $script:WaflV2Alpha23Evidence = [pscustomobject]@{
            RuntimeLog = $evidenceFile.FullName
            Cursor500 = $cursor500
            Cursor5000 = $cursor5000
            DefaultPayloadBytes = $defaultPayload
        }
        Write-Host "[PASS] $name"
        return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $true; Skipped = $false; ExitCode = 0; FindingCount = ""; HighRiskCount = ""; OutputSummary = $evidenceFile.Name }
    }

    return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $false; Skipped = $false; ExitCode = 1; FindingCount = ""; HighRiskCount = ""; OutputSummary = "alpha.23 evidence contract mismatch" }
}

function InvokeWaflV2Alpha24EvidenceCheck {
    $name = "WAFL v2 alpha.24 WorkOrder detail/lazy API runtime evidence"
    $commandLine = "Logs/DB_Audit alpha.24 authenticated read-only detail API evidence"
    if ($CheckOnly) {
        return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $true; Skipped = $true; ExitCode = 0; FindingCount = ""; HighRiskCount = ""; OutputSummary = "check-only" }
    }

    $dbAuditDir = Join-Path (Split-Path -Parent $RepoStatusDir) "DB_Audit"
    $evidenceFile = Get-ChildItem -LiteralPath $dbAuditDir -File -Filter "OK_Wafl_V2_Alpha24_Detail_API_Verification_*.txt" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if ($null -eq $evidenceFile) {
        return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $false; Skipped = $false; ExitCode = 1; FindingCount = ""; HighRiskCount = ""; OutputSummary = "alpha.24 runtime evidence missing" }
    }

    $evidence = Get-Content -LiteralPath $evidenceFile.FullName -Raw -Encoding UTF8
    $routeMetricCount = [regex]::Matches($evidence, 'Route metrics \(sanitized\):\s*\{').Count
    $checks = @(
        ($evidence -match 'Target guard:\s*PASS runtime=' -and $evidence -match 'Production target:\s*blocked'),
        ($routeMetricCount -ge 10),
        ($evidence -match 'Accessory cursor:\s*\{"rows":10,"pages":4,"duplicateCount":0,"missingCount":0\}'),
        ($evidence -match 'Asset cursor:\s*\{"rows":2,"pages":1,"duplicateCount":0,"missingCount":0\}'),
        ($evidence -match 'Company A/H/B authenticated detail read:\s*PASS'),
        ($evidence -match 'Company C authenticated access policy:\s*FORBIDDEN \(approval_pending\)'),
        ($evidence -match 'Cross-company core/tab IDs:\s*NOT_FOUND'),
        ($evidence -match 'Lazy endpoint isolation and forbidden field scanner:\s*PASS'),
        ($evidence -match 'Typed errors: AUTH_REQUIRED/FORBIDDEN/NOT_FOUND/CURSOR_INVALID/LIMIT_EXCEEDED/VALIDATION_ERROR PASS'),
        ($evidence -match 'DB schema mutation:\s*false' -and $evidence -match 'Dev/Test seed mutation:\s*false'),
        ($evidence -match 'Business data mutation:\s*false' -and $evidence -match 'R2 mutation:\s*false' -and $evidence -match 'Production mutation:\s*false'),
        ($evidence -match 'Result:\s*PASS')
    )
    $passed = @($checks | Where-Object { -not $_ }).Count -eq 0
    if ($passed) {
        $script:WaflV2Alpha24Evidence = [pscustomobject]@{
            RuntimeLog = $evidenceFile.FullName
            RouteMetricCount = $routeMetricCount
            AccessoryCursor = [regex]::Match($evidence, 'Accessory cursor:\s*(\{.*\})').Groups[1].Value
            AssetCursor = [regex]::Match($evidence, 'Asset cursor:\s*(\{.*\})').Groups[1].Value
        }
        Write-Host "[PASS] $name"
        return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $true; Skipped = $false; ExitCode = 0; FindingCount = ""; HighRiskCount = ""; OutputSummary = $evidenceFile.Name }
    }

    return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $false; Skipped = $false; ExitCode = 1; FindingCount = ""; HighRiskCount = ""; OutputSummary = "alpha.24 evidence contract mismatch" }
}

function InvokeWaflV2Alpha25EvidenceCheck {
    $name = "WAFL v2 alpha.25 WorkOrder Command runtime evidence"
    $commandLine = "Logs/DB_Audit alpha.25 approved dev/test Command evidence"
    if ($CheckOnly) {
        return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $true; Skipped = $true; ExitCode = 0; FindingCount = ""; HighRiskCount = ""; OutputSummary = "check-only" }
    }

    $dbAuditDir = Join-Path (Split-Path -Parent $RepoStatusDir) "DB_Audit"
    $evidenceFile = Get-ChildItem -LiteralPath $dbAuditDir -File -Filter "OK_Wafl_V2_Alpha25_Command_Runtime_*.txt" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if ($null -eq $evidenceFile) {
        return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $false; Skipped = $false; ExitCode = 1; FindingCount = ""; HighRiskCount = ""; OutputSummary = "alpha.25 runtime evidence missing" }
    }

    $evidence = Get-Content -LiteralPath $evidenceFile.FullName -Raw -Encoding UTF8
    $checks = @(
        ($evidence -match 'version=2\.0\.0-alpha\.25'),
        ($evidence -match 'Dev/test target fingerprint:\s*01e5dcc7fea3'),
        ($evidence -match 'Created synthetic WorkOrders:\s*1'),
        ($evidence -match 'Updated synthetic WorkOrders:\s*1 unique row; 2 successful version transitions'),
        ($evidence -match 'Idempotency single effect/different payload conflict:\s*PASS'),
        ($evidence -match 'Optimistic concurrency single winner:\s*PASS'),
        ($evidence -match 'Tenant isolation and Company C FORBIDDEN:\s*PASS'),
        ($evidence -match 'Revision immutability:\s*PASS'),
        ($evidence -match 'Audit/history events:\s*3 PASS'),
        ($evidence -match 'Alpha\.23/24 Read API regression:\s*PASS'),
        ($evidence -match 'DB migration/schema/index mutation:\s*false'),
        ($evidence -match 'Dev/Test DB test-data mutation:\s*true; one retained alpha\.25 synthetic WorkOrder/R0/receipt and three events'),
        ($evidence -match 'Business/R2/Worker/PDF mutation:\s*false'),
        ($evidence -match 'Production access/mutation:\s*false'),
        ($evidence -match 'Result:\s*PASS')
    )
    $passed = @($checks | Where-Object { -not $_ }).Count -eq 0
    if ($passed) {
        $script:WaflV2Alpha25Evidence = [pscustomobject]@{
            RuntimeLog = $evidenceFile.FullName
            CommandMetrics = [regex]::Match($evidence, 'Command metrics \(sanitized\):\s*(\{.*\})').Groups[1].Value
        }
        Write-Host "[PASS] $name"
        return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $true; Skipped = $false; ExitCode = 0; FindingCount = ""; HighRiskCount = ""; OutputSummary = $evidenceFile.Name }
    }

    return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $false; Skipped = $false; ExitCode = 1; FindingCount = ""; HighRiskCount = ""; OutputSummary = "alpha.25 evidence contract mismatch" }
}

function InvokeWaflV2Alpha26CompletionEvidenceCheck {
    $name = "WAFL v2 alpha.26 material Command completion evidence"
    $commandLine = "Approval_Handoff GET-only completion plus Failure_Handoff bounded read-only audit"
    if ($CheckOnly) {
        return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $true; Skipped = $true; ExitCode = 0; FindingCount = ""; HighRiskCount = ""; OutputSummary = "check-only" }
    }

    $approvalDir = Join-Path $RepoStatusDir "Approval_Handoff"
    $failureDir = Join-Path $RepoStatusDir "Failure_Handoff"
    $completionFile = Get-ChildItem -LiteralPath $approvalDir -File -Filter "readonly-completion-alpha26-material-command-*.txt" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Where-Object { (Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8) -match 'Status:\s*READ_ONLY_COMPLETION_PASS' } |
        Select-Object -First 1
    $auditFile = Get-ChildItem -LiteralPath $failureDir -File -Filter "readonly-audit-alpha26-material-command-*.txt" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if ($null -eq $completionFile -or $null -eq $auditFile) {
        return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $false; Skipped = $false; ExitCode = 1; FindingCount = ""; HighRiskCount = ""; OutputSummary = "alpha.26 completion or audit evidence missing" }
    }

    $completion = Get-Content -LiteralPath $completionFile.FullName -Raw -Encoding UTF8
    $audit = Get-Content -LiteralPath $auditFile.FullName -Raw -Encoding UTF8
    $checks = @(
        ($completion -match 'Status:\s*READ_ONLY_COMPLETION_PASS' -and $completion -match 'Result:\s*READ_ONLY_COMPLETION_PASS'),
        ($completion -match 'Target fingerprint guard:\s*01e5dcc7fea3'),
        ($completion -match 'GET requests:\s*successful=14; failed=0'),
        ($completion -match 'Direct DB client/query/SQL:\s*0' -and $completion -match 'Mutation route/method calls:\s*0'),
        ($completion -match 'Alpha\.23 list and alpha\.25 target list/detail consistency:\s*PASS'),
        ($completion -match 'Alpha\.24 detail/material/history/lazy Read regression:\s*PASS'),
        ($completion -match 'fabric=2 cancelled=2; accessory=1 completed=1; parentVersion=14 PASS'),
        ($completion -match 'Company B/H=NOT_FOUND; Company C=FORBIDDEN'),
        ($completion -match 'Finalized LOCKED:\s*PASS_BY_EXISTING_RUNTIME_AND_SOURCE_EVIDENCE'),
        ($completion -match 'DB/schema/business/R2/Worker/PDF/production mutation:\s*false'),
        ($audit -match 'Migration Ledger:\s*7/7'),
        ($audit -match 'Material Count:\s*total=3; fabric=2; accessory=1'),
        ($audit -match 'Versions:\s*workOrder=14 \(delta 11\); revision=14 \(delta 11\); materialVersionSum=11'),
        ($audit -match 'Receipts:\s*total=9; complete=9; incomplete=0'),
        ($audit -match 'Events:\s*total=11'),
        ($audit -match 'supplierMismatchCount":0'),
        ($audit -match 'Final Result:\s*NO_PARTIAL_MUTATION')
    )
    $passed = @($checks | Where-Object { -not $_ }).Count -eq 0
    if (-not $passed) {
        return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $false; Skipped = $false; ExitCode = 1; FindingCount = ""; HighRiskCount = ""; OutputSummary = "alpha.26 completion evidence contract mismatch" }
    }

    $script:WaflV2Alpha26Evidence = [pscustomobject]@{
        CompletionLog = $completionFile.FullName
        AuditLog = $auditFile.FullName
        GetSummary = "successful 14, failed 0, direct DB query 0, mutation route 0"
    }
    Write-Host "[PASS] $name"
    return [pscustomobject]@{ Name = $name; CommandLine = $commandLine; Passed = $true; Skipped = $false; ExitCode = 0; FindingCount = ""; HighRiskCount = ""; OutputSummary = $completionFile.Name }
}

function InvokePackageScriptCheck {
    param(
        [string]$Name,
        [string]$ScriptName
    )

    if (Get-Command "npm" -ErrorAction SilentlyContinue) {
        return InvokeCheck -Name $Name -Command "npm" -Arguments @("run", $ScriptName)
    }

    if ($ScriptName -eq "build") {
        return InvokeCheck -Name "$Name (node fallback)" -Command "node" -Arguments @("node_modules/next/dist/bin/next", "build")
    }

    if ($ScriptName -eq "audit:wafl-mutations") {
        return InvokeCheck -Name "$Name (node fallback)" -Command "node" -Arguments @("scripts/audit-wafl-mutations.mjs")
    }

    return [pscustomobject]@{ Name = $Name; CommandLine = "npm run $ScriptName"; Passed = $false; Skipped = $false; ExitCode = 127; FindingCount = ""; HighRiskCount = ""; OutputSummary = "npm unavailable and no fallback configured" }
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
        @{ Name = "tsc --noEmit"; Command = "node"; Arguments = @("node_modules/typescript/bin/tsc", "--noEmit") },
        @{
            Name = "targeted ESLint"
            Command = "node"
            Arguments = @(
                "node_modules/eslint/bin/eslint.js",
                "app/api/v2/work-orders/[workOrderId]/materials/route.ts",
                "app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/route.ts",
                "app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/order-request/route.ts",
                "app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/order-cancel/route.ts",
                "app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/order-complete/route.ts",
                "lib/domain/work-orders/command/commandRepository.ts",
                "lib/domain/work-orders/command/commandRoute.ts",
                "lib/domain/work-orders/command/commandService.ts",
                "lib/domain/work-orders/command/runtimeGuard.ts",
                "lib/domain/work-orders/command/validation.ts",
                "lib/domain/work-orders/command/materialCommandRepository.ts",
                "lib/domain/work-orders/command/materialCommandRoute.ts",
                "lib/domain/work-orders/command/materialCommandService.ts",
                "lib/domain/work-orders/command/materialValidation.ts",
                "app/api/v2/work-orders/[workOrderId]/revisions/issue/route.ts",
                "lib/domain/work-orders/command/issueRepository.ts",
                "lib/domain/work-orders/command/issueRoute.ts",
                "lib/domain/work-orders/command/issueService.ts",
                "lib/domain/work-orders/command/issueValidation.ts",
                "lib/domain/work-orders/contracts/commands.ts",
                "scripts/run-wafl-v2-alpha26-material-command-preflight.mjs",
                "scripts/run-wafl-v2-alpha26-material-command-runtime.mjs",
                "tests/workorder-v2-alpha22-dev-test-runner-contract.mjs",
                "tests/workorder-v2-alpha26-material-command-api-contract.mjs",
                "scripts/run-wafl-v2-alpha27-revision-issue-preflight.mjs",
                "scripts/run-wafl-v2-alpha27-revision-issue-runtime.mjs",
                "tests/workorder-v2-alpha27-revision-issue-command-contract.mjs",
                "scripts/run-wafl-v2-alpha27a-number-settings-migration.mjs",
                "scripts/run-wafl-v2-alpha27a-settings-fixture.mjs",
                "tests/workorder-v2-alpha27a-number-settings-migration-contract.mjs",
                "app/api/v2/work-orders/[workOrderId]/revisions/[revisionId]/preview/route.ts",
                "lib/domain/work-orders/read/previewRepository.ts",
                "lib/domain/work-orders/read/previewRoute.ts",
                "lib/domain/work-orders/read/previewService.ts",
                "lib/domain/work-orders/contracts/read-models.ts",
                "components/workorder/preview/IssuedWorkOrderPreview.tsx",
                "components/workorder/preview/IssuedWorkOrderDocument.tsx",
                "components/workorder/preview/SampleIssuedWorkOrderPreview.tsx",
                "components/workorder/preview/processInstruction.ts",
                "lib/internal/samples/issuedWorkOrderPreviewSample.ts",
                "components/auth/CurrentUserProvider.tsx",
                "app/dev/workorder-preview-sample/page.tsx",
                "app/(workspace)/workspace/workorders/[workOrderId]/revisions/[revisionId]/preview/page.tsx",
                "scripts/run-wafl-v2-alpha28-issued-preview.mjs",
                "tests/workorder-v2-alpha28-issued-preview-contract.mjs",
                "app/api/v2/work-orders/documents/[documentNumber]/preview-target/route.ts",
                "lib/domain/work-orders/read/previewTargetService.ts",
                "lib/domain/work-orders/read/previewTargetRepository.ts",
                "components/workorder/preview/DocumentNumberPreviewResolver.tsx",
                "app/(workspace)/workspace/documents/[documentNumber]/preview/page.tsx",
                "apps/mobile/components/ProductionCardMock.tsx",
                "apps/mobile/components/InlineEditableFields.tsx",
                "apps/mobile/constants/compactFieldTypography.ts",
                "apps/mobile/utils/processInstruction.ts",
                "apps/mobile/utils/previewLink.ts",
                "scripts/run-wafl-v2-alpha29-mobile-preview-entry.mjs",
                "tests/workorder-v2-alpha29-mobile-preview-entry-contract.mjs",
                "app/api/v2/work-orders/[workOrderId]/processes/[processId]/route.ts",
                "lib/domain/work-orders/command/processCommandRepository.ts",
                "lib/domain/work-orders/command/processCommandRoute.ts",
                "lib/domain/work-orders/command/processCommandService.ts",
                "lib/domain/work-orders/command/processValidation.ts",
                "scripts/run-wafl-v2-alpha30-factory-instruction-migration.mjs",
                "tests/workorder-v2-alpha30-factory-instruction-contract.mjs",
                "tests/workorder-v2-alpha31-inline-preview-layout-contract.mjs",
                "tests/workorder-v2-alpha32-inline-density-sample-print-contract.mjs",
                "tests/workorder-v2-alpha33-realistic-preview-card-flow-contract.mjs",
                "tests/workorder-v2-alpha34-mobile-preview-footer-contract.mjs",
                "tests/workorder-v2-alpha35-material-compact-input-contract.mjs",
                "app/dev/workorder-pdf-snapshot/route.ts",
                "lib/generated-documents/work-order-pdf/constants.ts",
                "lib/generated-documents/work-order-pdf/pdfContract.mjs",
                "lib/generated-documents/work-order-pdf/pdfContract.d.mts",
                "lib/generated-documents/work-order-pdf/snapshot.ts",
                "lib/generated-documents/work-order-pdf/assets.ts",
                "lib/generated-documents/work-order-pdf/sampleFoundation.ts",
                "lib/generated-documents/work-order-pdf/renderer.ts",
                "lib/generated-documents/work-order-pdf/localChromiumRenderer.mts",
                "lib/generated-documents/work-order-pdf/objectStore.ts",
                "lib/generated-documents/work-order-pdf/localFilesystemObjectStore.mts",
                "lib/generated-documents/work-order-pdf/generationRepository.ts",
                "lib/generated-documents/work-order-pdf/r2WorkerTransport.ts",
                "lib/generated-documents/work-order-pdf/localRenderInput.ts",
                "components/workorder/preview/GeneratedIssuedWorkOrderPreview.tsx",
                "components/auth/CurrentUserProvider.tsx",
                "app/dev/workorder-pdf-render/[runToken]/page.tsx",
                "scripts/run-wafl-v2-alpha37-pdf-foundation.mjs",
                "tests/workorder-v2-alpha37-pdf-generation-foundation-contract.mjs",
                "db/v2/migrations/010_v2_generated_document_receipt_link.sql",
                "scripts/run-wafl-v2-alpha38-document-receipt-migration.mjs",
                "scripts/run-wafl-v2-alpha38-pdf-r2-runtime.mjs",
                "tests/workorder-v2-alpha38-pdf-r2-runtime-contract.mjs"
            )
        },
        @{ Name = "mobile typecheck"; Command = "npm"; Arguments = @("--prefix", "apps/mobile", "run", "typecheck") },
        @{ Name = "mobile Expo config"; Command = "npm"; Arguments = @("--prefix", "apps/mobile", "run", "expo:config") },
        @{ Name = "workorder v2 API contract"; Command = "node"; Arguments = @("tests/workorder-v2-api-contract.mjs") },
        @{ Name = "workorder v2 migration schema contract"; Command = "node"; Arguments = @("tests/workorder-v2-migration-schema-contract.mjs") },
        @{ Name = "workorder v2 alpha.22 dev/test runner contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha22-dev-test-runner-contract.mjs") },
        @{ Name = "workorder v2 alpha.23 list API contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha23-list-api-contract.mjs") },
        @{ Name = "workorder v2 alpha.24 detail/lazy API contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha24-detail-api-contract.mjs") },
        @{ Name = "workorder v2 alpha.25 command API static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha25-command-api-contract.mjs") },
        @{ Name = "workorder v2 alpha.26 material command API static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha26-material-command-api-contract.mjs") },
        @{ Name = "workorder v2 alpha.27 revision issue command static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha27-revision-issue-command-contract.mjs") },
        @{ Name = "workorder v2 alpha.27a numbering settings migration static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha27a-number-settings-migration-contract.mjs") },
        @{ Name = "workorder v2 alpha.28 issued Preview static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha28-issued-preview-contract.mjs") },
        @{ Name = "workorder v2 alpha.29 mobile Preview entry static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha29-mobile-preview-entry-contract.mjs") },
        @{ Name = "workorder v2 alpha.30 factory instruction static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha30-factory-instruction-contract.mjs") },
        @{ Name = "workorder v2 alpha.31 inline Preview layout static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha31-inline-preview-layout-contract.mjs") },
        @{ Name = "workorder v2 alpha.32 inline density and sample print static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha32-inline-density-sample-print-contract.mjs") },
        @{ Name = "workorder v2 alpha.33 realistic Preview and material card flow static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha33-realistic-preview-card-flow-contract.mjs") },
        @{ Name = "workorder v2 alpha.34 mobile Preview and material footer static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha34-mobile-preview-footer-contract.mjs") },
        @{ Name = "workorder v2 alpha.35 material compact input static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha35-material-compact-input-contract.mjs") },
        @{ Name = "workorder v2 alpha.36 material card separation and summary static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha36-material-card-separation-and-summary-contract.mjs") },
        @{ Name = "workorder v2 alpha.37 PDF generation foundation static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha37-pdf-generation-foundation-contract.mjs") },
        @{ Name = "workorder v2 alpha.38 PDF DB/R2 runtime static contract"; Command = "node"; Arguments = @("tests/workorder-v2-alpha38-pdf-r2-runtime-contract.mjs") },
        @{ Name = "app-v2 document links and Mermaid contract"; Command = "node"; Arguments = @("tests/app-v2-document-links-contract.mjs") },
        @{ Name = "unicode encoding contract"; Command = "node"; Arguments = @("tests/unicode-encoding-contract.mjs") },
        @{ Name = "PowerShell encoding contract"; Command = "node"; Arguments = @("tests/pipeline-powershell-encoding-contract.mjs") },
        @{ Name = "internal system routes contract"; Command = "node"; Arguments = @("tests/internal-system-routes-contract.mjs") },
        @{ Name = "system-admin internal access contract"; Command = "node"; Arguments = @("tests/system-admin-internal-access-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") },
        @{ Name = "pipeline repo state publication contract"; Command = "node"; Arguments = @("tests/pipeline-repo-state-publication-contract.mjs") }
    );
    "workspace-commonization" = @(
        @{ Name = "workspace commonization contract"; Command = "node"; Arguments = @("tests/workspace-commonization-contract.mjs") },
        @{ Name = "WAFL UI foundation contract"; Command = "node"; Arguments = @("tests/wafl-ui-foundation-contract.mjs") },
        @{ Name = "storage usage meter contract"; Command = "node"; Arguments = @("tests/storage-usage-meter-contract.mjs") },
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
        @{ Name = "R2 worker signature contract"; Command = "node"; Arguments = @("tests/r2-worker-signature-contract.mjs") },
        @{ Name = "simulator attachment manifest contract"; Command = "node"; Arguments = @("tests/simulator-attachment-manifest-contract.mjs") },
        @{ Name = "simulator attachment lifecycle contract"; Command = "node"; Arguments = @("tests/simulator-attachment-lifecycle-contract.mjs") },
        @{ Name = "simulator attachment file format contract"; Command = "node"; Arguments = @("tests/simulator-attachment-file-format-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") }
    );
    "billing-foundation" = @(
        @{
            Name = "targeted ESLint";
            Command = "node";
            Arguments = @(
                "node_modules/eslint/bin/eslint.js",
                "app/layout.tsx",
                "lib/billing/canonicalBillingPolicy.ts",
                "lib/billing/companyExportPolicy.ts",
                "lib/billing/companyStorageQuotaRepository.ts",
                "lib/billing/index.ts",
                "lib/billing/notificationOutboxPolicy.ts",
                "lib/billing/paymentMethodReferencePolicy.ts",
                "lib/billing/subscriptionLifecyclePolicy.ts",
                "lib/constants/version.ts",
                "lib/internal/roadmap/index.ts",
                "lib/internal/roadmap/roadmap-0.24.31.ts",
                "lib/signup/signupCorrectionPolicy.ts",
                "lib/workorder/api/workOrderRouteHandlers.ts",
                "tests/approved-workflow-contract.mjs",
                "tests/billing-payment-readiness-contract.mjs",
                "tests/billing-pricing-policy-contract.mjs",
                "tests/billing-security-contract.mjs",
                "tests/canonical-policy-conformance-audit-contract.mjs",
                "tests/company-export-foundation-contract.mjs",
                "tests/notification-outbox-foundation-contract.mjs",
                "tests/roadmap-0.24.31-contract.mjs",
                "tests/roadmap-development-contract.mjs",
                "tests/signup-correction-deadline-contract.mjs",
                "tests/storage-capacity-profile-contract.mjs",
                "tests/storage-full-block-coverage-contract.mjs",
                "tests/subscription-lifecycle-policy-contract.mjs"
            )
        },
        @{ Name = "tsc --noEmit"; Command = "node"; Arguments = @("node_modules/typescript/bin/tsc", "--noEmit") },
        @{ Name = "canonical policy conformance audit contract"; Command = "node"; Arguments = @("tests/canonical-policy-conformance-audit-contract.mjs") },
        @{ Name = "billing pricing policy contract"; Command = "node"; Arguments = @("tests/billing-pricing-policy-contract.mjs") },
        @{ Name = "billing security contract"; Command = "node"; Arguments = @("tests/billing-security-contract.mjs") },
        @{ Name = "billing payment readiness contract"; Command = "node"; Arguments = @("tests/billing-payment-readiness-contract.mjs") },
        @{ Name = "subscription lifecycle policy contract"; Command = "node"; Arguments = @("tests/subscription-lifecycle-policy-contract.mjs") },
        @{ Name = "company export foundation contract"; Command = "node"; Arguments = @("tests/company-export-foundation-contract.mjs") },
        @{ Name = "notification outbox foundation contract"; Command = "node"; Arguments = @("tests/notification-outbox-foundation-contract.mjs") },
        @{ Name = "signup correction deadline contract"; Command = "node"; Arguments = @("tests/signup-correction-deadline-contract.mjs") },
        @{ Name = "storage full-block coverage contract"; Command = "node"; Arguments = @("tests/storage-full-block-coverage-contract.mjs") },
        @{ Name = "roadmap 0.24.31 contract"; Command = "node"; Arguments = @("tests/roadmap-0.24.31-contract.mjs") },
        @{ Name = "roadmap development contract"; Command = "node"; Arguments = @("tests/roadmap-development-contract.mjs") },
        @{ Name = "pipeline repo state publication contract"; Command = "node"; Arguments = @("tests/pipeline-repo-state-publication-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") },
        @{ Name = "unicode encoding contract"; Command = "node"; Arguments = @("tests/unicode-encoding-contract.mjs") },
        @{ Name = "PowerShell encoding contract"; Command = "node"; Arguments = @("tests/pipeline-powershell-encoding-contract.mjs") },
        @{ Name = "signup application trial policy contract"; Command = "node"; Arguments = @("tests/signup-application-trial-policy-contract.mjs") },
        @{ Name = "storage capacity profile contract"; Command = "node"; Arguments = @("tests/storage-capacity-profile-contract.mjs") },
        @{ Name = "storage quota upload guard contract"; Command = "node"; Arguments = @("tests/storage-quota-upload-guard-contract.mjs") },
        @{ Name = "workorder PDF policy contract"; Command = "node"; Arguments = @("tests/workorder-pdf-policy-contract.mjs") },
        @{ Name = "authorization runtime boundary contract"; Command = "node"; Arguments = @("tests/authorization-runtime-boundary-contract.mjs") },
        @{ Name = "workspace member session guard contract"; Command = "node"; Arguments = @("tests/workspace-member-session-guard-contract.mjs") }
    );
    "billing-operations" = @(
        @{
            Name = "targeted ESLint";
            Command = "node";
            Arguments = @(
                "node_modules/eslint/bin/eslint.js",
                "app/api/admin/subscription/operations/route.ts",
                "app/api/system/billing/operations/route.ts",
                "app/layout.tsx",
                "lib/billing/billingOperationsRepository.ts",
                "lib/billing/billingOperationsService.ts",
                "lib/billing/billingOperationsTypes.ts",
                "lib/billing/index.ts",
                "lib/constants/version.ts",
                "lib/internal/roadmap/index.ts",
                "lib/internal/roadmap/roadmap-0.24.32.ts",
                "lib/signup/signupApplicationProvisioningRepository.ts",
                "scripts/run-approved-db-migration.mjs",
                "scripts/run-billing-operations-integration.mjs",
                "scripts/run-readonly-db-audit.mjs",
                "tests/billing-approval-gate-contract.mjs",
                "tests/billing-integration-runner-contract.mjs",
                "tests/billing-operations-schema-contract.mjs",
                "tests/billing-operations-service-contract.mjs",
                "tests/billing-powershell-menu-contract.mjs",
                "tests/roadmap-0.24.32-contract.mjs"
            )
        },
        @{ Name = "tsc --noEmit"; Command = "node"; Arguments = @("node_modules/typescript/bin/tsc", "--noEmit") },
        @{ Name = "billing operations schema contract"; Command = "node"; Arguments = @("tests/billing-operations-schema-contract.mjs") },
        @{ Name = "billing operations service contract"; Command = "node"; Arguments = @("tests/billing-operations-service-contract.mjs") },
        @{ Name = "billing approval gate contract"; Command = "node"; Arguments = @("tests/billing-approval-gate-contract.mjs") },
        @{ Name = "billing PowerShell menu contract"; Command = "node"; Arguments = @("tests/billing-powershell-menu-contract.mjs") },
        @{ Name = "billing integration runner contract"; Command = "node"; Arguments = @("tests/billing-integration-runner-contract.mjs") },
        @{ Name = "billing pricing policy contract"; Command = "node"; Arguments = @("tests/billing-pricing-policy-contract.mjs") },
        @{ Name = "billing security contract"; Command = "node"; Arguments = @("tests/billing-security-contract.mjs") },
        @{ Name = "subscription lifecycle policy contract"; Command = "node"; Arguments = @("tests/subscription-lifecycle-policy-contract.mjs") },
        @{ Name = "company export foundation contract"; Command = "node"; Arguments = @("tests/company-export-foundation-contract.mjs") },
        @{ Name = "notification outbox foundation contract"; Command = "node"; Arguments = @("tests/notification-outbox-foundation-contract.mjs") },
        @{ Name = "signup correction deadline contract"; Command = "node"; Arguments = @("tests/signup-correction-deadline-contract.mjs") },
        @{ Name = "storage full-block coverage contract"; Command = "node"; Arguments = @("tests/storage-full-block-coverage-contract.mjs") },
        @{ Name = "roadmap 0.24.32 contract"; Command = "node"; Arguments = @("tests/roadmap-0.24.32-contract.mjs") },
        @{ Name = "roadmap development contract"; Command = "node"; Arguments = @("tests/roadmap-development-contract.mjs") },
        @{ Name = "pipeline repo state publication contract"; Command = "node"; Arguments = @("tests/pipeline-repo-state-publication-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") },
        @{ Name = "unicode encoding contract"; Command = "node"; Arguments = @("tests/unicode-encoding-contract.mjs") },
        @{ Name = "PowerShell encoding contract"; Command = "node"; Arguments = @("tests/pipeline-powershell-encoding-contract.mjs") },
        @{ Name = "authorization runtime boundary contract"; Command = "node"; Arguments = @("tests/authorization-runtime-boundary-contract.mjs") },
        @{ Name = "workspace member session guard contract"; Command = "node"; Arguments = @("tests/workspace-member-session-guard-contract.mjs") }
    );
    "public-signup-e2e" = @(
        @{
            Name = "targeted ESLint";
            Command = "node";
            Arguments = @(
                "node_modules/eslint/bin/eslint.js",
                "app/(public)/signup/page.tsx",
                "app/api/system/signup/applications/[applicationId]/payment-readiness/route.ts",
                "app/layout.tsx",
                "components/auth/WaflLoginPage.tsx",
                "components/system/signup/SystemSignupReviewDetailActions.tsx",
                "components/system/signup/SystemSignupReviewDetailView.tsx",
                "components/system/signup/SystemSignupReviewListView.tsx",
                "lib/billing/index.ts",
                "lib/billing/signupPaymentReadinessRepository.ts",
                "lib/constants/version.ts",
                "lib/internal/roadmap/index.ts",
                "lib/internal/roadmap/roadmap-0.24.33.ts",
                "lib/signup/signupApplicationProvisioningRepository.ts",
                "lib/system/signupReviewRepository.ts",
                "scripts/run-approved-db-migration.mjs",
                "scripts/run-public-signup-e2e-integration.mjs",
                "scripts/run-readonly-db-audit.mjs",
                "tests/billing-approval-gate-contract.mjs",
                "tests/e2e/public-signup-e2e.spec.mjs",
                "tests/public-signup-powershell-menu-contract.mjs",
                "tests/public-signup-e2e-ux-contract.mjs",
                "tests/roadmap-0.24.33-contract.mjs",
                "tests/roadmap-development-contract.mjs",
                "tests/system-signup-review-foundation-contract.mjs"
            )
        },
        @{ Name = "tsc --noEmit"; Command = "node"; Arguments = @("node_modules/typescript/bin/tsc", "--noEmit") },
        @{ Name = "public signup e2e UX contract"; Command = "node"; Arguments = @("tests/public-signup-e2e-ux-contract.mjs") },
        @{ Name = "public signup PowerShell menu contract"; Command = "node"; Arguments = @("tests/public-signup-powershell-menu-contract.mjs") },
        @{ Name = "system signup review foundation contract"; Command = "node"; Arguments = @("tests/system-signup-review-foundation-contract.mjs") },
        @{ Name = "billing approval gate contract"; Command = "node"; Arguments = @("tests/billing-approval-gate-contract.mjs") },
        @{ Name = "signup approval provisioning foundation contract"; Command = "node"; Arguments = @("tests/signup-approval-provisioning-foundation-contract.mjs") },
        @{ Name = "billing operations schema contract"; Command = "node"; Arguments = @("tests/billing-operations-schema-contract.mjs") },
        @{ Name = "billing operations service contract"; Command = "node"; Arguments = @("tests/billing-operations-service-contract.mjs") },
        @{ Name = "roadmap 0.24.33 contract"; Command = "node"; Arguments = @("tests/roadmap-0.24.33-contract.mjs") },
        @{ Name = "roadmap development contract"; Command = "node"; Arguments = @("tests/roadmap-development-contract.mjs") },
        @{ Name = "pipeline repo state publication contract"; Command = "node"; Arguments = @("tests/pipeline-repo-state-publication-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") },
        @{ Name = "unicode encoding contract"; Command = "node"; Arguments = @("tests/unicode-encoding-contract.mjs") },
        @{ Name = "PowerShell encoding contract"; Command = "node"; Arguments = @("tests/pipeline-powershell-encoding-contract.mjs") },
        @{ Name = "authorization runtime boundary contract"; Command = "node"; Arguments = @("tests/authorization-runtime-boundary-contract.mjs") },
        @{ Name = "workspace member session guard contract"; Command = "node"; Arguments = @("tests/workspace-member-session-guard-contract.mjs") }
    );
    "public-signup-authenticated-e2e" = @(
        @{
            Name = "targeted ESLint";
            Command = "node";
            Arguments = @(
                "node_modules/eslint/bin/eslint.js",
                "app/api/dev/public-signup-e2e/session/route.ts",
                "app/functions/FunctionsCatalogClient.tsx",
                "app/layout.tsx",
                "lib/constants/version.ts",
                "lib/functions/catalog.ts",
                "lib/internal/roadmap/index.ts",
                "lib/internal/roadmap/roadmap-0.24.33.1.ts",
                "playwright.config.mjs",
                "scripts/run-public-signup-e2e-integration.mjs",
                "tests/e2e/helpers/publicSignupAuth.mjs",
                "tests/e2e/public-signup-authenticated.spec.mjs",
                "tests/functions-public-signup-automation-contract.mjs",
                "tests/public-signup-authenticated-e2e-contract.mjs",
                "tests/public-signup-powershell-menu-contract.mjs",
                "tests/roadmap-0.24.33.1-contract.mjs"
            )
        },
        @{ Name = "tsc --noEmit"; Command = "node"; Arguments = @("node_modules/typescript/bin/tsc", "--noEmit") },
        @{ Name = "public signup authenticated e2e contract"; Command = "node"; Arguments = @("tests/public-signup-authenticated-e2e-contract.mjs") },
        @{ Name = "functions public signup automation contract"; Command = "node"; Arguments = @("tests/functions-public-signup-automation-contract.mjs") },
        @{ Name = "public signup PowerShell menu contract"; Command = "node"; Arguments = @("tests/public-signup-powershell-menu-contract.mjs") },
        @{ Name = "functions automation coverage contract"; Command = "node"; Arguments = @("tests/functions-automation-coverage-contract.mjs") },
        @{ Name = "roadmap 0.24.33.1 contract"; Command = "node"; Arguments = @("tests/roadmap-0.24.33.1-contract.mjs") },
        @{ Name = "roadmap development contract"; Command = "node"; Arguments = @("tests/roadmap-development-contract.mjs") },
        @{ Name = "pipeline repo state publication contract"; Command = "node"; Arguments = @("tests/pipeline-repo-state-publication-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") },
        @{ Name = "unicode encoding contract"; Command = "node"; Arguments = @("tests/unicode-encoding-contract.mjs") },
        @{ Name = "PowerShell encoding contract"; Command = "node"; Arguments = @("tests/pipeline-powershell-encoding-contract.mjs") },
        @{ Name = "authorization runtime boundary contract"; Command = "node"; Arguments = @("tests/authorization-runtime-boundary-contract.mjs") },
        @{ Name = "workspace member session guard contract"; Command = "node"; Arguments = @("tests/workspace-member-session-guard-contract.mjs") }
    );
    "public-signup-first-draft-fix" = @(
        @{
            Name = "targeted ESLint";
            Command = "node";
            Arguments = @(
                "node_modules/eslint/bin/eslint.js",
                "app/api/signup/application/certificate/route.ts",
                "components/signup/SignupApplicationDashboard.tsx",
                "lib/constants/version.ts",
                "lib/internal/roadmap/index.ts",
                "lib/internal/roadmap/roadmap-0.24.34.1.ts",
                "tools/pipeline/peacebypiece-auto-pipeline.ps1",
                "tools/pipeline/verify-safe.ps1",
                "tests/public-signup-first-draft-contract.mjs",
                "tests/repo-state-workorder-size-pdf-metadata-contract.mjs",
                "tests/roadmap-0.24.34.1-contract.mjs"
            )
        },
        @{ Name = "tsc --noEmit"; Command = "node"; Arguments = @("node_modules/typescript/bin/tsc", "--noEmit") },
        @{ Name = "public signup first-draft contract"; Command = "node"; Arguments = @("tests/public-signup-first-draft-contract.mjs") },
        @{ Name = "repo-state workorder size/PDF metadata contract"; Command = "node"; Arguments = @("tests/repo-state-workorder-size-pdf-metadata-contract.mjs") },
        @{ Name = "roadmap 0.24.34.1 contract"; Command = "node"; Arguments = @("tests/roadmap-0.24.34.1-contract.mjs") },
        @{ Name = "public signup authenticated e2e contract"; Command = "node"; Arguments = @("tests/public-signup-authenticated-e2e-contract.mjs") },
        @{ Name = "public signup e2e UX contract"; Command = "node"; Arguments = @("tests/public-signup-e2e-ux-contract.mjs") },
        @{ Name = "billing approval gate contract"; Command = "node"; Arguments = @("tests/billing-approval-gate-contract.mjs") },
        @{ Name = "signup approval provisioning foundation contract"; Command = "node"; Arguments = @("tests/signup-approval-provisioning-foundation-contract.mjs") },
        @{ Name = "workorder size spec contract"; Command = "node"; Arguments = @("tests/workorder-size-spec-contract.mjs") },
        @{ Name = "workorder incomplete/final PDF contract"; Command = "node"; Arguments = @("tests/workorder-incomplete-final-pdf-contract.mjs") },
        @{ Name = "roadmap development contract"; Command = "node"; Arguments = @("tests/roadmap-development-contract.mjs") },
        @{ Name = "pipeline repo state publication contract"; Command = "node"; Arguments = @("tests/pipeline-repo-state-publication-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") },
        @{ Name = "unicode encoding contract"; Command = "node"; Arguments = @("tests/unicode-encoding-contract.mjs") },
        @{ Name = "PowerShell encoding contract"; Command = "node"; Arguments = @("tests/pipeline-powershell-encoding-contract.mjs") },
        @{ Name = "authorization runtime boundary contract"; Command = "node"; Arguments = @("tests/authorization-runtime-boundary-contract.mjs") },
        @{ Name = "workspace member session guard contract"; Command = "node"; Arguments = @("tests/workspace-member-session-guard-contract.mjs") }
    );
    "customer-product-ux-cleanup" = @(
        @{
            Name = "targeted ESLint";
            Command = "node";
            Arguments = @(
                "node_modules/eslint/bin/eslint.js",
                "app/api/admin/company-files/file/route.ts",
                "app/api/workorders/[workOrderId]/generated/workorder-pdf/route.ts",
                "app/api/workorders/[workOrderId]/generated/workorder-pdf/[attachmentId]/view/route.ts",
                "app/(system)/system/catalog/page.tsx",
                "components/admin/settings/AdminCompanyFilesPanel.tsx",
                "components/signup/SignupApplicationDashboard.tsx",
                "components/workorder/detail/WorkOrderSizeSpecPanel.tsx",
                "lib/admin/settings/companyFileRepository.ts",
                "lib/constants/version.ts",
                "lib/internal/roadmap/index.ts",
                "lib/internal/roadmap/roadmap-0.24.34.2.ts",
                "lib/workorder/generatedDocuments.ts",
                "tools/pipeline/approved-workflow.ps1",
                "tools/pipeline/peacebypiece-auto-pipeline.ps1",
                "tools/pipeline/verify-safe.ps1",
                "tests/customer-product-ux-0.24.34.2-contract.mjs",
                "tests/roadmap-0.24.34.2-contract.mjs",
                "tests/roadmap-development-contract.mjs",
                "tests/workorder-pdf-auto-output-contract.mjs",
                "tests/workorder-size-spec-contract.mjs"
            )
        },
        @{ Name = "tsc --noEmit"; Command = "node"; Arguments = @("node_modules/typescript/bin/tsc", "--noEmit") },
        @{ Name = "customer product UX contract"; Command = "node"; Arguments = @("tests/customer-product-ux-0.24.34.2-contract.mjs") },
        @{ Name = "workorder PDF auto output contract"; Command = "node"; Arguments = @("tests/workorder-pdf-auto-output-contract.mjs") },
        @{ Name = "roadmap 0.24.34.2 contract"; Command = "node"; Arguments = @("tests/roadmap-0.24.34.2-contract.mjs") },
        @{ Name = "workorder size spec contract"; Command = "node"; Arguments = @("tests/workorder-size-spec-contract.mjs") },
        @{ Name = "workorder incomplete/final PDF contract"; Command = "node"; Arguments = @("tests/workorder-incomplete-final-pdf-contract.mjs") },
        @{ Name = "workorder PDF policy contract"; Command = "node"; Arguments = @("tests/workorder-pdf-policy-contract.mjs") },
        @{ Name = "workorder PDF viewer contract"; Command = "node"; Arguments = @("tests/workorder-pdf-viewer-contract.mjs") },
        @{ Name = "system catalog schema contract"; Command = "node"; Arguments = @("tests/system-catalog-schema-contract.mjs") },
        @{ Name = "public signup first-draft contract"; Command = "node"; Arguments = @("tests/public-signup-first-draft-contract.mjs") },
        @{ Name = "public signup e2e UX contract"; Command = "node"; Arguments = @("tests/public-signup-e2e-ux-contract.mjs") },
        @{ Name = "roadmap development contract"; Command = "node"; Arguments = @("tests/roadmap-development-contract.mjs") },
        @{ Name = "pipeline repo state publication contract"; Command = "node"; Arguments = @("tests/pipeline-repo-state-publication-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") },
        @{ Name = "unicode encoding contract"; Command = "node"; Arguments = @("tests/unicode-encoding-contract.mjs") },
        @{ Name = "PowerShell encoding contract"; Command = "node"; Arguments = @("tests/pipeline-powershell-encoding-contract.mjs") },
        @{ Name = "authorization runtime boundary contract"; Command = "node"; Arguments = @("tests/authorization-runtime-boundary-contract.mjs") },
        @{ Name = "workspace member session guard contract"; Command = "node"; Arguments = @("tests/workspace-member-session-guard-contract.mjs") }
    );
    "product-ui-runtime-verification" = @(
        @{
            Name = "targeted ESLint";
            Command = "node";
            Arguments = @(
                "node_modules/eslint/bin/eslint.js",
                "app/(public)/signup/page.tsx",
                "app/api/workorders/[workOrderId]/generated/order-request-pdf/[attachmentId]/view/route.ts",
                "app/api/workorders/[workOrderId]/generated/workorder-pdf/[attachmentId]/view/route.ts",
                "components/signup/SignupApplicationDashboard.tsx",
                "components/system/signup/SystemSignupReviewDetailActions.tsx",
                "components/system/signup/SystemSignupReviewDetailView.tsx",
                "components/system/signup/SystemSignupReviewListView.tsx",
                "components/workorder/WorkOrderDetailErrorState.tsx",
                "components/workorder/WorkOrderLayout.tsx",
                "components/workorder/factoryInstruction/WorkOrderFactoryInstructionPanel.tsx",
                "components/workorder/layout/WorkOrderDesktopWorkspaceView.tsx",
                "components/workorder/layout/WorkOrderMobileWorkspaceView.tsx",
                "components/workorder/layout/WorkOrderTabletWorkspaceView.tsx",
                "components/workorder/layout/types.ts",
                "features/workorders/controllers/useWorkOrderWorkspaceController.ts",
                "lib/constants/version.ts",
                "lib/hooks/useWorkOrder.ts",
                "lib/hooks/workorder/useWorkOrderCoreState.ts",
                "lib/internal/roadmap/index.ts",
                "lib/internal/roadmap/roadmap-0.24.34.5.ts",
                "lib/responsive/useWorkspaceLayoutMode.ts",
                "lib/routing/opaqueRouteParams.ts",
                "lib/workorder/factoryInstruction/apiClient.ts",
                "tools/pipeline/verify-safe.ps1",
                "tests/authorization-runtime-boundary-contract.mjs",
                "tests/e2e/product-qa-0.24.34.5.spec.mjs",
                "tests/e2e/public-signup-e2e.spec.mjs",
                "tests/e2e/workorder-live-product-0.24.34.5.spec.mjs",
                "tests/product-ui-runtime-evidence-0.24.34.5-contract.mjs",
                "tests/roadmap-0.24.34.5-contract.mjs",
                "tests/roadmap-development-contract.mjs",
                "tests/signup-system-ui-copy-0.24.34.5-contract.mjs",
                "tests/workorder-0.24.34.5-runtime-remediation-contract.mjs",
                "tests/workorder-pdf-viewer-contract.mjs"
            )
        },
        @{ Name = "tsc --noEmit"; Command = "node"; Arguments = @("node_modules/typescript/bin/tsc", "--noEmit") },
        @{ Name = "workorder 0.24.34.5 runtime remediation contract"; Command = "node"; Arguments = @("tests/workorder-0.24.34.5-runtime-remediation-contract.mjs") },
        @{ Name = "product UI runtime evidence 0.24.34.5 contract"; Command = "node"; Arguments = @("tests/product-ui-runtime-evidence-0.24.34.5-contract.mjs") },
        @{ Name = "signup/system UI copy 0.24.34.5 contract"; Command = "node"; Arguments = @("tests/signup-system-ui-copy-0.24.34.5-contract.mjs") },
        @{ Name = "workorder PDF viewer contract"; Command = "node"; Arguments = @("tests/workorder-pdf-viewer-contract.mjs") },
        @{ Name = "workorder PDF live integration contract"; Command = "node"; Arguments = @("tests/workorder-pdf-live-integration-contract.mjs") },
        @{ Name = "public signup authenticated e2e contract"; Command = "node"; Arguments = @("tests/public-signup-authenticated-e2e-contract.mjs") },
        @{ Name = "public signup e2e UX contract"; Command = "node"; Arguments = @("tests/public-signup-e2e-ux-contract.mjs") },
        @{ Name = "roadmap 0.24.34.5 contract"; Command = "node"; Arguments = @("tests/roadmap-0.24.34.5-contract.mjs") },
        @{ Name = "roadmap development contract"; Command = "node"; Arguments = @("tests/roadmap-development-contract.mjs") },
        @{ Name = "pipeline repo state publication contract"; Command = "node"; Arguments = @("tests/pipeline-repo-state-publication-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") },
        @{ Name = "unicode encoding contract"; Command = "node"; Arguments = @("tests/unicode-encoding-contract.mjs") },
        @{ Name = "PowerShell encoding contract"; Command = "node"; Arguments = @("tests/pipeline-powershell-encoding-contract.mjs") },
        @{ Name = "authorization runtime boundary contract"; Command = "node"; Arguments = @("tests/authorization-runtime-boundary-contract.mjs") },
        @{ Name = "workspace member session guard contract"; Command = "node"; Arguments = @("tests/workspace-member-session-guard-contract.mjs") }
    );
    "workorder-pdf-live-integration" = @(
        @{
            Name = "targeted ESLint";
            Command = "node";
            Arguments = @(
                "node_modules/eslint/bin/eslint.js",
                "app/api/workorders/[workOrderId]/generated/workorder-pdf/route.ts",
                "app/api/workorders/[workOrderId]/generated/workorder-pdf/[attachmentId]/view/route.ts",
                "lib/constants/version.ts",
                "lib/internal/roadmap/index.ts",
                "lib/internal/roadmap/roadmap-0.24.34.3.ts",
                "lib/workorder/generatedDocuments.ts",
                "lib/workorder/serverWorkorderPdf.ts",
                "scripts/run-pdf-r2-lifecycle-integration.mjs",
                "tools/pipeline/approved-workflow.ps1",
                "tools/pipeline/peacebypiece-auto-pipeline.ps1",
                "tools/pipeline/verify-safe.ps1",
                "tests/roadmap-0.24.34.3-contract.mjs",
                "tests/roadmap-development-contract.mjs",
                "tests/workorder-incomplete-final-pdf-contract.mjs",
                "tests/workorder-pdf-auto-output-contract.mjs",
                "tests/workorder-pdf-live-integration-contract.mjs"
            )
        },
        @{ Name = "tsc --noEmit"; Command = "node"; Arguments = @("node_modules/typescript/bin/tsc", "--noEmit") },
        @{ Name = "workorder PDF live integration contract"; Command = "node"; Arguments = @("tests/workorder-pdf-live-integration-contract.mjs") },
        @{ Name = "workorder incomplete/final PDF contract"; Command = "node"; Arguments = @("tests/workorder-incomplete-final-pdf-contract.mjs") },
        @{ Name = "workorder PDF auto output contract"; Command = "node"; Arguments = @("tests/workorder-pdf-auto-output-contract.mjs") },
        @{ Name = "workorder PDF policy contract"; Command = "node"; Arguments = @("tests/workorder-pdf-policy-contract.mjs") },
        @{ Name = "workorder PDF viewer contract"; Command = "node"; Arguments = @("tests/workorder-pdf-viewer-contract.mjs") },
        @{ Name = "PDF/R2 pipeline menu contract"; Command = "node"; Arguments = @("tests/pdf-r2-pipeline-menu-contract.mjs") },
        @{ Name = "roadmap 0.24.34.3 contract"; Command = "node"; Arguments = @("tests/roadmap-0.24.34.3-contract.mjs") },
        @{ Name = "roadmap development contract"; Command = "node"; Arguments = @("tests/roadmap-development-contract.mjs") },
        @{ Name = "pipeline repo state publication contract"; Command = "node"; Arguments = @("tests/pipeline-repo-state-publication-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") },
        @{ Name = "unicode encoding contract"; Command = "node"; Arguments = @("tests/unicode-encoding-contract.mjs") },
        @{ Name = "PowerShell encoding contract"; Command = "node"; Arguments = @("tests/pipeline-powershell-encoding-contract.mjs") },
        @{ Name = "authorization runtime boundary contract"; Command = "node"; Arguments = @("tests/authorization-runtime-boundary-contract.mjs") },
        @{ Name = "workspace member session guard contract"; Command = "node"; Arguments = @("tests/workspace-member-session-guard-contract.mjs") }
    );
    "workorder-size-pdf" = @(
        @{
            Name = "targeted ESLint";
            Command = "node";
            Arguments = @(
                "node_modules/eslint/bin/eslint.js",
                "app/api/workorders/[workOrderId]/generated/workorder-pdf/route.ts",
                "app/api/workorders/[workOrderId]/generated/workorder-pdf/[attachmentId]/view/route.ts",
                "app/api/workorders/[workOrderId]/size-spec/route.ts",
                "components/workorder/detail/WorkOrderSizeSpecPanel.tsx",
                "lib/workorder/generatedDocuments.ts",
                "lib/workorder/serverWorkorderPdf.ts",
                "lib/workorder/sizeSpec/repository.ts",
                "lib/workorder/sizeSpec/types.ts",
                "lib/workorder/sizeSpec/valuePolicy.ts",
                "lib/constants/version.ts",
                "lib/internal/roadmap/index.ts",
                "lib/internal/roadmap/roadmap-0.24.34.ts",
                "scripts/run-approved-db-migration.mjs",
                "scripts/run-readonly-db-audit.mjs",
                "tests/roadmap-0.24.34-contract.mjs",
                "tests/workorder-incomplete-final-pdf-contract.mjs",
                "tests/workorder-size-pdf-powershell-menu-contract.mjs",
                "tests/workorder-size-spec-contract.mjs"
            )
        },
        @{ Name = "tsc --noEmit"; Command = "node"; Arguments = @("node_modules/typescript/bin/tsc", "--noEmit") },
        @{ Name = "workorder size spec contract"; Command = "node"; Arguments = @("tests/workorder-size-spec-contract.mjs") },
        @{ Name = "workorder incomplete/final PDF contract"; Command = "node"; Arguments = @("tests/workorder-incomplete-final-pdf-contract.mjs") },
        @{ Name = "workorder size/PDF PowerShell menu contract"; Command = "node"; Arguments = @("tests/workorder-size-pdf-powershell-menu-contract.mjs") },
        @{ Name = "roadmap 0.24.34 contract"; Command = "node"; Arguments = @("tests/roadmap-0.24.34-contract.mjs") },
        @{ Name = "workorder PDF policy contract"; Command = "node"; Arguments = @("tests/workorder-pdf-policy-contract.mjs") },
        @{ Name = "workorder PDF viewer contract"; Command = "node"; Arguments = @("tests/workorder-pdf-viewer-contract.mjs") },
        @{ Name = "system catalog schema contract"; Command = "node"; Arguments = @("tests/system-catalog-schema-contract.mjs") },
        @{ Name = "roadmap development contract"; Command = "node"; Arguments = @("tests/roadmap-development-contract.mjs") },
        @{ Name = "pipeline repo state publication contract"; Command = "node"; Arguments = @("tests/pipeline-repo-state-publication-contract.mjs") },
        @{ Name = "approved workflow contract"; Command = "node"; Arguments = @("tests/approved-workflow-contract.mjs") },
        @{ Name = "unicode encoding contract"; Command = "node"; Arguments = @("tests/unicode-encoding-contract.mjs") },
        @{ Name = "PowerShell encoding contract"; Command = "node"; Arguments = @("tests/pipeline-powershell-encoding-contract.mjs") },
        @{ Name = "authorization runtime boundary contract"; Command = "node"; Arguments = @("tests/authorization-runtime-boundary-contract.mjs") },
        @{ Name = "workspace member session guard contract"; Command = "node"; Arguments = @("tests/workspace-member-session-guard-contract.mjs") }
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
$allowedMigrationChanges = @()
if ($Profile -eq "billing-operations") {
    $allowedMigrationChanges = @("db/migrations/patch_0_24_32_billing_operations.sql")
}
if ($Profile -eq "public-signup-e2e") {
    $allowedMigrationChanges = @("db/migrations/patch_0_24_33_public_signup_e2e.sql")
}
if ($Profile -eq "workorder-size-pdf") {
    $allowedMigrationChanges = @("db/migrations/patch_0_24_34_workorder_size_spec_and_pdf.sql")
}
if ($Profile -eq "automation-infrastructure" -and (GetProjectAppVersion) -in @("2.0.0-alpha.21", "2.0.0-alpha.22")) {
    $allowedMigrationChanges = @(
        "db/v2/migrations/001_v2_tenant_document_number_foundation.sql",
        "db/v2/migrations/002_v2_work_orders_revisions.sql",
        "db/v2/migrations/003_v2_revision_content.sql",
        "db/v2/migrations/004_v2_assets_revision_linkage.sql",
        "db/v2/migrations/005_v2_documents_access_events.sql",
        "db/v2/migrations/006_v2_deferred_constraints_indexes.sql"
    )
}
if ($Profile -eq "automation-infrastructure" -and (GetProjectAppVersion) -eq "2.0.0-alpha.23") {
    $allowedMigrationChanges = @("db/v2/migrations/007_v2_work_order_list_material_lookup_index.sql")
}
if ($Profile -eq "automation-infrastructure" -and (GetProjectAppVersion) -in @("2.0.0-alpha.26", "2.0.0-alpha.27") -and (Test-Path (Join-Path $ProjectDir "tests/workorder-v2-alpha27a-number-settings-migration-contract.mjs"))) {
    $allowedMigrationChanges = @("db/v2/migrations/008_v2_tenant_document_number_settings_function.sql")
}
if ($Profile -eq "automation-infrastructure" -and (GetProjectAppVersion) -in @("2.0.0-alpha.29", "2.0.0-alpha.30") -and (Test-Path (Join-Path $ProjectDir "tests/workorder-v2-alpha30-factory-instruction-contract.mjs"))) {
    $allowedMigrationChanges = @("db/v2/migrations/009_v2_workorder_factory_instruction_fields.sql")
}
if ($Profile -eq "automation-infrastructure" -and (GetProjectAppVersion) -eq "2.0.0-alpha.38" -and (Test-Path (Join-Path $ProjectDir "tests/workorder-v2-alpha38-pdf-r2-runtime-contract.mjs"))) {
    $allowedMigrationChanges = @("db/v2/migrations/010_v2_generated_document_receipt_link.sql")
}
$unexpectedMigrationChanges = @($migrationChanges | Where-Object { $allowedMigrationChanges -notcontains $_ })
if ($unexpectedMigrationChanges.Count -gt 0) {
    Write-Host "[FAIL] unexpected DB migration/schema changes: $($migrationChanges -join ', ')" -ForegroundColor Red
    $results.Add([pscustomobject]@{ Name = "DB migration unchanged"; Passed = $false; Skipped = $false; ExitCode = 1 })
}
elseif ($migrationChanges.Count -gt 0) {
    Write-Host "[PASS] DB migration scoped to profile: $($migrationChanges -join ', ')"
    $results.Add([pscustomobject]@{ Name = "DB migration scoped"; Passed = $true; Skipped = $false; ExitCode = 0 })
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

$results.Add((InvokePackageScriptCheck -Name "npm run build" -ScriptName "build"))
$results.Add((InvokePackageScriptCheck -Name "npm run audit:wafl-mutations" -ScriptName "audit:wafl-mutations"))

if ($Profile -eq "repository-cleanup") {
    $results.Add((InvokeRepositoryCleanupCheck))
}

foreach ($commandSpec in $profileCommands[$Profile]) {
    $results.Add((InvokeCheck -Name $commandSpec.Name -Command $commandSpec.Command -Arguments $commandSpec.Arguments))
}

if ($Profile -eq "automation-infrastructure" -and (GetProjectAppVersion) -eq "2.0.0-alpha.22") {
    $results.Add((InvokeWaflV2Alpha22EvidenceCheck))
}
if ($Profile -eq "automation-infrastructure" -and (GetProjectAppVersion) -eq "2.0.0-alpha.23") {
    $results.Add((InvokeWaflV2Alpha23EvidenceCheck))
}
if ($Profile -eq "automation-infrastructure" -and (GetProjectAppVersion) -eq "2.0.0-alpha.24") {
    $results.Add((InvokeWaflV2Alpha23EvidenceCheck))
    $results.Add((InvokeWaflV2Alpha24EvidenceCheck))
}
if ($Profile -eq "automation-infrastructure" -and (GetProjectAppVersion) -eq "2.0.0-alpha.25") {
    $results.Add((InvokeWaflV2Alpha23EvidenceCheck))
    $results.Add((InvokeWaflV2Alpha24EvidenceCheck))
    $results.Add((InvokeWaflV2Alpha25EvidenceCheck))
}
if ($Profile -eq "automation-infrastructure" -and (GetProjectAppVersion) -eq "2.0.0-alpha.26") {
    $results.Add((InvokeWaflV2Alpha23EvidenceCheck))
    $results.Add((InvokeWaflV2Alpha24EvidenceCheck))
    $results.Add((InvokeWaflV2Alpha25EvidenceCheck))
    $results.Add((InvokeWaflV2Alpha26CompletionEvidenceCheck))
}
if ($Profile -eq "automation-infrastructure" -and (GetProjectAppVersion) -eq "2.0.0-alpha.27") {
    $results.Add((InvokeWaflV2Alpha23EvidenceCheck))
    $results.Add((InvokeWaflV2Alpha24EvidenceCheck))
    $results.Add((InvokeWaflV2Alpha25EvidenceCheck))
    $results.Add((InvokeWaflV2Alpha26CompletionEvidenceCheck))
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
if ($null -ne $script:WaflV2Alpha22Evidence) {
    $lines.Add("")
    $lines.Add("DB Migration Apply Result: PASS")
    $lines.Add("Post-Apply Audit Result: PASS")
    $lines.Add("Schema Migration This Run: true; db/v2 migrations 001-006 on approved dev/test only")
    $lines.Add("Dev/Test DB Test-Data Mutation: true; deterministic wafl-fn profiles 500+5000+5400")
    $lines.Add("Dev/Test Fixture Mutation: true; deterministic synthetic fixtures only")
    $lines.Add("Business Data Mutation: false")
    $lines.Add("Production Business Data Mutation: false")
    $lines.Add("Dev/Test R2 Mutation: false")
    $lines.Add("Production Mutation: false")
    $lines.Add("E2E/Smoke Summary: PASS - RLS/cursor/concurrency/idempotency/revision/readiness/document sequence")
    $lines.Add("Manual QA Status: NOT_APPLICABLE - DB architecture/runtime evidence only")
    $lines.Add("V2 Migration Ledger: 6/6 PASS")
    $lines.Add("V2 Seed Profiles: a500=500; b5000=5000; c-multi=5400")
    $lines.Add("V2 Performance 500: $($script:WaflV2Alpha22Evidence.Performance500)")
    $lines.Add("V2 Performance 5000: $($script:WaflV2Alpha22Evidence.Performance5000)")
}
if ($null -ne $script:WaflV2Alpha23Evidence -and (GetProjectAppVersion) -eq "2.0.0-alpha.23") {
    $lines.Add("")
    $lines.Add("DB Migration Apply Result: PASS - alpha.23 additive index 007 on approved dev/test only")
    $lines.Add("Post-Apply Audit Result: PASS - ledger/index/v1 baseline and read-only runtime evidence")
    $lines.Add("Schema Migration This Run: true; 007_v2_work_order_list_material_lookup_index.sql")
    $lines.Add("Dev/Test DB Test-Data Mutation: false")
    $lines.Add("Dev/Test Fixture Mutation: false")
    $lines.Add("Business Data Mutation: false")
    $lines.Add("Production Business Data Mutation: false")
    $lines.Add("Dev/Test R2 Mutation: false")
    $lines.Add("Production Mutation: false")
    $lines.Add("E2E/Smoke Summary: PASS - authenticated tenant list API, cursor traversal, typed errors, payload and performance budgets")
    $lines.Add("Manual QA Status: NOT_APPLICABLE - read-only API vertical slice")
    $lines.Add("V2 Migration Ledger: 7/7 PASS; 001-006 reused, 007 added")
    $lines.Add("V2 Alpha.23 Runtime Log: $($script:WaflV2Alpha23Evidence.RuntimeLog)")
    $lines.Add("V2 Alpha.23 Cursor 500: $($script:WaflV2Alpha23Evidence.Cursor500)")
    $lines.Add("V2 Alpha.23 Cursor 5000: $($script:WaflV2Alpha23Evidence.Cursor5000)")
    $lines.Add("V2 Alpha.23 Default 30 Payload Bytes: $($script:WaflV2Alpha23Evidence.DefaultPayloadBytes)")
}
if ($null -ne $script:WaflV2Alpha24Evidence -and (GetProjectAppVersion) -eq "2.0.0-alpha.24") {
    $lines.Add("")
    $lines.Add("DB Migration Apply Result: NOT_APPLIED - alpha.24 reused ledger 7 and index 007")
    $lines.Add("Post-Apply Audit Result: NOT_APPLICABLE - read-only detail/lazy API verification")
    $lines.Add("Schema Migration This Run: false")
    $lines.Add("Dev/Test DB Test-Data Mutation: false")
    $lines.Add("Dev/Test Fixture Mutation: false")
    $lines.Add("Business Data Mutation: false")
    $lines.Add("Production Business Data Mutation: false")
    $lines.Add("Dev/Test R2 Mutation: false")
    $lines.Add("Production Mutation: false")
    $lines.Add("E2E/Smoke Summary: PASS - authenticated tenant core/detail lazy reads, cursor, typed errors, payload and performance budgets")
    $lines.Add("Manual QA Status: NOT_APPLICABLE - read-only API vertical slice")
    $lines.Add("V2 Migration Ledger: 7/7 PASS; reused without alpha.24 mutation")
    $lines.Add("V2 Alpha.24 Runtime Log: $($script:WaflV2Alpha24Evidence.RuntimeLog)")
    $lines.Add("V2 Alpha.24 Route Metric Count: $($script:WaflV2Alpha24Evidence.RouteMetricCount)")
    $lines.Add("V2 Alpha.24 Accessory Cursor: $($script:WaflV2Alpha24Evidence.AccessoryCursor)")
    $lines.Add("V2 Alpha.24 Asset Cursor: $($script:WaflV2Alpha24Evidence.AssetCursor)")
}
if ($null -ne $script:WaflV2Alpha25Evidence -and (GetProjectAppVersion) -eq "2.0.0-alpha.25") {
    $lines.Add("")
    $lines.Add("DB Migration Apply Result: NOT_APPLIED - alpha.25 reused ledger 7 and index 007")
    $lines.Add("Post-Apply Audit Result: NOT_APPLICABLE - approved Command runtime without schema mutation")
    $lines.Add("Schema Migration This Run: false")
    $lines.Add("Dev/Test DB Test-Data Mutation: true; one retained alpha.25 synthetic WorkOrder/R0/receipt and three events")
    $lines.Add("Dev/Test Fixture Mutation: true; approved deterministic synthetic Command fixture only")
    $lines.Add("Business Data Mutation: false")
    $lines.Add("Production Business Data Mutation: false")
    $lines.Add("Dev/Test R2 Mutation: false")
    $lines.Add("Production Mutation: false")
    $lines.Add("E2E/Smoke Summary: PASS - create, idempotency, basic update, optimistic concurrency, tenant isolation, revision lock, audit and alpha.23/24 reads")
    $lines.Add("Manual QA Status: NOT_APPLICABLE - API Command vertical slice")
    $lines.Add("V2 Migration Ledger: 7/7 PASS; reused without alpha.25 schema mutation")
    $lines.Add("V2 Alpha.25 Runtime Log: $($script:WaflV2Alpha25Evidence.RuntimeLog)")
    $lines.Add("V2 Alpha.25 Command Metrics: $($script:WaflV2Alpha25Evidence.CommandMetrics)")
}
if ($null -ne $script:WaflV2Alpha26Evidence -and (GetProjectAppVersion) -in @("2.0.0-alpha.26", "2.0.0-alpha.27")) {
    $lines.Add("")
    $lines.Add("DB Migration Apply Result: NOT_APPLIED - alpha.26 reused ledger 7 and index 007")
    $lines.Add("Post-Apply Audit Result: PASS - NO_PARTIAL_MUTATION and GET-only completion evidence")
    $lines.Add("Schema Migration This Run: false")
    $lines.Add("Dev/Test DB Test-Data Mutation: true; approved retained alpha.26 synthetic fabric 2, accessory 1, receipts 9, events 11, version transitions 11")
    $lines.Add("Dev/Test Fixture Mutation: true; approved bounded synthetic material Command fixture only")
    $lines.Add("Business Data Mutation: false")
    $lines.Add("Production Business Data Mutation: false")
    $lines.Add("Dev/Test R2 Mutation: false")
    $lines.Add("Production Mutation: false")
    $lines.Add("E2E/Smoke Summary: PASS - material commands, idempotency, concurrency, tenant isolation, LOCKED evidence, audit and alpha.23-25 reads")
    $lines.Add("Manual QA Status: NOT_APPLICABLE - API Command vertical slice")
    $lines.Add("V2 Migration Ledger: 7/7 PASS; reused without alpha.26 schema mutation")
    $lines.Add("V2 Alpha.26 Completion Log: $($script:WaflV2Alpha26Evidence.CompletionLog)")
    $lines.Add("V2 Alpha.26 Read-Only Audit Log: $($script:WaflV2Alpha26Evidence.AuditLog)")
    $lines.Add("V2 Alpha.26 GET Summary: $($script:WaflV2Alpha26Evidence.GetSummary)")
}
[System.IO.File]::WriteAllLines($resultPath, $lines, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "VERIFY_SAFE_RESULT: $status"
Write-Host "Result file: $resultPath"

if ($failedResults.Count -gt 0) {
    exit 1
}

exit 0
