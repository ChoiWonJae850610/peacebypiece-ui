# 2.0.0-alpha.43 External Mobile QA Foundation Evidence

Status: `ALPHA43_EXTERNAL_MOBILE_QA_AND_IOS_DEVELOPMENT_BUILD_COMPLETE`

## Baseline and boundary

- Baseline version/HEAD: `2.0.0-alpha.42` / `b02518e2f41bd3274dd1f61aa28a9094ff48e361`
- Result version: `2.0.0-alpha.43`
- Migration ledger: retained documentation baseline `12/12`; migration/schema execution `0`
- Runtime audit: the retired Expo/ngrok path failed; the replacement TailscaleLan runner then reached Next, Quick Tunnel, local/Tailscale Metro readiness, and bounded external smoke PASS
- Tailscale audit: official Windows package installed; Windows PC and iPhone registered/online in the same tailnet; private IPv4 transport verified without persisting device IPs in tracked source
- Device-load audit: the earlier build exposed ATS; the ATS-corrected build then loaded the private manifest/bundle and displayed WAFL on the real iPhone without ATS recurrence
- Production deployment/access/mutation: false
- Alpha.42 retained evidence and objects: unchanged

This version builds and runtime-verifies a repeatable local Windows QA transport. The legacy Expo/ngrok tunnel candidate was rejected after its approved reconnect failed. Tailscale carries Metro only; Cloudflare Quick Tunnel carries Next/PDF/Viewer HTTPS only. External `/v` security headers and blocking for `/ui`, `/roadmap`, `/functions`, `/system`, and `/dev` passed. It does not deploy WAFL or create a stable public hostname; it does complete bounded internal Development Build distribution and official real-iPhone QA.

## Environment and origin contract

Server variables are `WAFL_EXTERNAL_QA_ENABLED`, `WAFL_EXTERNAL_QA_ORIGIN`, `WAFL_EXTERNAL_QA_HOST_ALLOWLIST`, and `WAFL_EXTERNAL_QA_RUN_TOKEN`. Mobile variables are `EXPO_PUBLIC_WAFL_WEB_BASE_URL` and `EXPO_PUBLIC_WAFL_EXTERNAL_QA`.

The shared validator requires an origin-only URL, exact HTTPS for external QA, no credentials/path/query/fragment, no external-QA localhost, and no production localhost or `trycloudflare.com`. Server enablement also requires the origin host in the exact allowlist and a bounded run token. Disabled external QA leaves existing local/production routing unchanged.

No generated random hostname is present in tracked source. Runtime origins may exist only in the child process environment and `.tmp/wafl-external-qa/`, which remains ignored and excluded from source ZIPs.

## Development-only ATS correction

The installed iOS Development Build reported `The resource could not be loaded because the App Transport Security policy requires the use of a secure connection.` against the private Tailscale Metro HTTP address. Safari reached `/status`, the iPhone and Windows Tailscale nodes were online, iOS Local Network permission was enabled, the PC iOS manifest returned HTTP 200 `application/expo+json`, the PC bundle returned HTTP 200 `application/javascript`, and Metro/Expo Router errors were zero. This fixes the failure boundary at native ATS rather than network, manifest, bundle, or JavaScript transform.

The canonical `app.json` remains static. Its dynamic companion adds only for `APP_VARIANT=development` the exact `100.64.0.0/10` exception with `NSExceptionAllowsInsecureHTTPLoads=true`. Default and production-like Expo configs contain no ATS exception, and `NSAllowsArbitraryLoads` is absent in every variant. The Development EAS profile and TailscaleLan Metro process supply the variant; no `.env` file is created and Cloudflare remains HTTPS-only for Next/PDF/Viewer.

## External Next allowlist

The Next 16 `proxy.ts` uses the request `Host` header and never `x-forwarded-host` as authority. Localhost requests remain available for readiness and existing local-only routes. A non-local request is admitted only when the exact host equals the process-only origin and allowlist.

Allowed externally:

