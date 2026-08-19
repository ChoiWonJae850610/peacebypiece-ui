Set-StrictMode -Version Latest
Add-Type -AssemblyName System.Net.Http
Add-Type -AssemblyName System.Web

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

function Get-WaflQaRedirectResponse {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [int]$TimeoutSeconds = 10
    )

    $handler = [System.Net.Http.HttpClientHandler]::new()
    $handler.AllowAutoRedirect = $false
    $client = [System.Net.Http.HttpClient]::new($handler)
    $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSeconds)
    try {
        $response = $client.GetAsync($Uri).GetAwaiter().GetResult()
        return [pscustomobject]@{
            StatusCode = [int]$response.StatusCode
            Location = if ($null -eq $response.Headers.Location) { "" } else { [string]$response.Headers.Location }
        }
    }
    finally {
        $client.Dispose()
        $handler.Dispose()
    }
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

function Resolve-WaflQaCanonicalNodeToolchain {
    param([string]$RequiredVersion = "v24.14.0")

    $candidates = New-Object System.Collections.Generic.List[string]
    $pathNode = Get-WaflQaExecutablePath -Name "node"
    if ($pathNode) { $candidates.Add($pathNode) }

    foreach ($candidate in @(
        (Join-Path $env:ProgramFiles "nodejs\node.exe"),
        (Join-Path $env:LOCALAPPDATA "Programs\nodejs\node.exe")
    )) {
        if (-not [string]::IsNullOrWhiteSpace($candidate)) { $candidates.Add($candidate) }
    }

    $runtimeCache = Join-Path $env:USERPROFILE ".cache\codex-runtimes"
    if (Test-Path -LiteralPath $runtimeCache -PathType Container) {
        foreach ($runtimeDirectory in @(Get-ChildItem -LiteralPath $runtimeCache -Directory -ErrorAction SilentlyContinue | Sort-Object FullName)) {
            $candidates.Add((Join-Path $runtimeDirectory.FullName "dependencies\node\bin\node.exe"))
        }
    }

    $seen = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
    foreach ($candidate in $candidates) {
        if ([string]::IsNullOrWhiteSpace($candidate)) { continue }
        try { $resolved = [System.IO.Path]::GetFullPath($candidate) } catch { continue }
        if (-not $seen.Add($resolved) -or -not (Test-Path -LiteralPath $resolved -PathType Leaf)) { continue }

        $version = ""
        try { $version = ([string](& $resolved --version 2>$null)).Trim() } catch { continue }
        if ($version -ne $RequiredVersion) { continue }

        return [pscustomobject]@{
            Node = $resolved
            Version = $version
        }
    }

    throw "CANONICAL_NODE_24_14_0_NOT_FOUND"
}

function Test-WaflQaMetroFirewallRule {
    param(
        [Parameter(Mandatory = $true)][string]$NodePath,
        [int]$Port = 8081
    )

    $ruleName = "WAFL-Metro-8081-Tailscale-Node24"
    $rule = Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue
    if ($null -eq $rule) {
        return [pscustomobject]@{ Exists = $false; ScopeReady = $false; ProgramMatches = $false; Ready = $false }
    }
    $portFilter = $rule | Get-NetFirewallPortFilter
    $addressFilter = $rule | Get-NetFirewallAddressFilter
    $applicationFilter = $rule | Get-NetFirewallApplicationFilter
    $remoteAddress = [string]($addressFilter.RemoteAddress -join ",")
    $scopeReady = [string]$rule.Enabled -eq "True" `
        -and [string]$rule.Direction -eq "Inbound" `
        -and [string]$rule.Action -eq "Allow" `
        -and [string]$rule.Profile -match "Private" `
        -and [string]$portFilter.Protocol -eq "TCP" `
        -and [string]$portFilter.LocalPort -eq [string]$Port `
        -and $remoteAddress -match '^100\.64\.0\.0/(10|255\.192\.0\.0)$'
    $programMatches = $false
    try {
        $programMatches = [System.IO.Path]::GetFullPath([string]$applicationFilter.Program) -eq [System.IO.Path]::GetFullPath($NodePath)
    } catch {}
    return [pscustomobject]@{
        Exists = $true
        ScopeReady = $scopeReady
        ProgramMatches = $programMatches
        Ready = $scopeReady -and $programMatches
    }
}

