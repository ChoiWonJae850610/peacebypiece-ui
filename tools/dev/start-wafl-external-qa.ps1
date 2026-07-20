param(
    [ValidateSet("production", "development")]
    [string]$NextMode = "production",
    [ValidateSet("ExpoTunnelLegacyDisabled", "Lan", "TailscaleLan", "DeveloperAutoConnect")]
    [string]$MobileTransport = "TailscaleLan",
    [int]$NextPort = 3000,
    [int]$ExpoPort = 8081,
    [string]$CloudflaredPath = "",
    [switch]$EnableAlpha46BasicInfoMutation,
    [switch]$EnableAlpha50MaterialDraftMutation,
    [switch]$EnableAlpha51MaterialLifecycleMutation
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "wafl-external-qa-common.ps1")
. (Join-Path $PSScriptRoot "..\pipeline\pipeline-common.ps1")

if (@($EnableAlpha46BasicInfoMutation, $EnableAlpha50MaterialDraftMutation, $EnableAlpha51MaterialLifecycleMutation).Where({ $_ }).Count -gt 1) {
    throw "EXTERNAL_QA_MUTATION_MODES_ARE_MUTUALLY_EXCLUSIVE"
}

function Get-WaflQaDatabaseUrl {
    param([Parameter(Mandatory = $true)][string]$RepositoryRoot)

    $processValue = [Environment]::GetEnvironmentVariable("DATABASE_URL", "Process")
    if (-not [string]::IsNullOrWhiteSpace($processValue)) { return $processValue.Trim() }

    $envPath = Join-Path $RepositoryRoot ".env.local"
    if (-not (Test-Path -LiteralPath $envPath -PathType Leaf)) { return $null }
    foreach ($line in Get-Content -LiteralPath $envPath -Encoding UTF8) {
        $match = [regex]::Match($line, '^\s*DATABASE_URL\s*=\s*(.*)\s*$')
        if (-not $match.Success) { continue }
        $value = $match.Groups[1].Value.Trim()
        if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        return $(if ([string]::IsNullOrWhiteSpace($value)) { $null } else { $value })
    }
    return $null
}

function Test-WaflQaReadApiTarget {
    param([Parameter(Mandatory = $true)][string]$RepositoryRoot)

    $runtime = "dev"
    $allowedRuntimes = @([string[]]$PipelineConfig.Simulator.AllowedRuntimes)
    $testPrefix = ([string]$PipelineConfig.Simulator.TestPrefix).Trim()
    $approvedFingerprint = ([string]$PipelineConfig.Simulator.ApprovedDbFingerprint).Trim().ToLowerInvariant()
    if ($allowedRuntimes -notcontains $runtime) { return [pscustomobject]@{ Passed = $false; Reason = "runtime-blocked" } }
    if ($testPrefix -ne "wafl-fn") { return [pscustomobject]@{ Passed = $false; Reason = "test-prefix-mismatch" } }
    if ([string]::IsNullOrWhiteSpace($approvedFingerprint)) { return [pscustomobject]@{ Passed = $false; Reason = "approved-fingerprint-missing" } }

    $databaseUrl = Get-WaflQaDatabaseUrl -RepositoryRoot $RepositoryRoot
    if ([string]::IsNullOrWhiteSpace($databaseUrl)) { return [pscustomobject]@{ Passed = $false; Reason = "database-url-missing" } }
    try {
        $uri = [System.Uri]$databaseUrl
        $databaseName = $uri.AbsolutePath.Trim('/')
        if (@("postgres", "postgresql") -notcontains $uri.Scheme.ToLowerInvariant() -or [string]::IsNullOrWhiteSpace($uri.Host) -or [string]::IsNullOrWhiteSpace($databaseName)) {
            return [pscustomobject]@{ Passed = $false; Reason = "database-url-invalid" }
        }
        $fingerprint = GetSha256HexPrefix -Value ("{0}/{1}" -f $uri.Host, $databaseName)
        if ($fingerprint -ne $approvedFingerprint) { return [pscustomobject]@{ Passed = $false; Reason = "fingerprint-mismatch" } }
        return [pscustomobject]@{
            Passed = $true
            Reason = "approved-dev-test-target"
            Runtime = $runtime
            TestPrefix = $testPrefix
            ApprovedFingerprint = $approvedFingerprint
            FingerprintPrefix = $fingerprint.Substring(0, [Math]::Min(6, $fingerprint.Length))
            DatabaseUrl = $databaseUrl
        }
    }
    catch {
        return [pscustomobject]@{ Passed = $false; Reason = "database-url-parse-failed" }
    }
}