- `GET|HEAD /v`
- `POST /api/public/document-viewer/session`
- `GET|HEAD /api/public/document-viewer/file`
- `GET|HEAD /api/public/document-viewer/download`
- issued Preview page chain under `/workspace/documents/.../preview` and `/workspace/workorders/.../revisions/.../preview`
- the exact read-only Preview target, Preview Read, generated-document list, and controlled generated-PDF file endpoints
- `GET|HEAD /_next/*` and `/favicon.ico`

Blocked externally include `/ui`, `/roadmap`, `/functions`, `/system`, `/dev/*`, `/dev/test-console`, admin/internal tools, migration/simulator routes, arbitrary `/api/v2/*`, and non-GET mutation methods on the Preview read chain. Existing auth, permission, tenant, viewer-session, and R2 server transport checks remain in force.

The public Viewer keeps private no-store, no-referrer, noindex/nofollow/noarchive, nosniff, and CSP headers.

## Expo and runner result

`apps/mobile` provides `start`, `start:lan`, `start:tailscale-lan`, `expo:config`, and `qa:config:audit`. `start:tunnel` is retained only as a deprecated marker and exits with `WAFL_EXPO_TUNNEL_LEGACY_DISABLED`; it cannot invoke Expo. Invalid external configuration fails before Metro. The current dependencies include `expo-dev-client` `55.0.37`; Expo Go is excluded from official WAFL QA. The ATS-corrected signed Development Build completed official alpha.43 user-device QA.

The final mobile dependency state is Expo `55.0.28`, Expo Router `55.0.17`, React Native `0.83.6`, `expo-dev-client` `55.0.37`, and transitive `@expo/log-box` `55.0.13`. A stale lockfile retained Router `55.0.16`, React Native `0.83.0`, and Log Box `55.0.12`; it was preserved rather than edited in place. A new lock candidate was generated from package.json alone under ignored `.tmp` with lifecycle scripts disabled, passed lock-only dependency audit, and replaced the active lock as one exact file. One script-disabled `npm install` then reported the physical tree up to date. `node_modules` was not deleted, `@expo/log-box` was not added directly, and `expo install --check` passed.

The PowerShell runner:

1. accepts `ExpoTunnelLegacyDisabled`, `Lan`, or `TailscaleLan`; the legacy marker always fails explicitly and the default is `TailscaleLan`;
2. for `TailscaleLan`, requires an installed CLI, connected/online backend, and one `100.64.0.0/10` IPv4 address before starting a child process;
3. verifies repository/tool/port/build prerequisites, starts one Quick Tunnel, and parses one bounded HTTPS origin;
4. starts Next with the exact origin/host/run token in that child only and checks local `/v` readiness;
5. sets the public Viewer base to the Cloudflare HTTPS origin but advertises Metro through `EXPO_PACKAGER_PROXY_URL=http://<tailscale-ip>:<expo-port>` and injects `APP_VARIANT=development` only for TailscaleLan Metro;
6. starts Expo with `--lan`, requires local Metro `/status`, and for `TailscaleLan` requires the same endpoint through the Tailscale IPv4 before reporting ready;
7. records non-secret PID/port/time/origin/transport state under `.tmp`, preserves successfully started children on failure, and writes a Failure Handoff;
8. stops only after an explicit stop command and only when marker, PID, executable path, and start time match.

The Cloudflare origin and the Tailscale Metro address have separate roles. The former is public, temporary HTTPS for Next/Viewer; the latter is private development transport for the Expo JavaScript bundle. A phone/tablet and PC must be signed into the same tailnet, and the PC must remain powered on with Metro running. Account identity, auth key, node key, and login URL are never written to tracked source or runner logs.

The actual attempts established that cloudflared and Next were healthy while `@expo/ngrok@4.1.0` used legacy ngrok agent 2.3.40 and the approved reconnect again failed with `remote gone away`. The replacement Tailscale runtime exposed one Windows PowerShell byte-array readiness decode defect; the minimal UTF-8 correction passed string/byte-array regression contracts. Marker-owned processes were stopped before the single corrected rerun, PID 6284 on port 3000 was preserved, and the corrected runner reached `expo-tailscale-lan-ready`.