function Ensure-WaflQaMetroFirewallRule {
    param(
        [Parameter(Mandatory = $true)][string]$NodePath,
        [int]$Port = 8081
    )

    $ruleName = "WAFL-Metro-8081-Tailscale-Node24"
    $current = Test-WaflQaMetroFirewallRule -NodePath $NodePath -Port $Port
    if (-not $current.Exists) {
        New-NetFirewallRule -Name $ruleName `
            -DisplayName "WAFL Metro 8081 via Tailscale (Node 24.14.0)" `
            -Direction Inbound -Action Allow -Enabled True -Profile Private `
            -Program $NodePath -Protocol TCP -LocalPort $Port -RemoteAddress "100.64.0.0/10" | Out-Null
    }
    elseif (-not $current.ScopeReady) {
        throw "WAFL_METRO_FIREWALL_RULE_SCOPE_MISMATCH"
    }
    elseif (-not $current.ProgramMatches) {
        Get-NetFirewallRule -Name $ruleName | Get-NetFirewallApplicationFilter | Set-NetFirewallApplicationFilter -Program $NodePath | Out-Null
    }

    $verified = Test-WaflQaMetroFirewallRule -NodePath $NodePath -Port $Port
    if (-not $verified.Ready) { throw "WAFL_METRO_FIREWALL_RULE_NOT_READY" }
    return $verified
}

function Invoke-WaflQaHttpRequest {
    param(
        [Parameter(Mandatory = $true)][System.Net.Http.HttpClient]$Client,
        [Parameter(Mandatory = $true)][ValidateSet("GET", "POST")][string]$Method,
        [Parameter(Mandatory = $true)][string]$Uri,
        [string]$JsonBody = ""
    )

    $httpMethod = if ($Method -eq "POST") { [System.Net.Http.HttpMethod]::Post } else { [System.Net.Http.HttpMethod]::Get }
    $request = [System.Net.Http.HttpRequestMessage]::new($httpMethod, [Uri]$Uri)
    if ($Method -eq "POST" -and -not [string]::IsNullOrWhiteSpace($JsonBody)) {
        $request.Content = [System.Net.Http.StringContent]::new($JsonBody, [System.Text.Encoding]::UTF8, "application/json")
    }
    try {
        $response = $Client.SendAsync($request).GetAwaiter().GetResult()
        try {
            $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
            $json = $null
            if (-not [string]::IsNullOrWhiteSpace($content)) {
                try { $json = $content | ConvertFrom-Json -ErrorAction Stop } catch { $json = $null }
            }
            return [pscustomobject]@{ StatusCode = [int]$response.StatusCode; Json = $json }
        }
        finally { $response.Dispose() }
    }
    finally { $request.Dispose() }
}

function Invoke-WaflQaBundleTransfer {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [int]$TimeoutSeconds = 180
    )

    $handler = [System.Net.Http.HttpClientHandler]::new()
    $handler.AllowAutoRedirect = $true
    $client = [System.Net.Http.HttpClient]::new($handler)
    $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSeconds)
    try {
        $response = $client.GetAsync($Uri, [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead).GetAwaiter().GetResult()
        try {
            $stream = $response.Content.ReadAsStreamAsync().GetAwaiter().GetResult()
            try {
                $buffer = New-Object byte[] 65536
                [long]$bytes = 0
                while (($read = $stream.Read($buffer, 0, $buffer.Length)) -gt 0) { $bytes += $read }
                return [pscustomobject]@{ StatusCode = [int]$response.StatusCode; Bytes = $bytes }
            }
            finally { $stream.Dispose() }
        }
        finally { $response.Dispose() }
    }
    finally {
        $client.Dispose()
        $handler.Dispose()
    }
}

function Resolve-WaflQaOwnerFixture {
    $alpha64Path = Join-Path (Get-WaflQaStateDirectory) "alpha64-real-sheet-owner-fixture-readonly-audit.json"
    if (Test-Path -LiteralPath $alpha64Path -PathType Leaf) {
        try {
            $alpha64 = Get-Content -LiteralPath $alpha64Path -Raw -Encoding UTF8 | ConvertFrom-Json -ErrorAction Stop
            $marker = ([string]$alpha64.marker).Trim()
            if (-not [string]::IsNullOrWhiteSpace($marker)) {
                return [pscustomobject]@{ Mode = "marker"; Value = $marker; Source = "alpha64-owner-readonly-audit" }
            }
        } catch {}
    }

    $alpha62Path = Join-Path (Get-WaflQaStateDirectory) "alpha62-owner-iphone-fixture.json"
    if (Test-Path -LiteralPath $alpha62Path -PathType Leaf) {
        try {
            $alpha62 = Get-Content -LiteralPath $alpha62Path -Raw -Encoding UTF8 | ConvertFrom-Json -ErrorAction Stop
            $workOrderId = ([string]$alpha62.workOrderId).Trim()
            if ($workOrderId -match '^[0-9a-fA-F-]{36}$') {
                return [pscustomobject]@{ Mode = "id"; Value = $workOrderId; Source = "alpha62-owner-fixture" }
            }
        } catch {}
    }

    throw "OWNER_FIXTURE_REFERENCE_UNAVAILABLE"
}

function Invoke-WaflQaDeveloperReadSmoke {
    param([Parameter(Mandatory = $true)]$State)

    $result = [ordered]@{
        Passed = $false
        FailureStage = "preflight"
        AutoConnectHttp = 0
        AuthMeHttp = 0
        CompanyContextReady = $false
        WorkOrderListHttp = 0
        WorkOrderListReady = $false
        OwnerFixtureSource = "unresolved"
        OwnerFixtureDetailHttp = 0
        OwnerFixtureDetailReady = $false
    }
    if ([string]$State.mobileTransport -ne "DeveloperAutoConnect" -or [string]::IsNullOrWhiteSpace([string]$State.publicOrigin)) {
        return [pscustomobject]$result
    }

    $handler = [System.Net.Http.HttpClientHandler]::new()
    $handler.AllowAutoRedirect = $false
    $handler.UseCookies = $true
    $handler.CookieContainer = [System.Net.CookieContainer]::new()
    $client = [System.Net.Http.HttpClient]::new($handler)
    $client.Timeout = [TimeSpan]::FromSeconds(45)
    $autoConnected = $false
    try {
        $origin = ([Uri][string]$State.publicOrigin).GetLeftPart([UriPartial]::Authority)
        $auto = Invoke-WaflQaHttpRequest -Client $client -Method POST -Uri ($origin + "/api/dev/mobile-connect/auto") -JsonBody "{}"
        $result.AutoConnectHttp = $auto.StatusCode
        if ($auto.StatusCode -ne 200 -or $null -eq $auto.Json -or $auto.Json.ok -ne $true -or $auto.Json.connected -ne $true -or [string]$auto.Json.mode -ne "tailscale-developer") {
            $result.FailureStage = "developer-auto-connect"
            return [pscustomobject]$result
        }
        $autoConnected = $true

        $me = Invoke-WaflQaHttpRequest -Client $client -Method GET -Uri ($origin + "/api/auth/me")
        $result.AuthMeHttp = $me.StatusCode
        $result.CompanyContextReady = $me.StatusCode -eq 200 `
            -and $null -ne $me.Json `
            -and $me.Json.authenticated -eq $true `
            -and [string]$me.Json.user.role -eq "company_admin" `
            -and [string]$me.Json.user.companyId -eq "wafl-fn-company-a" `
            -and -not [string]::IsNullOrWhiteSpace([string]$me.Json.user.companyMemberId)
        if (-not $result.CompanyContextReady) {
            $result.FailureStage = "auth-company-context"
            return [pscustomobject]$result
        }

        $list = Invoke-WaflQaHttpRequest -Client $client -Method GET -Uri ($origin + "/api/v2/work-orders?limit=30")
        $result.WorkOrderListHttp = $list.StatusCode
        $result.WorkOrderListReady = $list.StatusCode -eq 200 `
            -and $null -ne $list.Json `
            -and $list.Json.ok -eq $true `
            -and $null -ne $list.Json.data `
            -and $null -ne $list.Json.data.items
        if (-not $result.WorkOrderListReady) {
            $result.FailureStage = "work-order-list"
            return [pscustomobject]$result
        }

        $fixture = Resolve-WaflQaOwnerFixture
        $result.OwnerFixtureSource = $fixture.Source
        $fixtureId = ""
        if ($fixture.Mode -eq "marker") {
            $searchUri = $origin + "/api/v2/work-orders?limit=30&q=" + [Uri]::EscapeDataString([string]$fixture.Value)
            $search = Invoke-WaflQaHttpRequest -Client $client -Method GET -Uri $searchUri
            if ($search.StatusCode -ne 200 -or $null -eq $search.Json -or $search.Json.ok -ne $true -or $null -eq $search.Json.data) {
                $result.FailureStage = "owner-fixture-search"
                return [pscustomobject]$result
            }
            $matches = @($search.Json.data.items | Where-Object { [string]$_.productName -eq [string]$fixture.Value })
            if ($matches.Count -ne 1 -or [string]::IsNullOrWhiteSpace([string]$matches[0].workOrderId)) {
                $result.FailureStage = "owner-fixture-resolution"
                return [pscustomobject]$result
            }
            $fixtureId = [string]$matches[0].workOrderId
        }
        else { $fixtureId = [string]$fixture.Value }

        $detail = Invoke-WaflQaHttpRequest -Client $client -Method GET -Uri ($origin + "/api/v2/work-orders/" + [Uri]::EscapeDataString($fixtureId))
        $result.OwnerFixtureDetailHttp = $detail.StatusCode
        $result.OwnerFixtureDetailReady = $detail.StatusCode -eq 200 `
            -and $null -ne $detail.Json `
            -and $detail.Json.ok -eq $true `
            -and $null -ne $detail.Json.data `
            -and $null -ne $detail.Json.data.header `
            -and [string]$detail.Json.data.header.id -eq $fixtureId
        if (-not $result.OwnerFixtureDetailReady) {
            $result.FailureStage = "owner-fixture-detail"
            return [pscustomobject]$result
        }

        $result.Passed = $true
        $result.FailureStage = "none"
        return [pscustomobject]$result
    }
    catch {
        $result.FailureStage = "request-failed"
        return [pscustomobject]$result
    }
    finally {
        if ($autoConnected) {
            try { Invoke-WaflQaHttpRequest -Client $client -Method POST -Uri (([Uri][string]$State.publicOrigin).GetLeftPart([UriPartial]::Authority) + "/api/dev/mobile-connect/disconnect") | Out-Null } catch {}
        }
        $client.Dispose()
        $handler.Dispose()
    }
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

    $expectedStart = Convert-WaflQaRecordedStartTimeToUtc -Value ([string]$Record.startedAtUtc)
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
        $markerStart = Convert-WaflQaRecordedStartTimeToUtc -Value ([string]$Marker.startedAtUtc)
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

function Get-WaflQaPort3000ListenerPolicy {
    param(
        [Parameter(Mandatory = $true)]$State,
        [Parameter(Mandatory = $true)][AllowEmptyCollection()][object[]]$Listeners,
        [Parameter(Mandatory = $true)][AllowEmptyCollection()][object[]]$ProcessMetadata
    )

    $repositoryRoot = [System.IO.Path]::GetFullPath([string]$State.repositoryRoot).TrimEnd('\\')
    $repositoryPrefix = $repositoryRoot + '\\'
    $runnerPids = @(@($State.processes) | ForEach-Object { [int]$_.pid })
    $details = New-Object System.Collections.Generic.List[object]
    $waflOwnedCount = 0
    $verifiedUnrelatedCount = 0
    $unverifiedCount = 0

    foreach ($listener in @($Listeners)) {
        $listenerPid = [int]$listener.OwningProcess
        $metadata = @($ProcessMetadata | Where-Object { [int]$_.ProcessId -eq $listenerPid }) | Select-Object -First 1
        if ($listenerPid -in $runnerPids) {
            $waflOwnedCount++
            $details.Add([pscustomobject]@{ Pid = $listenerPid; Classification = 'wafl-owned'; Reason = 'runner-record-pid' })
            continue
        }
        if ($null -eq $metadata) {
            $unverifiedCount++
            $details.Add([pscustomobject]@{ Pid = $listenerPid; Classification = 'unverified'; Reason = 'process-metadata-unavailable' })
            continue
        }
        if ([int]$metadata.ParentProcessId -in $runnerPids) {
            $waflOwnedCount++
            $details.Add([pscustomobject]@{ Pid = $listenerPid; Classification = 'wafl-owned'; Reason = 'runner-record-parent-pid' })
            continue
        }

        $executablePath = [string]$metadata.ExecutablePath
        $commandLine = [string]$metadata.CommandLine
        $normalizedExecutable = ''
        if (-not [string]::IsNullOrWhiteSpace($executablePath)) {
            try { $normalizedExecutable = [System.IO.Path]::GetFullPath($executablePath) } catch {}
        }
        $executableInRepository = -not [string]::IsNullOrWhiteSpace($normalizedExecutable) `
            -and ($normalizedExecutable -eq $repositoryRoot -or $normalizedExecutable.StartsWith($repositoryPrefix, [System.StringComparison]::OrdinalIgnoreCase))
        $commandMentionsRepository = -not [string]::IsNullOrWhiteSpace($commandLine) `
            -and $commandLine.IndexOf($repositoryRoot, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
        if ($executableInRepository -or $commandMentionsRepository) {
            $waflOwnedCount++
            $reason = if ($executableInRepository) { 'repository-executable-path' } else { 'repository-command-path' }
            $details.Add([pscustomobject]@{ Pid = $listenerPid; Classification = 'wafl-owned'; Reason = $reason })
            continue
        }

        $foreignExecutableVerified = -not [string]::IsNullOrWhiteSpace($normalizedExecutable) `
            -and [System.IO.Path]::IsPathRooted($normalizedExecutable) `
            -and -not $executableInRepository
        $foreignCommandPathVerified = $false
        if (-not [string]::IsNullOrWhiteSpace($commandLine)) {
            foreach ($match in [regex]::Matches($commandLine, '(?i)[A-Z]:\\[^"\r\n]+')) {
                if ([string]$match.Value -notlike "$repositoryRoot*") {
                    $foreignCommandPathVerified = $true
                    break
                }
            }
        }
        if ($foreignExecutableVerified -and $foreignCommandPathVerified) {
            $verifiedUnrelatedCount++
            $details.Add([pscustomobject]@{ Pid = $listenerPid; Classification = 'verified-unrelated'; Reason = 'foreign-executable-and-command-path' })
            continue
        }

        $unverifiedCount++
        $details.Add([pscustomobject]@{ Pid = $listenerPid; Classification = 'unverified'; Reason = 'insufficient-exact-path-command-provenance' })
    }

    return [pscustomobject]@{
        Ready = $waflOwnedCount -eq 0 -and $unverifiedCount -eq 0
        WaflOwnedCount = $waflOwnedCount
        VerifiedUnrelatedCount = $verifiedUnrelatedCount
        UnverifiedCount = $unverifiedCount
        Details = [object[]]$details
    }
}

function Get-WaflQaCloudflaredProcessPolicy {
    param(
        [Parameter(Mandatory = $true)]$State,
        [Parameter(Mandatory = $true)][AllowEmptyCollection()][object[]]$Processes,
        [Parameter(Mandatory = $true)][AllowEmptyCollection()][object[]]$ProcessMetadata,
        [Parameter(Mandatory = $true)][AllowEmptyCollection()][object[]]$DiagnosticConfigs
    )

    $repositoryRoot = [System.IO.Path]::GetFullPath([string]$State.repositoryRoot).TrimEnd('\\')
    $repositoryPrefix = $repositoryRoot + '\\'
    $runnerPids = @(@($State.processes) | ForEach-Object { [int]$_.pid })
    $details = New-Object System.Collections.Generic.List[object]
    $waflOwnedCount = 0
    $forbiddenCount = 0
    $verifiedUnrelatedCount = 0
    $unverifiedCount = 0

    $runtimeMarkers = New-Object System.Collections.Generic.List[string]
    foreach ($candidate in @(
        $repositoryRoot,
        [string]$State.ownerMarker,
        [string]$State.tailscaleIpv4,
        [string]$State.tailscaleServeHostname,
        [string]$State.publicOrigin,
        [string]$State.expoUrl,
        [string]$State.metroAdvertisedHost,
        [string]$State.iosManifestLaunchHost,
        [string]$State.developerClientLaunchHost,
        'peacebypiece',
        'wafl'
    )) {
        if (-not [string]::IsNullOrWhiteSpace($candidate)) { $runtimeMarkers.Add($candidate) }
    }

    foreach ($process in @($Processes)) {
        $processPid = [int]$process.Id
        $metadata = @($ProcessMetadata | Where-Object { [int]$_.ProcessId -eq $processPid }) | Select-Object -First 1
        if ($processPid -in $runnerPids) {
            $waflOwnedCount++
            $details.Add([pscustomobject]@{ Pid = $processPid; Classification = 'wafl-owned'; Reason = 'runner-record-pid' })
            continue
        }
        if ($null -eq $metadata) {
            $unverifiedCount++
            $details.Add([pscustomobject]@{ Pid = $processPid; Classification = 'unverified'; Reason = 'process-metadata-unavailable' })
            continue
        }
        if ([int]$metadata.ParentProcessId -in $runnerPids) {
            $waflOwnedCount++
            $details.Add([pscustomobject]@{ Pid = $processPid; Classification = 'wafl-owned'; Reason = 'runner-record-parent-pid' })
            continue
        }

        $executablePath = [string]$metadata.ExecutablePath
        $commandLine = [string]$metadata.CommandLine
        $normalizedExecutable = ''
        if (-not [string]::IsNullOrWhiteSpace($executablePath)) {
            try { $normalizedExecutable = [System.IO.Path]::GetFullPath($executablePath) } catch {}
        }
        $executableInRepository = -not [string]::IsNullOrWhiteSpace($normalizedExecutable) `
            -and ($normalizedExecutable -eq $repositoryRoot -or $normalizedExecutable.StartsWith($repositoryPrefix, [System.StringComparison]::OrdinalIgnoreCase))
        $commandMentionsRuntime = $false
        foreach ($marker in $runtimeMarkers) {
            if (-not [string]::IsNullOrWhiteSpace($commandLine) `
                -and $commandLine.IndexOf($marker, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
                $commandMentionsRuntime = $true
                break
            }
        }
        if ($executableInRepository -or $commandMentionsRuntime) {
            $waflOwnedCount++
            $reason = if ($executableInRepository) { 'repository-executable-path' } else { 'runtime-command-reference' }
            $details.Add([pscustomobject]@{ Pid = $processPid; Classification = 'wafl-owned'; Reason = $reason })
            continue
        }

        $isQuickTunnel = $commandLine -match '(?i)\btunnel\b[\s\S]*--url(?:\s|=)'
        if ($isQuickTunnel) {
            $forbiddenCount++
            $details.Add([pscustomobject]@{ Pid = $processPid; Classification = 'forbidden'; Reason = 'quick-tunnel-command' })
            continue
        }

        $namedServiceProvenance = -not [string]::IsNullOrWhiteSpace($normalizedExecutable) `
            -and [System.IO.Path]::IsPathRooted($normalizedExecutable) `
            -and [bool]$metadata.IsWindowsService `
            -and [string]$metadata.SignatureStatus -eq 'Valid' `
            -and [bool]$metadata.CloudflareSigner `
            -and $commandLine -match '(?i)\btunnel\s+run\b' `
            -and $commandLine -match '(?i)--token-file(?:\s|=)'
        if (-not $namedServiceProvenance) {
            $unverifiedCount++
            $details.Add([pscustomobject]@{ Pid = $processPid; Classification = 'unverified'; Reason = 'named-service-provenance-incomplete' })
            continue
        }

        $diagnostic = @($DiagnosticConfigs | Where-Object { [int]$_.ProcessId -eq $processPid }) | Select-Object -First 1
        if ($null -eq $diagnostic -or -not [bool]$diagnostic.Available -or [string]::IsNullOrWhiteSpace([string]$diagnostic.JsonText)) {
            $unverifiedCount++
            $details.Add([pscustomobject]@{ Pid = $processPid; Classification = 'unverified'; Reason = 'live-ingress-config-unavailable' })
            continue
        }

        try {
            $config = ([string]$diagnostic.JsonText | ConvertFrom-Json -ErrorAction Stop)
            $ingress = @($config.config.ingress)
        }
        catch {
            $ingress = @()
        }
        if ($ingress.Count -eq 0) {
            $unverifiedCount++
            $details.Add([pscustomobject]@{ Pid = $processPid; Classification = 'unverified'; Reason = 'live-ingress-config-empty-or-invalid' })
            continue
        }

        $routeTouchesWafl = $false
        $unknownRoute = $false
        foreach ($route in $ingress) {
            $hostname = [string]$route.hostname
            $service = [string]$route.service
            foreach ($marker in $runtimeMarkers) {
                if ((-not [string]::IsNullOrWhiteSpace($hostname) -and $hostname.IndexOf($marker, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) `
                    -or (-not [string]::IsNullOrWhiteSpace($service) -and $service.IndexOf($marker, [System.StringComparison]::OrdinalIgnoreCase) -ge 0)) {
                    $routeTouchesWafl = $true
                    break
                }
            }
            if ($routeTouchesWafl) { break }
            if ($service -match '(?i)^http_status:\d+$') { continue }

            $originUri = $null
            try { $originUri = [Uri]$service } catch {}
            if ($null -eq $originUri -or -not $originUri.IsAbsoluteUri) {
                $unknownRoute = $true
                break
            }
            $originPort = if ($originUri.IsDefaultPort) { if ($originUri.Scheme -eq 'https') { 443 } else { 80 } } else { [int]$originUri.Port }
            $originHost = [string]$originUri.Host
            $hostIsWafl = $originHost -eq [string]$State.tailscaleIpv4 `
                -or (-not [string]::IsNullOrWhiteSpace([string]$State.tailscaleServeHostname) -and $originHost -eq [string]$State.tailscaleServeHostname)
            if ($originPort -in @([int]$State.nextPort, [int]$State.expoPort) -or $hostIsWafl) {
                $routeTouchesWafl = $true
                break
            }
        }

        if ($routeTouchesWafl) {
            $forbiddenCount++
            $details.Add([pscustomobject]@{ Pid = $processPid; Classification = 'forbidden'; Reason = 'live-ingress-targets-wafl-runtime' })
            continue
        }
        if ($unknownRoute) {
            $unverifiedCount++
            $details.Add([pscustomobject]@{ Pid = $processPid; Classification = 'unverified'; Reason = 'live-ingress-route-unparseable' })
            continue
        }

        $verifiedUnrelatedCount++
        $details.Add([pscustomobject]@{ Pid = $processPid; Classification = 'verified-unrelated'; Reason = 'signed-foreign-service-and-live-ingress-disjoint' })
    }

    return [pscustomobject]@{
        Ready = $waflOwnedCount -eq 0 -and $forbiddenCount -eq 0 -and $unverifiedCount -eq 0
        WaflOwnedCount = $waflOwnedCount
        ForbiddenCount = $forbiddenCount
        VerifiedUnrelatedCount = $verifiedUnrelatedCount
        UnverifiedCount = $unverifiedCount
        Details = [object[]]$details
    }
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

function Convert-WaflQaRecordedStartTimeToUtc {
    param([Parameter(Mandatory = $true)][string]$Value)

    # ConvertTo-Json may round-trip an already-UTC DateTime string without its
    # offset. Treat an offset-less runner ownership timestamp as UTC; treating
    # it as Windows local time creates a false nine-hour PID-reuse mismatch.
    return [DateTime]::Parse(
        $Value,
        [Globalization.CultureInfo]::InvariantCulture,
        [Globalization.DateTimeStyles]::AssumeUniversal -bor [Globalization.DateTimeStyles]::AdjustToUniversal
    )
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
    $expectedStart = Convert-WaflQaRecordedStartTimeToUtc -Value ([string]$Record.startedAtUtc)
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

    $expectedStart = Convert-WaflQaRecordedStartTimeToUtc -Value ([string]$Record.startedAtUtc)
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
