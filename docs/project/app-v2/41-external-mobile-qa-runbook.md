# WAFL External Mobile QA Runbook

Status: `ALPHA43_EXTERNAL_MOBILE_QA_AND_IOS_DEVELOPMENT_BUILD_COMPLETE`.

## Preconditions

- Windows PC remains powered on and connected.
- Repository is at the approved alpha.43 source and has a successful Next production build.
- Node, npm, npx, the installed Expo CLI under `apps/mobile/node_modules`, `cloudflared`, and the Tailscale CLI are available.
- Expo owner `lostab`, EAS project `@lostab/wafl-mobile`, linked project ID, `expo-dev-client` `55.0.37`, and the single internal `development` profile remain aligned before any build.
- `apps/mobile/package.json`, its lock, and the physical tree remain aligned at Expo `55.0.28`, Expo Router `55.0.17`, React Native `0.83.6`, `expo-dev-client` `55.0.37`, and transitive `@expo/log-box` `55.0.13`. `@expo/log-box` must not become a direct dependency; `npm ls`, `npm ls --package-lock-only`, and `expo install --check` must remain clean before a build work order.
- `cloudflared` discovery order is PATH, the documented user-tool locations, or an explicit `-CloudflaredPath`. The repository never contains the binary.
- The Windows PC and test phone/tablet are connected and online in the same tailnet.
- The PC has one Tailscale IPv4 in `100.64.0.0/10`.
- The Development EAS profile resolves `APP_VARIANT=development`; default/production-like config has no ATS exception and no variant may contain `NSAllowsArbitraryLoads`.
- The selected Next port and Expo port 8081 are free. Port 3000 may remain occupied when `-NextPort 3100` is selected.

If `cloudflared` is absent, stop. After separate installation approval, the official Windows package command is:

```powershell
winget install --id Cloudflare.cloudflared --exact
```

Do not run that command as part of normal startup.

## Tailscale installation and login boundary

The audited Windows PC and iPhone are installed, registered, and online in the same tailnet. Account/tailnet creation, login, mobile installation, VPN connection, and firewall changes are not part of runner startup. The official Windows guide is `https://tailscale.com/docs/install/windows`; iOS and Android guides are `https://tailscale.com/docs/install/ios` and `https://tailscale.com/docs/install/android`.

For a replacement Windows machine, after a separate installation approval, the bounded package command is:

```powershell
winget install --id Tailscale.Tailscale --exact --source winget
```

If `winget` is unavailable, use the signed Windows installer linked by the official Tailscale guide rather than an unofficial package. Login is required on the PC. Install the official Tailscale app on every iPhone/iPad/Android device, allow its VPN configuration, and sign in to the same tailnet. Never place an auth key, node key, account identity, or full login URL in tracked files, screenshots, or logs.

Do not add a firewall rule by default. Tailscale normally uses outbound connectivity and can fall back to DERP. If a separately approved runtime proves that the connected peer cannot reach Metro on TCP 8081, collect the failure evidence and request a narrow Windows inbound-rule approval scoped to TCP 8081, the Node/Expo process, the Tailscale interface/private profile, and remote `100.64.0.0/10`. Never disable Windows Firewall broadly.

## Start

The Expo/ngrok tunnel path is retired. `ExpoTunnelLegacyDisabled` and `npm run start:tunnel` return an explicit error and never start Expo. After Tailscale installation/login/device setup and a separate one-run approval, start the split transport with:

```powershell
.\tools\dev\start-wafl-external-qa.ps1 `
  -MobileTransport TailscaleLan `
  -NextPort 3100 `
  -ExpoPort 8081 `
  -CloudflaredPath 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
```

Use `-NextMode development` only when explicitly choosing the slower development server. The default is the previously built production server.

The runner validates Tailscale connection and IPv4 first, starts cloudflared before Next so the exact random HTTPS origin is known, starts Next with the origin contract, and checks local `/v`. It then starts Expo `--lan`, advertises `exp://<tailscale-ip>:8081`, injects `APP_VARIANT=development` only into the TailscaleLan Metro child, and verifies Metro both locally and through the PC's Tailscale IPv4. It restores the parent process environment and does not call the external Cloudflare origin.