$root = Get-WaflQaRepositoryRoot
if (-not (Test-Path -LiteralPath (Join-Path $root ".git") -PathType Container)) { throw "Repository root validation failed: $root" }
if ((Get-Location).Path -ne $root) { Set-Location -LiteralPath $root }

$node = Get-WaflQaExecutablePath -Name "node"
$npm = Get-WaflQaExecutablePath -Name "npm.cmd"
$npx = Get-WaflQaExecutablePath -Name "npx.cmd"
$cloudflared = Get-WaflQaCloudflaredPath -ExplicitPath $CloudflaredPath
if (-not $node -or -not $npm -or -not $npx) { throw "Node, npm, and npx must be available on PATH." }
if (-not $cloudflared) {
    throw "cloudflared was not found. Installation is not automatic. Approval command: winget install --id Cloudflare.cloudflared --exact"
}
if (-not (Test-WaflQaPortAvailable -Port $NextPort)) { throw "Next port is already in use: $NextPort" }
if (-not (Test-WaflQaPortAvailable -Port $ExpoPort)) { throw "Expo port is already in use: $ExpoPort" }

$nextCli = Join-Path $root "node_modules\next\dist\bin\next"
$expoCli = Join-Path $root "apps\mobile\node_modules\expo\bin\cli"
if (-not (Test-Path -LiteralPath $nextCli -PathType Leaf)) { throw "Next CLI not found: $nextCli" }
if (-not (Test-Path -LiteralPath $expoCli -PathType Leaf)) { throw "Expo CLI not found. Run the approved apps/mobile dependency setup first." }
if ($NextMode -eq "production" -and -not (Test-Path -LiteralPath (Join-Path $root ".next\BUILD_ID") -PathType Leaf)) {
    throw "Production build not found. Run the approved build verification before external QA."
}

$versionLine = Get-Content -LiteralPath (Join-Path $root "lib\constants\version.ts") -Raw -Encoding UTF8
$appVersion = [regex]::Match($versionLine, 'APP_VERSION\s*=\s*"([^"]+)"').Groups[1].Value
$gitStatus = @(git -C $root status --short)
Write-Host ("Repository: {0}" -f $root)
Write-Host ("APP_VERSION: {0}" -f $appVersion)
Write-Host ("Working tree entries: {0}" -f $gitStatus.Count)

$stateDir = Get-WaflQaStateDirectory
[System.IO.Directory]::CreateDirectory($stateDir) | Out-Null
$ownerMarker = [Guid]::NewGuid().ToString("N")
$runToken = ([Guid]::NewGuid().ToString("N") + [Guid]::NewGuid().ToString("N"))
$state = [ordered]@{
    schemaVersion = 1
    repositoryRoot = $root
    ownerMarker = $ownerMarker
    status = "starting"
    failureCode = $null
    appVersion = $appVersion
    workingTreeEntryCount = $gitStatus.Count
    nextMode = $NextMode
    mobileTransport = $MobileTransport
    nextPort = $NextPort
    expoPort = $ExpoPort
    tailscaleIpv4 = $null
    expoUrl = $null
    publicOrigin = $null
    startedAtUtc = [DateTime]::UtcNow.ToString("o")
    updatedAtUtc = [DateTime]::UtcNow.ToString("o")
    lastSuccessfulStage = "preflight"
    readApiGuard = "blocked"
    readApiRuntime = "dev-test"
    fingerprintVerified = $false
    fingerprintPrefix = $null
    tailscaleServeReady = $false
    tailscaleServeHostname = $null
    developerAutoConnectReady = $false
    developerIdentityVerified = $false
    developerLoginHashPrefix = $null
    serveConfigOwnership = "none"
    funnelUnchanged = $true
    commandApi = "blocked"
    mutationMode = "read-only"
    processes = @()
}
Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $state

