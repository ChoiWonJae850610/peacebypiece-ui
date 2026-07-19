Set-StrictMode -Version Latest

function Get-WaflQaRepositoryRoot {
    return [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
}

function Get-WaflQaStateDirectory {
    return Join-Path (Get-WaflQaRepositoryRoot) ".tmp\wafl-external-qa"
}

function Get-WaflQaStatePath {
    return Join-Path (Get-WaflQaStateDirectory) "state.json"
}

function Write-WaflQaJson {
    param([Parameter(Mandatory = $true)]$Value, [Parameter(Mandatory = $true)][string]$Path)

    $parent = Split-Path -Parent $Path
    [System.IO.Directory]::CreateDirectory($parent) | Out-Null
    $json = $Value | ConvertTo-Json -Depth 12
    [System.IO.File]::WriteAllText($Path, $json, [System.Text.UTF8Encoding]::new($false))
}

function Read-WaflQaState {
    $path = Get-WaflQaStatePath
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "WAFL external QA state not found: $path"
    }
    return Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json
}

function Test-WaflQaPortAvailable {
    param([Parameter(Mandatory = $true)][int]$Port)
    return -not @(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue).Count
}

function Convert-WaflQaResponseContentToText {
    param([AllowNull()]$Content)

    if ($null -eq $Content) { return "" }
    if ($Content -is [byte[]]) {
        return [System.Text.Encoding]::UTF8.GetString($Content)
    }
    return [string]$Content
}

function Test-WaflQaPackagerStatusRunning {
    param([AllowNull()]$Content)

    $text = Convert-WaflQaResponseContentToText -Content $Content
    return $text.Trim() -eq "packager-status:running"
}

function Get-WaflQaExecutablePath {
    param([Parameter(Mandatory = $true)][string]$Name)
    $command = Get-Command $Name -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $command) { return $null }
    return [System.IO.Path]::GetFullPath($command.Source)
}

function Get-WaflQaCloudflaredPath {
    param([string]$ExplicitPath = "")

    if (-not [string]::IsNullOrWhiteSpace($ExplicitPath)) {
        $resolved = [System.IO.Path]::GetFullPath($ExplicitPath)
        if (Test-Path -LiteralPath $resolved -PathType Leaf) { return $resolved }
        return $null
    }

    $fromPath = Get-WaflQaExecutablePath -Name "cloudflared"
    if ($fromPath) { return $fromPath }

    $candidates = @(
        (Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Links\cloudflared.exe"),
        (Join-Path $env:LOCALAPPDATA "Programs\cloudflared\cloudflared.exe"),
        (Join-Path $env:USERPROFILE "bin\cloudflared.exe")
    )
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            return [System.IO.Path]::GetFullPath($candidate)
        }
    }
    return $null
}

function Get-WaflQaTailscalePath {
    $fromPath = Get-WaflQaExecutablePath -Name "tailscale"
    if ($fromPath) { return $fromPath }

    $candidates = @((Join-Path $env:ProgramFiles "Tailscale\tailscale.exe"))
    $programFilesX86 = [Environment]::GetFolderPath("ProgramFilesX86")
    if (-not [string]::IsNullOrWhiteSpace($programFilesX86)) {
        $candidates += Join-Path $programFilesX86 "Tailscale\tailscale.exe"
    }
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            return [System.IO.Path]::GetFullPath($candidate)
        }
    }
    return $null
}

function Test-WaflQaTailscaleIpv4 {
    param([Parameter(Mandatory = $true)][string]$Value)

    $address = $null
    if (-not [System.Net.IPAddress]::TryParse($Value.Trim(), [ref]$address)) { return $false }
    if ($address.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) { return $false }
    $bytes = $address.GetAddressBytes()
    return $bytes[0] -eq 100 -and $bytes[1] -ge 64 -and $bytes[1] -le 127
}