`Lan` is available only for same-LAN diagnosis. It is not the approved cross-network device transport and does not prove Tailscale readiness. Cloudflare Quick Tunnel remains Next/Viewer-only; the Expo bundle URL remains Tailscale-only. Do not merge the two origins, and never persist the random `trycloudflare.com` hostname in tracked source or a permanent QR.

The terminal displays the public Viewer base origin, owned PIDs, Metro connection guidance, and the stop command. It never displays a document token, DB/R2 credential, signed URL, R2 key, or run token. Detailed child logs and state are under ignored `.tmp/wafl-external-qa/`.

If any stage fails, do not rerun automatically. Read `failure-handoff.json`, preserve the listed live PIDs, and request the smallest next approval. The runner does not stop or clean an earlier successful child.

## Status

```powershell
.\tools\dev\status-wafl-external-qa.ps1
```

This reports state, last successful stage, transport mode, temporary Viewer origin, same-tailnet Expo URL, and whether each recorded PID remains alive. It performs no external request.

## Bounded external smoke after separate approval

The first runtime smoke is limited to:

- `GET /v` status and content type;
- Cache-Control, Referrer-Policy, X-Robots-Tag, X-Content-Type-Options, and CSP;
- block response for `/ui`, `/roadmap`, `/functions`, and one `/dev/*` path;
- confirmation of the actual Cloudflare-delivered `Host` contract without persisting raw headers or cookies.

Do not exchange a token, request a PDF, invoke an issued Preview DB read, perform an R2 GET, increment access count, create an event, rotate/revoke a token, or generate a PDF in this smoke.

## Official device QA

Expo Go is excluded from official WAFL QA evidence and cannot complete this runbook's device gate. Earlier `exp://` connectivity is retained only as transport-foundation evidence.

The dependency-corrected installed build reached the native launcher but was blocked by ATS for the private HTTP Metro address. Safari reachability, Local Network permission, Tailscale state, and PC manifest/bundle audits excluded the transport and JavaScript paths. The ATS-corrected EAS iOS Development Build then passed the following official device sequence, which remains the reusable procedure for later sessions:

1. Confirm the PC and iPhone/iPad/Galaxy Tab show online in the same tailnet.
2. Open the signed WAFL Development Build and connect its Metro launcher to the PC's Tailscale address without substituting localhost or an ordinary LAN IPv4.
3. Confirm the WAFL card loads and reloads while the private Tailscale connection remains active.
4. Confirm the mobile Preview base uses the separate Cloudflare HTTPS origin and contains no path/query/fragment configuration.
5. Test public `/v` shell access without placing a token in a path, query, screenshot, or log.
6. Test authenticated issued Preview only after a separately approved runtime read and an existing valid same-origin session. Do not weaken auth or tenant checks.
7. Verify iPad/Galaxy Tab portrait and landscape behavior; ordinary phone cards remain portrait-first.
8. Record device/OS, result, console/network failures, and whether any runtime mutation was approved.

The embedded QR scan and actual Viewer PDF belong to a later fixed-host/staging or separately approved runtime test. A random Quick Tunnel URL is not a permanent QR origin.

## Stop

Explicitly stop the runner-owned processes:

```powershell
.\tools\dev\stop-wafl-external-qa.ps1
```

The script checks the repository, owner marker, PID, executable path, and original start time before each termination. It skips an ownership mismatch and never terminates processes by broad name. After stopping, run status again. Do not delete `.tmp` evidence merely to make the result look clean.

When the PC, Tailscale connection, Quick Tunnel, Next, or Expo process stops, the relevant transport stops. A later QA session receives a different Quick Tunnel origin and must start from a new approved run. The installed ATS-corrected signed EAS iOS Development Build may be reused for future compatible Development QA; a new native build is required only when native configuration or dependencies change. Its canonical Bundle Identifier is `com.wafl.app`; current Individual Apple membership is active, and future Organization ownership uses App Transfer as defined in `06-expo-environment-setup.md`. Build history, accepted alpha.43 internal build number `1`, and the follow-up auto-increment candidate are recorded in `42-ios-development-build-evidence.md`.