try {
    $readApiTarget = Test-WaflQaReadApiTarget -RepositoryRoot $root
    if (-not $readApiTarget.Passed) { throw ("READ_API_GUARD_{0}" -f $readApiTarget.Reason.ToUpperInvariant().Replace('-', '_')) }
    $state.readApiGuard = "ready"
    $state.fingerprintVerified = $true
    $state.fingerprintPrefix = $readApiTarget.FingerprintPrefix
    $state.lastSuccessfulStage = "read-api-guard-ready"
    Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $state

    if ($MobileTransport -eq "ExpoTunnelLegacyDisabled") {
        throw "EXPO_TUNNEL_LEGACY_DISABLED"
    }
    $developerAutoConnect = $MobileTransport -eq "DeveloperAutoConnect"
    $tailscalePath = $null
    $developerIdentity = $null
    $developerMapping = $null
    if ($MobileTransport -in @("TailscaleLan", "DeveloperAutoConnect")) {
        $tailscalePath = Get-WaflQaTailscalePath
        if (-not $tailscalePath) { throw "TAILSCALE_CLI_MISSING" }
        $tailscaleRuntime = Get-WaflQaTailscaleRuntime -TailscalePath $tailscalePath
        $state.tailscaleIpv4 = $tailscaleRuntime.Ipv4
        $state.expoUrl = "exp://$($state.tailscaleIpv4):$ExpoPort"
        $state.lastSuccessfulStage = "tailscale-connected"
        Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $state
        if ($developerAutoConnect) {
            $developerIdentity = Get-WaflQaTailscaleDeveloperIdentity -TailscalePath $tailscalePath
            $serveStatus = @(& $tailscalePath serve status --json 2>$null)
            if ($LASTEXITCODE -ne 0 -or -not (Test-WaflQaEmptyJsonObject -Value $serveStatus)) { throw "TAILSCALE_EXISTING_SERVE_CONFIG_CONFLICT" }
            $funnelStatus = @(& $tailscalePath funnel status --json 2>$null)
            if ($LASTEXITCODE -ne 0 -or -not (Test-WaflQaEmptyJsonObject -Value $funnelStatus)) { throw "TAILSCALE_EXISTING_FUNNEL_CONFIG_CONFLICT" }

            $mappingEnvironment = @{
                DATABASE_URL = $readApiTarget.DatabaseUrl
                WAFL_ALPHA47_TAILSCALE_LOGIN = $developerIdentity.Login
                WAFL_ALPHA47_RUNTIME = $readApiTarget.Runtime
                WAFL_ALPHA47_TEST_PREFIX = $readApiTarget.TestPrefix
                WAFL_ALPHA47_APPROVED_DB_FINGERPRINT = $readApiTarget.ApprovedFingerprint
                NODE_NO_WARNINGS = "1"
            }
            $savedMapping = @{}
            try {
                foreach ($name in $mappingEnvironment.Keys) {
                    $savedMapping[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
                    [Environment]::SetEnvironmentVariable($name, [string]$mappingEnvironment[$name], "Process")
                }
                $mappingText = @(& $node (Join-Path $root "scripts\resolve-wafl-alpha47-developer-mapping.mjs") 2>$null)
                if ($LASTEXITCODE -ne 0 -or -not $mappingText.Count) { throw "ALPHA47_DEVELOPER_MAPPING_PREFLIGHT_FAILED" }
                $developerMapping = ($mappingText -join "`n") | ConvertFrom-Json
            }
            finally {
                foreach ($name in $mappingEnvironment.Keys) { [Environment]::SetEnvironmentVariable($name, $savedMapping[$name], "Process") }
            }
            if (-not $developerMapping.ok -or $developerMapping.activeSystemAdminCount -ne 1 -or $developerMapping.companyATargetCount -ne 1 -or $developerMapping.workorderRead -ne $true) {
                throw "ALPHA47_DEVELOPER_MAPPING_NOT_EXACT"
            }
            $state.tailscaleServeHostname = $developerIdentity.DnsName
            $state.developerIdentityVerified = $true
            $state.developerLoginHashPrefix = ([string]$developerMapping.tailscaleLoginSha256).Substring(0, 6)
            $state.lastSuccessfulStage = "developer-identity-mapping-ready"
            Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $state
        }
    }

    $cloudflareStdout = Join-Path $stateDir "cloudflared.stdout.log"
    $cloudflareStderr = Join-Path $stateDir "cloudflared.stderr.log"
    $cloudflare = Start-WaflQaOwnedProcess -Role "cloudflared" -FilePath $cloudflared -ArgumentList @("tunnel", "--no-autoupdate", "--url", "http://127.0.0.1:$NextPort") -WorkingDirectory $root -OwnerMarker $ownerMarker -Environment @{} -StdoutPath $cloudflareStdout -StderrPath $cloudflareStderr
    $state.processes += $cloudflare
    $state.lastSuccessfulStage = "cloudflared-started"
    Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $state

    $deadline = [DateTime]::UtcNow.AddSeconds(45)
    $publicOrigin = $null
    while ([DateTime]::UtcNow -lt $deadline -and -not $publicOrigin) {
        foreach ($path in @($cloudflareStdout, $cloudflareStderr)) {
            if (Test-Path -LiteralPath $path -PathType Leaf) {
                $bounded = (Get-Content -LiteralPath $path -Tail 120 -Encoding UTF8) -join "`n"
                $match = [regex]::Match($bounded, 'https://[a-z0-9-]+\.trycloudflare\.com')
                if ($match.Success) { $publicOrigin = $match.Value; break }
            }
        }
        if (-not $publicOrigin) { Start-Sleep -Milliseconds 250 }
    }
    if (-not $publicOrigin) { throw "QUICK_TUNNEL_URL_NOT_FOUND" }
    $originUri = [Uri]$publicOrigin
    if ($originUri.Scheme -ne "https" -or $originUri.AbsolutePath -ne "/" -or -not $originUri.Host.EndsWith(".trycloudflare.com")) { throw "QUICK_TUNNEL_URL_INVALID" }
    $state.publicOrigin = $originUri.GetLeftPart([UriPartial]::Authority)
    $state.lastSuccessfulStage = "quick-tunnel-origin-validated"
    Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $state

    $serverEnvironment = @{
        WAFL_SERVER_RUNTIME_MODE = "dev"
        WAFL_EXTERNAL_QA_ENABLED = "true"
        WAFL_EXTERNAL_QA_ORIGIN = $state.publicOrigin
        WAFL_EXTERNAL_QA_HOST_ALLOWLIST = $originUri.Host
        WAFL_EXTERNAL_QA_RUN_TOKEN = $runToken
        WAFL_V2_READ_API_ENABLED = "1"
        WAFL_V2_READ_APPROVED = "1"
        WAFL_V2_RUNTIME = $readApiTarget.Runtime
        WAFL_V2_TEST_PREFIX = $readApiTarget.TestPrefix
        WAFL_V2_APPROVED_DB_FINGERPRINT = $readApiTarget.ApprovedFingerprint
    }
    if ($developerAutoConnect) {
        $serverEnvironment.WAFL_TAILSCALE_DEVELOPER_AUTO_CONNECT_ENABLED = "true"
        $serverEnvironment.WAFL_TAILSCALE_SERVE_ORIGIN = $developerIdentity.ServeOrigin
        $serverEnvironment.WAFL_TAILSCALE_SERVE_HOST_ALLOWLIST = $developerIdentity.DnsName
        $serverEnvironment.WAFL_TAILSCALE_DEVELOPER_LOGIN_SHA256 = [string]$developerMapping.tailscaleLoginSha256
        $serverEnvironment.WAFL_DEVELOPER_SYSTEM_ADMIN_EMAIL_SHA256 = [string]$developerMapping.systemAdminEmailSha256
        $serverEnvironment.WAFL_TAILSCALE_SERVE_BACKEND_LOOPBACK = "true"
        $serverEnvironment.WAFL_TAILSCALE_FUNNEL_DISABLED = "true"
    }
    if ($EnableAlpha46BasicInfoMutation) {
        $serverEnvironment.WAFL_V2_COMMAND_API_ENABLED = "1"
        $serverEnvironment.WAFL_V2_COMMAND_MUTATION_APPROVED = "2.0.0-alpha.46-dev-test-mobile-basic-info-runtime"
        $serverEnvironment.WAFL_EXTERNAL_QA_ALPHA46_BASIC_INFO_MUTATION_ENABLED = "true"
        $state.commandApi = "ready"
        $state.mutationMode = "basic-info-patch"
    }
    if ($EnableAlpha50MaterialDraftMutation) {
        $serverEnvironment.WAFL_V2_COMMAND_API_ENABLED = "1"
        $serverEnvironment.WAFL_V2_COMMAND_MUTATION_APPROVED = "2.0.0-alpha.50-dev-test-mobile-material-draft-runtime"
        $serverEnvironment.WAFL_EXTERNAL_QA_ALPHA50_MATERIAL_DRAFT_MUTATION_ENABLED = "true"
        $state.commandApi = "ready"
        $state.mutationMode = "material-draft-create-update"
    }
    if ($EnableAlpha51MaterialLifecycleMutation) {
        $serverEnvironment.WAFL_V2_COMMAND_API_ENABLED = "1"
        $serverEnvironment.WAFL_V2_COMMAND_MUTATION_APPROVED = "2.0.0-alpha.51-dev-test-mobile-material-lifecycle-runtime"
        $serverEnvironment.WAFL_EXTERNAL_QA_ALPHA51_MATERIAL_LIFECYCLE_MUTATION_ENABLED = "true"
        $state.commandApi = "ready"
        $state.mutationMode = "material-archive-restore"
    }
    $nextStdout = Join-Path $stateDir "next.stdout.log"
    $nextStderr = Join-Path $stateDir "next.stderr.log"
    $nextArguments = if ($NextMode -eq "production") { @($nextCli, "start", "-H", "127.0.0.1", "-p", [string]$NextPort) } else { @($nextCli, "dev", "-H", "127.0.0.1", "-p", [string]$NextPort) }
    $next = Start-WaflQaOwnedProcess -Role "next" -FilePath $node -ArgumentList $nextArguments -WorkingDirectory $root -OwnerMarker $ownerMarker -Environment $serverEnvironment -StdoutPath $nextStdout -StderrPath $nextStderr
    $state.processes += $next
    $state.lastSuccessfulStage = "next-started"
    Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $state

    $readyDeadline = [DateTime]::UtcNow.AddSeconds(45)
    $ready = $false
    while ([DateTime]::UtcNow -lt $readyDeadline -and -not $ready) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$NextPort/v" -Method Get -TimeoutSec 3
            $ready = $response.StatusCode -eq 200
        } catch {
            Start-Sleep -Milliseconds 250
        }
    }
    if (-not $ready) { throw "NEXT_LOCAL_READINESS_FAILED" }
    $state.lastSuccessfulStage = "next-local-readiness-pass"
    Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $state

    if ($developerAutoConnect) {
        $serveStdout = Join-Path $stateDir "tailscale-serve.stdout.log"
        $serveStderr = Join-Path $stateDir "tailscale-serve.stderr.log"
        $serve = Start-WaflQaOwnedProcess -Role "tailscale-serve" -FilePath $tailscalePath -ArgumentList @("serve", "--https=443", "http://127.0.0.1:$NextPort") -WorkingDirectory $root -OwnerMarker $ownerMarker -Environment @{} -StdoutPath $serveStdout -StderrPath $serveStderr
        $state.processes += $serve
        $state.serveConfigOwnership = "foreground-process"
        $state.lastSuccessfulStage = "tailscale-serve-started"
        Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $state

        $serveDeadline = [DateTime]::UtcNow.AddSeconds(45)
        $serveReady = $false
        while ([DateTime]::UtcNow -lt $serveDeadline -and -not $serveReady) {
            if (-not (Get-Process -Id $serve.pid -ErrorAction SilentlyContinue)) {
                $serveLog = ((@(Get-Content -LiteralPath $serveStdout -Tail 80 -Encoding UTF8 -ErrorAction SilentlyContinue) + @(Get-Content -LiteralPath $serveStderr -Tail 80 -Encoding UTF8 -ErrorAction SilentlyContinue)) -join "`n")
                if ($serveLog -match 'https://login\.tailscale\.com/' -or $serveLog -match 'enable.*https') { throw "TAILSCALE_SERVE_HTTPS_CONSENT_REQUIRED" }
                throw "TAILSCALE_SERVE_PROCESS_EXITED"
            }
            try {
                $serveResponse = Invoke-WebRequest -UseBasicParsing -Uri "$($developerIdentity.ServeOrigin)/api/auth/me" -Method Get -TimeoutSec 5
                $serveReady = $serveResponse.StatusCode -in @(200, 401)
            }
            catch {
                if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401) { $serveReady = $true }
                else { Start-Sleep -Milliseconds 250 }
            }
        }
        if (-not $serveReady) { throw "TAILSCALE_SERVE_HTTPS_READINESS_FAILED" }
        $state.tailscaleServeReady = $true
        $state.developerAutoConnectReady = $true
        $state.lastSuccessfulStage = "tailscale-serve-https-ready"
        Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $state
    }

    $mobileEnvironment = @{
        WAFL_SERVER_RUNTIME_MODE = "dev"
        EXPO_PUBLIC_WAFL_WEB_BASE_URL = $state.publicOrigin
        EXPO_PUBLIC_WAFL_EXTERNAL_QA = "true"
    }
    if ($developerAutoConnect) {
        $mobileEnvironment.EXPO_PUBLIC_WAFL_API_BASE_URL = $developerIdentity.ServeOrigin
        $mobileEnvironment.EXPO_PUBLIC_WAFL_DEVELOPER_AUTO_CONNECT = "true"
    }
    if ($MobileTransport -in @("TailscaleLan", "DeveloperAutoConnect")) {
        $mobileEnvironment.APP_VARIANT = "development"
        $mobileEnvironment.EXPO_PACKAGER_PROXY_URL = "http://$($state.tailscaleIpv4):$ExpoPort"
    }
    $savedMobile = @{}
    try {
        foreach ($name in $mobileEnvironment.Keys) {
            $savedMobile[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
            [Environment]::SetEnvironmentVariable($name, $mobileEnvironment[$name], "Process")
        }
        & $node (Join-Path $root "scripts\audit-wafl-external-qa-config.mjs") --external-qa
        if ($LASTEXITCODE -ne 0) { throw "MOBILE_EXTERNAL_QA_CONFIG_INVALID" }
    } finally {
        foreach ($name in $mobileEnvironment.Keys) { [Environment]::SetEnvironmentVariable($name, $savedMobile[$name], "Process") }
    }

    $expoStdout = Join-Path $stateDir "expo.stdout.log"
    $expoStderr = Join-Path $stateDir "expo.stderr.log"
    $expo = Start-WaflQaOwnedProcess -Role "expo" -FilePath $node -ArgumentList @($expoCli, "start", "--lan", "--port", [string]$ExpoPort) -WorkingDirectory (Join-Path $root "apps\mobile") -OwnerMarker $ownerMarker -Environment $mobileEnvironment -StdoutPath $expoStdout -StderrPath $expoStderr
    $state.processes += $expo
    $state.lastSuccessfulStage = "expo-lan-started"
    Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $state

    $expoReadyDeadline = [DateTime]::UtcNow.AddSeconds(45)
    $expoLocalReady = $false
    while ([DateTime]::UtcNow -lt $expoReadyDeadline -and -not $expoLocalReady) {
        if (-not (Get-Process -Id $expo.pid -ErrorAction SilentlyContinue)) { throw "EXPO_LAN_PROCESS_EXITED" }
        try {
            $expoResponse = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$ExpoPort/status" -Method Get -TimeoutSec 3
            $expoLocalReady = $expoResponse.StatusCode -eq 200 -and (Test-WaflQaPackagerStatusRunning -Content $expoResponse.Content)
        } catch {
            Start-Sleep -Milliseconds 250
        }
    }
    if (-not $expoLocalReady) { throw "EXPO_LAN_LOCAL_READINESS_FAILED" }

    if ($MobileTransport -in @("TailscaleLan", "DeveloperAutoConnect")) {
        try {
            $tailscaleResponse = Invoke-WebRequest -UseBasicParsing -Uri "http://$($state.tailscaleIpv4):$ExpoPort/status" -Method Get -TimeoutSec 5
            if ($tailscaleResponse.StatusCode -ne 200 -or -not (Test-WaflQaPackagerStatusRunning -Content $tailscaleResponse.Content)) {
                throw "EXPO_TAILSCALE_READINESS_FAILED"
            }
        } catch {
            throw "EXPO_TAILSCALE_READINESS_FAILED"
        }
    }

    $state.status = "running"
    $state.lastSuccessfulStage = if ($developerAutoConnect) { "expo-tailscale-lan-developer-auto-connect-ready" } elseif ($MobileTransport -eq "TailscaleLan") { "expo-tailscale-lan-ready" } else { "expo-lan-ready" }
    $state.updatedAtUtc = [DateTime]::UtcNow.ToString("o")
    Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $state

    Write-Host "WAFL external QA processes are running."
    Write-Host ("Viewer base origin: {0}" -f $state.publicOrigin)
    Write-Host ("Process IDs: {0}" -f (($state.processes | ForEach-Object { "{0}={1}" -f $_.role, $_.pid }) -join ", "))
    if ($state.expoUrl) {
        Write-Host ("Expo Go URL (same tailnet only): {0}" -f $state.expoUrl)
    } else {
        Write-Host "Open Expo Go on the same LAN and use the LAN connection shown in the Expo log."
    }
    Write-Host "Stop command: .\tools\dev\stop-wafl-external-qa.ps1"
} catch {
    $failureCode = if ($_.Exception.Message) { $_.Exception.Message } else { "WAFL_EXTERNAL_QA_START_FAILED" }
    $handoff = Write-WaflQaFailureHandoff -State $state -FailureCode $failureCode
    Write-Error ("WAFL external QA stopped at stage '{0}'. Existing owned processes were preserved. Failure Handoff: {1}" -f $state.lastSuccessfulStage, $handoff)
}
