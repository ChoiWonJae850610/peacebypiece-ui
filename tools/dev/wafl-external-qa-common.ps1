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