The bounded external smoke used `Invoke-WebRequest` once per path. `/v` returned HTTP 200 with HTML, private/no-store, CSP, no-referrer, and noindex/nofollow/noarchive. `/ui`, `/roadmap`, `/functions`, `/system`, and `/dev` each returned the external block response. No token exchange, PDF/R2 GET, DB read/write, access counter, event, Worker, or production call was part of the smoke.

No broad Node/Next/Expo/cloudflared kill, automatic retry, cleanup, rollback, or DELETE exists.

## PDF/QR origin guard

Permanent generated documents reject Quick Tunnel origins. Localhost is accepted for a generated document only under an explicit development/test-only state. An optional temporary external QA QR must be HTTPS, non-staging/non-production, marked `TEMPORARY_EXTERNAL_QA_ONLY`, and `.tmp`-only. Alpha.43 creates no QR or PDF.

## Static verification scope

The alpha.43 contract covers origin validation, HTTPS, production Quick Tunnel rejection, external localhost rejection, committed random-host detection, mobile Preview URL generation, exact external path admission, internal blocking, Viewer headers, runner ownership, unrelated-process preservation, raw-token logging prohibition, permanent-PDF temporary-origin rejection, PowerShell parsing, legacy tunnel rejection, Tailscale CLI/disconnected failure handoff, `100.64.0.0/10` IPv4 validation, Cloudflare/Metro role separation, and canonical document/version state.

Final full verification used Node `24.14.0` and the existing `automation-infrastructure` profile: targeted ESLint, root/mobile TypeScript, Expo public config, Next build, alpha.20-alpha.43 contracts, the alpha.42 standalone renderer import smoke, Unicode/PowerShell/docs/route/pipeline contracts, mutation audit, ZIP exclusion policy, and `git diff --check`. The canonical Verify passed. npm audit still reports 9 moderate findings for separate review; `npm audit fix` was not run.

## Runtime and mutation result

| Item | Result |
|---|---:|
| Cloudflare Quick Tunnel | PASS; process-only temporary HTTPS |
| Next `127.0.0.1:3100` | PASS |
| Expo legacy tunnel | failed twice with `remote gone away`; retired |
| Tailscale CLI/service | installed, connected, online |
| Tailscale/Expo LAN runtime | PASS |
| External `/v` smoke | PASS |
| External internal-path guard | PASS |
| Official user-device QA | PASS; ATS-corrected real-iPhone load, navigation, background/re-entry, one Reload |
| DB migration/write | 0 |
| R2 GET/PUT/DELETE | 0/0/0 |
| token mutation | 0 |
| PDF generation | 0 |
| Worker execution | 0 |
| direct R2/S3 access | 0 |
| production mutation | false |

The final physical result is `ALPHA43_ATS_FIXED_USER_DEVICE_APP_LOAD_PASS`. The installed signed app entered through the Development Client deep link, received HTTP 200 `application/expo+json` and HTTP 200 JavaScript over Tailscale, displayed WAFL, navigated basic screens, survived background/re-entry, and displayed WAFL again after exactly one Reload. The former secure-connection message, red screen, crash, and infinite loading did not recur. Login, business-data mutation, and PDF token exchange were excluded. The runner was then stopped canonically with ownership skip zero, ports 3100/8081 clear, and Tailscale retained. Final alpha.43 status is `ALPHA43_EXTERNAL_MOBILE_QA_AND_IOS_DEVELOPMENT_BUILD_COMPLETE`.

## EAS follow-up

Canonical identity is Project `PeaceByPiece`, planned Company `Sanjin Works`, Brand `WAFL`, Website `https://www.wafl.co.kr`, and Bundle Identifier `com.wafl.app`. Apple Developer Individual membership is active; the future account direction is Organization plus App Transfer. Expo owner `lostab` owns `@lostab/wafl-mobile`; iOS and Android use `com.wafl.app`; the internal version is `2.0.0-alpha.43`; and the public app version is `2.0.0`. The ATS-corrected frozen-credential Development Build reused the existing certificate/profile/device and passed. Its duplicate internal build number `1` is accepted for this QA artifact; monotonic auto-increment is a follow-up candidate before the next Development Build. Full policy is recorded in `06-expo-environment-setup.md`, and build evidence is recorded in `42-ios-development-build-evidence.md`.