function Resolve-WaflQaTailscaleRuntime {
    param(
        [Parameter(Mandatory = $true)]$Status,
        [Parameter(Mandatory = $true)][string[]]$Ipv4Candidates
    )

    $backendState = if ($Status.PSObject.Properties.Name -contains "BackendState") { $Status.BackendState } else { $null }
    $selfOnline = $false
    if ($Status.PSObject.Properties.Name -contains "Self" -and $Status.Self -and $Status.Self.PSObject.Properties.Name -contains "Online") {
        $selfOnline = $Status.Self.Online -eq $true
    }
    if ($backendState -ne "Running" -or -not $selfOnline) { throw "TAILSCALE_DISCONNECTED" }

    $ipv4 = $Ipv4Candidates | ForEach-Object { $_.Trim() } | Where-Object { Test-WaflQaTailscaleIpv4 -Value $_ } | Select-Object -First 1
    if (-not $ipv4) { throw "TAILSCALE_IPV4_NOT_FOUND" }
    return [pscustomobject]@{ Ipv4 = $ipv4 }
}

function Get-WaflQaTailscaleRuntime {
    param([Parameter(Mandatory = $true)][string]$TailscalePath)

    $statusText = @(& $TailscalePath status --json 2>$null)
    if ($LASTEXITCODE -ne 0 -or -not $statusText.Count) { throw "TAILSCALE_DISCONNECTED" }
    try {
        $status = ($statusText -join "`n") | ConvertFrom-Json
    } catch {
        throw "TAILSCALE_STATUS_INVALID"
    }
    $ipText = @(& $TailscalePath ip -4 2>$null)
    if ($LASTEXITCODE -ne 0) { throw "TAILSCALE_IPV4_NOT_FOUND" }
    return Resolve-WaflQaTailscaleRuntime -Status $status -Ipv4Candidates $ipText
}

function Get-WaflQaTailscaleDeveloperIdentity {
    param([Parameter(Mandatory = $true)][string]$TailscalePath)

    $statusText = @(& $TailscalePath status --json 2>$null)
    if ($LASTEXITCODE -ne 0 -or -not $statusText.Count) { throw "TAILSCALE_DISCONNECTED" }
    try { $status = ($statusText -join "`n") | ConvertFrom-Json } catch { throw "TAILSCALE_STATUS_INVALID" }
    if ($status.BackendState -ne "Running" -or -not $status.Self -or $status.Self.Online -ne $true) { throw "TAILSCALE_DISCONNECTED" }
    if ($status.Self.PSObject.Properties.Name -contains "Tags" -and @($status.Self.Tags).Count -gt 0) { throw "TAILSCALE_TAGGED_DEVICE_FORBIDDEN" }
    $userId = [string]$status.Self.UserID
    if ([string]::IsNullOrWhiteSpace($userId) -or -not $status.User) { throw "TAILSCALE_OWNER_IDENTITY_UNRESOLVED" }
    $profile = $status.User.PSObject.Properties | Where-Object { $_.Name -eq $userId } | Select-Object -First 1
    if (-not $profile -or -not $profile.Value) { throw "TAILSCALE_OWNER_IDENTITY_UNRESOLVED" }
    $login = ([string]$profile.Value.LoginName).Trim().ToLowerInvariant()
    if ([string]::IsNullOrWhiteSpace($login) -or -not $login.Contains("@")) { throw "TAILSCALE_OWNER_LOGIN_UNRESOLVED" }
    $dnsName = ([string]$status.Self.DNSName).Trim().TrimEnd('.').ToLowerInvariant()
    if ([string]::IsNullOrWhiteSpace($dnsName) -or -not $dnsName.EndsWith(".ts.net")) { throw "TAILSCALE_SERVE_DNS_NAME_INVALID" }
    return [pscustomobject]@{ Login = $login; DnsName = $dnsName; ServeOrigin = "https://$dnsName" }
}

function Test-WaflQaEmptyJsonObject {
    param([AllowNull()]$Value)
    return (([string]($Value -join "")).Trim() -replace '\s', '') -eq '{}'
}

function Get-WaflQaFunnelSemanticState {
    param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$JsonText)

    try {
        $root = $JsonText | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        return [pscustomobject]@{ Parsed = $false; SchemaValid = $false; Enabled = $null; AllowFunnelTrueCount = -1 }
    }

    $queue = New-Object System.Collections.Queue
    $queue.Enqueue($root)
    $schemaValid = $true
    $allowFunnelTrueCount = 0
    while ($queue.Count -gt 0) {
        $current = $queue.Dequeue()
        if ($null -eq $current -or $current -is [string] -or $current -is [ValueType]) { continue }
        if ($current -is [System.Collections.IEnumerable] -and $current -isnot [pscustomobject]) {
            foreach ($item in $current) { $queue.Enqueue($item) }
            continue
        }
        foreach ($property in $current.PSObject.Properties) {
            if ($property.Name -eq 'AllowFunnel') {
                if ($null -eq $property.Value) { }
                elseif ($property.Value -isnot [bool]) { $schemaValid = $false }
                elseif ([bool]$property.Value) { $allowFunnelTrueCount++ }
            }
            $queue.Enqueue($property.Value)
        }
    }
    return [pscustomobject]@{
        Parsed = $true
        SchemaValid = $schemaValid
        Enabled = $schemaValid -and $allowFunnelTrueCount -gt 0
        AllowFunnelTrueCount = $allowFunnelTrueCount
    }
}

function Get-WaflQaServeProxySemanticState {
    param(
        [Parameter(Mandatory = $true)][AllowEmptyString()][string]$JsonText,
        [Parameter(Mandatory = $true)][string]$ExpectedBackend
    )

    try {
        $root = $JsonText | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        return [pscustomobject]@{ Parsed = $false; SchemaValid = $false; ExactExpectedOnly = $false; ProxyCount = -1 }
    }

    $queue = New-Object System.Collections.Queue
    $queue.Enqueue($root)
    $schemaValid = $true
    $proxyTargets = New-Object System.Collections.Generic.List[string]
    while ($queue.Count -gt 0) {
        $current = $queue.Dequeue()
        if ($null -eq $current -or $current -is [string] -or $current -is [ValueType]) { continue }
        if ($current -is [System.Collections.IEnumerable] -and $current -isnot [pscustomobject]) {
            foreach ($item in $current) { $queue.Enqueue($item) }
            continue
        }
        foreach ($property in $current.PSObject.Properties) {
            if ($property.Name -eq 'Proxy') {
                if ($property.Value -isnot [string] -or [string]::IsNullOrWhiteSpace([string]$property.Value)) { $schemaValid = $false }
                else { $proxyTargets.Add([string]$property.Value) }
            }
            $queue.Enqueue($property.Value)
        }
    }
    return [pscustomobject]@{
        Parsed = $true
        SchemaValid = $schemaValid
        ExactExpectedOnly = $schemaValid -and $proxyTargets.Count -eq 1 -and $proxyTargets[0] -eq $ExpectedBackend
        ProxyCount = $proxyTargets.Count
    }
}

function Test-WaflQaServeMetadataFallbackEligibility {
    param(
        [Parameter(Mandatory = $true)]$State,
        [Parameter(Mandatory = $true)]$Record,
        [Parameter(Mandatory = $true)]$Marker,
        [Parameter(Mandatory = $true)]$Process
    )

    if ([string]$Record.role -ne 'tailscale-serve' -or [string]$State.mobileTransport -ne 'DeveloperAutoConnect') {
        return [pscustomobject]@{ Eligible = $false; Reason = 'metadata-fallback-transport-mismatch' }
    }
    $markerOwned = [string]$Marker.ownerMarker -eq [string]$State.ownerMarker `
        -and [int]$Marker.pid -eq [int]$Record.pid `
        -and [string]$Marker.role -eq [string]$Record.role `
        -and [string]$Marker.startedAtUtc -eq [string]$Record.startedAtUtc `
        -and [int]$Process.Id -eq [int]$Record.pid
    if (-not $markerOwned) {
        return [pscustomobject]@{ Eligible = $false; Reason = 'metadata-fallback-marker-mismatch' }
    }

    $expectedStart = [DateTime]::Parse([string]$Record.startedAtUtc).ToUniversalTime()
    $actualStart = $Process.StartTime.ToUniversalTime()
    $expectedSecond = $expectedStart.ToString('yyyy-MM-ddTHH:mm:ss', [Globalization.CultureInfo]::InvariantCulture)
    $actualSecond = $actualStart.ToString('yyyy-MM-ddTHH:mm:ss', [Globalization.CultureInfo]::InvariantCulture)
    if ($actualSecond -ne $expectedSecond) {
        return [pscustomobject]@{ Eligible = $false; Reason = 'metadata-fallback-start-time-mismatch' }
    }
    return [pscustomobject]@{ Eligible = $true; Reason = 'metadata-fallback-eligible' }
}

function Get-WaflQaRunnerProcessDisposition {
    param(
        [Parameter(Mandatory = $true)]$State,
        [Parameter(Mandatory = $true)]$Record,
        [Parameter(Mandatory = $true)]$Marker,
        [Parameter(Mandatory = $true)]$Process
    )

    $markerOwned = [string]$Marker.ownerMarker -eq [string]$State.ownerMarker `
        -and [int]$Marker.pid -eq [int]$Record.pid `
        -and [string]$Marker.role -eq [string]$Record.role `
        -and [int]$Process.Id -eq [int]$Record.pid
    if (-not $markerOwned) {
        return [pscustomobject]@{ Outcome = 'ownership-failure'; Reason = 'marker-or-pid-mismatch'; Terminate = $false }
    }
    if ([string]::IsNullOrWhiteSpace([string]$Marker.startedAtUtc) `
        -or [string]::IsNullOrWhiteSpace([string]$Record.startedAtUtc) `
        -or [string]$Marker.startedAtUtc -ne [string]$Record.startedAtUtc) {
        return [pscustomobject]@{ Outcome = 'ownership-failure'; Reason = 'marker-start-time-unavailable-or-mismatch'; Terminate = $false }
    }

    try {
        $markerStart = [DateTime]::Parse([string]$Marker.startedAtUtc).ToUniversalTime()
        $currentStart = $Process.StartTime.ToUniversalTime()
    }
    catch {
        return [pscustomobject]@{ Outcome = 'ownership-failure'; Reason = 'current-start-time-unavailable'; Terminate = $false }
    }
    $markerSecond = $markerStart.ToString('yyyy-MM-ddTHH:mm:ss', [Globalization.CultureInfo]::InvariantCulture)
    $currentSecond = $currentStart.ToString('yyyy-MM-ddTHH:mm:ss', [Globalization.CultureInfo]::InvariantCulture)
    if ($markerSecond -ne $currentSecond) {
        return [pscustomobject]@{ Outcome = 'pid-reused-runner-already-stopped'; Reason = 'start-time-mismatch'; Terminate = $false }
    }
    return [pscustomobject]@{ Outcome = 'ownership-candidate'; Reason = 'start-time-match'; Terminate = $true }
}

function Convert-WaflQaProcessCreationDateToUtc {
    param([AllowNull()]$Value)

    if ($Value -is [DateTime]) { return ([DateTime]$Value).ToUniversalTime() }
    $text = [string]$Value
    if ([string]::IsNullOrWhiteSpace($text)) { return $null }
    try {
        return [System.Management.ManagementDateTimeConverter]::ToDateTime($text).ToUniversalTime()
    }
    catch {
        return $null
    }
}

function Test-WaflQaAlternativeServeProcessMetadata {
    param(
        [Parameter(Mandatory = $true)]$State,
        [Parameter(Mandatory = $true)]$Record,
        [Parameter(Mandatory = $true)]$Marker,
        [Parameter(Mandatory = $true)]$Process,
        [Parameter(Mandatory = $true)]$Metadata,
        [bool]$ServeFallbackConfigSafe = $false
    )

    $eligibility = Test-WaflQaServeMetadataFallbackEligibility -State $State -Record $Record -Marker $Marker -Process $Process
    if (-not $eligibility.Eligible) {
        return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = $eligibility.Reason }
    }
    if (-not $ServeFallbackConfigSafe) {
        return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'metadata-fallback-config-unsafe' }
    }
    if ([int]$Metadata.ProcessId -ne [int]$Record.pid) {
        return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'metadata-fallback-pid-mismatch' }
    }

    $metadataStart = Convert-WaflQaProcessCreationDateToUtc -Value $Metadata.CreationDate
    if ($null -eq $metadataStart) {
        return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'metadata-fallback-creation-date-unavailable' }
    }
    $expectedStart = [DateTime]::Parse([string]$Record.startedAtUtc).ToUniversalTime()
    $expectedSecond = $expectedStart.ToString('yyyy-MM-ddTHH:mm:ss', [Globalization.CultureInfo]::InvariantCulture)
    $metadataSecond = $metadataStart.ToString('yyyy-MM-ddTHH:mm:ss', [Globalization.CultureInfo]::InvariantCulture)
    if ($metadataSecond -ne $expectedSecond) {
        return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'metadata-fallback-creation-date-mismatch' }
    }

    $expectedPath = [System.IO.Path]::GetFullPath([string]$Record.executablePath)
    $metadataPath = [string]$Metadata.ExecutablePath
    if ([string]::IsNullOrWhiteSpace($metadataPath)) {
        return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'metadata-fallback-executable-unavailable' }
    }
    try { $metadataPath = [System.IO.Path]::GetFullPath($metadataPath) }
    catch { return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'metadata-fallback-executable-invalid' } }
    if ($metadataPath -ne $expectedPath) {
        return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'metadata-fallback-executable-mismatch' }
    }

    $commandLine = [string]$Metadata.CommandLine
    if ([string]::IsNullOrWhiteSpace($commandLine)) {
        return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'metadata-fallback-command-line-unavailable' }
    }
    $expectedBackend = "http://127.0.0.1:$([int]$State.nextPort)"
    $exactServePattern = '^\s*"?' + [regex]::Escape($expectedPath) + '"?\s+serve\s+--https=443\s+' + [regex]::Escape($expectedBackend) + '\s*$'
    if ($commandLine -notmatch $exactServePattern) {
        return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'metadata-fallback-command-line-mismatch' }
    }
    return [pscustomobject]@{ Owned = $true; UsedFallback = $true; Reason = 'exact-wmi-metadata-fallback' }
}

function Test-WaflQaStopProcessOwnership {
    param(
        [Parameter(Mandatory = $true)]$State,
        [Parameter(Mandatory = $true)]$Record,
        [Parameter(Mandatory = $true)]$Marker,
        [Parameter(Mandatory = $true)]$Process,
        [Parameter(Mandatory = $true)]$CimProcess,
        [bool]$ServeFallbackConfigSafe = $false
    )

    $baseOwned = [string]$Marker.ownerMarker -eq [string]$State.ownerMarker `
        -and [int]$Marker.pid -eq [int]$Record.pid `
        -and [string]$Marker.role -eq [string]$Record.role `
        -and [string]$Marker.startedAtUtc -eq [string]$Record.startedAtUtc `
        -and [int]$CimProcess.ProcessId -eq [int]$Record.pid
    if (-not $baseOwned) { return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'marker-or-pid-mismatch' } }

    $expectedStart = [DateTime]::Parse([string]$Record.startedAtUtc).ToUniversalTime()
    $actualStart = $Process.StartTime.ToUniversalTime()
    if ([Math]::Abs(($actualStart - $expectedStart).TotalSeconds) -ge 2) {
        return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'start-time-mismatch' }
    }

    $expectedPath = [System.IO.Path]::GetFullPath([string]$Record.executablePath)
    $cimPath = [string]$CimProcess.ExecutablePath
    if (-not [string]::IsNullOrWhiteSpace($cimPath)) {
        $strictOwned = [System.IO.Path]::GetFullPath($cimPath) -eq $expectedPath
        return [pscustomobject]@{ Owned = $strictOwned; UsedFallback = $false; Reason = $(if ($strictOwned) { 'strict-path' } else { 'executable-path-mismatch' }) }
    }

    if ([string]$Record.role -ne 'tailscale-serve' -or [string]$State.mobileTransport -ne 'DeveloperAutoConnect') {
        return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'executable-path-unavailable' }
    }
    if (-not $ServeFallbackConfigSafe) {
        return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'serve-fallback-config-unsafe' }
    }
    $commandLine = [string]$CimProcess.CommandLine
    if ([string]::IsNullOrWhiteSpace($commandLine)) {
        return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'serve-command-line-unavailable' }
    }
    $expectedBackend = "http://127.0.0.1:$([int]$State.nextPort)"
    $exactServePattern = '^\s*"?' + [regex]::Escape($expectedPath) + '"?\s+serve\s+--https=443\s+' + [regex]::Escape($expectedBackend) + '\s*$'
    if ($commandLine -notmatch $exactServePattern) {
        return [pscustomobject]@{ Owned = $false; UsedFallback = $false; Reason = 'serve-command-line-mismatch' }
    }
    return [pscustomobject]@{ Owned = $true; UsedFallback = $true; Reason = 'serve-bounded-fallback' }
}

function Start-WaflQaOwnedProcess {
    param(
        [Parameter(Mandatory = $true)][string]$Role,
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$ArgumentList,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][string]$OwnerMarker,
        [Parameter(Mandatory = $true)][hashtable]$Environment,
        [Parameter(Mandatory = $true)][string]$StdoutPath,
        [Parameter(Mandatory = $true)][string]$StderrPath
    )

    $saved = @{}
    try {
        foreach ($name in $Environment.Keys) {
            $saved[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
            [Environment]::SetEnvironmentVariable($name, [string]$Environment[$name], "Process")
        }
        $process = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -WindowStyle Hidden -RedirectStandardOutput $StdoutPath -RedirectStandardError $StderrPath -PassThru
    }
    finally {
        foreach ($name in $Environment.Keys) {
            [Environment]::SetEnvironmentVariable($name, $saved[$name], "Process")
        }
    }

    $process.Refresh()
    $record = [ordered]@{
        role = $Role
        pid = $process.Id
        executablePath = [System.IO.Path]::GetFullPath($FilePath)
        startedAtUtc = $process.StartTime.ToUniversalTime().ToString("o")
        stdoutPath = $StdoutPath
        stderrPath = $StderrPath
        markerPath = Join-Path (Get-WaflQaStateDirectory) ("owner-{0}-{1}.json" -f $Role, $process.Id)
    }
    Write-WaflQaJson -Path $record.markerPath -Value ([ordered]@{
        ownerMarker = $OwnerMarker
        role = $Role
        pid = $process.Id
        executablePath = $record.executablePath
        startedAtUtc = $record.startedAtUtc
    })
    return $record
}

function Write-WaflQaFailureHandoff {
    param([Parameter(Mandatory = $true)]$State, [Parameter(Mandatory = $true)][string]$FailureCode)
    $State.status = "failed"
    $State.failureCode = $FailureCode
    $State.updatedAtUtc = [DateTime]::UtcNow.ToString("o")
    Write-WaflQaJson -Path (Get-WaflQaStatePath) -Value $State
    $path = Join-Path (Get-WaflQaStateDirectory) "failure-handoff.json"
    Write-WaflQaJson -Path $path -Value ([ordered]@{
        result = "WAFL_EXTERNAL_QA_FAILURE_HANDOFF"
        failureCode = $FailureCode
        lastSuccessfulStage = $State.lastSuccessfulStage
        liveProcessIds = @($State.processes | ForEach-Object { $_.pid })
        automaticRetry = $false
        automaticCleanup = $false
        automaticRollback = $false
        recordedAtUtc = [DateTime]::UtcNow.ToString("o")
    })
    return $path
}
