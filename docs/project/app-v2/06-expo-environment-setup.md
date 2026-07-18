# WAFL v2 Expo Environment Setup Plan - 2.0.0-alpha.45

## Alpha.45 installed-build reuse

Alpha.45 is JavaScript/UI-only and reuses iOS Development Build number 1. Public version `2.0.0`, identity, SDK/native dependencies, EAS profile, ATS development exception, certificate/profile/device state, and `APP_VARIANT=development` remain unchanged. Internal `extra.appVersion` is `2.0.0-alpha.45`; no EAS Build or EAS Update is authorized.

The final ProductionCard information-density correction changes only React Native presentation and contracts. It removes repeated overview sections and adjusts responsive hero sizing without changing native configuration, permissions, plugins, signing, or the installed binary.

The installed build completed the final alpha.45 physical-iPhone visual and read-only flow. The owner accepted the ProductionCard overview shell, and no native dependency, EAS Build, EAS Update, credential, profile, device-registration, ATS, or build-number change occurred.

## Alpha.44 installed-build reuse

- Alpha.44 changes JavaScript/Next source only and reuses the installed ATS-corrected alpha.43 Development Build.
- Public Expo version remains `2.0.0`; internal `extra.appVersion` and mobile package trace become `2.0.0-alpha.44`.
- `app.config.js`, the Development-only `100.64.0.0/10` ATS exception, `eas.json`, native plugins/dependencies, Bundle Identifier, Android package, remote version source, and internal build number are unchanged.
- `app.json` now marks `mockOnly: false` and `dataMode: dev-test-read-only`; this metadata is descriptive and is never an authorization input.
- No EAS Build, EAS Update, credential/profile/device operation, native dependency, or package installation is authorized or required for alpha.44.
- The installed alpha.43 binary completed alpha.44 physical iPhone connection, actual list/recent-and-legacy-detail, navigation, background/re-entry, and disconnect. The legacy-detail correction is JavaScript/proxy-only and does not alter ATS, Info.plist, native plugins, credentials, or build number.

## Purpose

This document records the Expo setup direction and the first skeleton choice.

## Development baseline

Expected local baseline:

- Windows PC.
- VS Code.
- Node.js.
- Existing repository and Git workflow.

Current skeleton:

- Location: `apps/mobile`.
- SDK: Expo SDK 55.
- React Native: `0.83`.
- React: `19.2.0`.
- Expo Router: `~55.0.16`.
- App display version: `2.0.0-alpha.2`.
- Root `package.json`, root lockfiles, and monorepo/workspace configuration are not changed.

Node compatibility decision:

- The owner environment is Node `20.20.2` and npm `10.8.2`.
- Expo SDK 55 requires Node `20.19.x`.
- Expo SDK 56 and 57 require Node `22.13.x`, so they are not selected for this checkpoint.

Current native QA foundation uses:

- EAS CLI `21.0.1` with project `@lostab/wafl-mobile`.
- `expo-dev-client` `55.0.37` and the `development` internal-distribution profile for every official mobile QA gate.
- Expo Go only for noncanonical exploratory inspection; it cannot satisfy WAFL QA or release evidence.

Current alpha.43 resolved dependency baseline:

- Expo `55.0.28`, Expo Router `55.0.17`, React `19.2.0`, React Native `0.83.6`, and `expo-dev-client` `55.0.37`.
- Transitive `@expo/log-box` is `55.0.13` and is not a direct dependency.
- The stale active lock was preserved under ignored `.tmp`; a package.json-only isolated candidate lock was generated with scripts disabled, audited with `npm ls --package-lock-only`, and copied over the active lock only after the audit passed.
- One script-disabled `npm install` reported the physical tree up to date. Physical and lock-only `npm ls`, `npm explain @expo/log-box`, `expo install --check`, and the Node `24.14.0` canonical Verify passed without deleting `node_modules` or running lifecycle scripts.
- npm audit retains 9 moderate findings for a separate security work order. No audit fix, force, legacy-peer-deps, SDK upgrade/downgrade, or native prebuild was run.

## iOS testing

Windows cannot directly run the iOS Simulator.

iOS testing should use:

- real iPhone/iPad hardware with an EAS Development Build,
- EAS Build when formal test builds are needed.

## Android testing

Android testing should use:

- Galaxy Tab hardware when possible,
- Android Studio emulator as a fallback or supplement.

## Not done in this version

This version still does not create:

```text
native build files
production OAuth credentials
real camera/file/share behavior
```

Dependency installation and lockfile generation are allowed only inside `apps/mobile`.

## 2.0.0-alpha.43 external QA foundation

The alpha.43 transport foundation uses `expo start --lan` advertised through a private Tailscale IPv4. `apps/mobile/package.json` exposes `start`, `start:lan`, `start:tailscale-lan`, `expo:config`, and `qa:config:audit`; `start:tunnel` is an explicit legacy-disabled error marker. External QA startup fails before Metro unless `EXPO_PUBLIC_WAFL_EXTERNAL_QA=true` and `EXPO_PUBLIC_WAFL_WEB_BASE_URL` is a separate Cloudflare HTTPS origin with no path, query, fragment, credentials, or localhost host. `EXPO_PACKAGER_PROXY_URL` carries only `http://<tailscale-ip>:<expo-port>`.

The current direct mobile dependencies include `expo-dev-client` `55.0.37` through the Expo SDK 55 resolver. No repository-owned custom native module, `expo-updates`, or runtime-version policy is added. Expo Go is excluded from official QA even when it can reach this Metro transport. Alpha.43 completed official real-iPhone QA with the ATS-corrected signed Development Build.

The Windows runner is documented in `41-external-mobile-qa-runbook.md`. It does not persist the random tunnel origin, Tailscale account identity, auth material, or login URL in an env file or tracked config. The approved split runtime, external smoke, real-device load, background/re-entry, and one Reload passed; the final runner was stopped while Tailscale remained running.

## Development-only iOS ATS boundary

The installed signed Development Build proved the native launcher path but failed before its JavaScript bundle request with the iOS message `The resource could not be loaded because the App Transport Security policy requires the use of a secure connection.` This is not a Tailscale, firewall, Metro, manifest, or bundle-transform failure: Safari reached the same private `/status` endpoint, iOS Local Network permission was enabled, and PC manifest/bundle audits returned HTTP 200 while Metro and Expo Router errors remained zero.

`apps/mobile/app.json` remains the canonical static config. `app.config.js` merges that config and, only when `APP_VARIANT=development`, adds `NSAppTransportSecurity.NSExceptionDomains["100.64.0.0/10"].NSExceptionAllowsInsecureHTTPLoads=true`. Default and production-like config contain no Tailscale ATS exception. `NSAllowsArbitraryLoads` is forbidden and absent. `eas.json` supplies the variant only to the internal Development profile, and the TailscaleLan runner supplies it only to the process-local Metro child environment. No tracked env file, production exception, Cloudflare exception, Bundle Identifier change, or credential path is introduced.

Because Info.plist is embedded in the native binary, the earlier installed build could not receive this correction through Reload, Expo Go, or EAS Update. The replacement internal iOS Development Build reused the existing Distribution Certificate, ad hoc profile, and registered iPhone, and its embedded plist and real-device load passed.

## Canonical project, app, and account identity

| Field | Canonical policy |
| --- | --- |
| Project | `PeaceByPiece` |
| Company | `Sanjin Works` (planned) |
| Brand | `WAFL` |
| Website | `https://www.wafl.co.kr` |
| Bundle Identifier | `com.wafl.app` |
| Apple Developer current | Individual membership active |
| Apple Developer future | Organization followed by App Transfer |
| Official mobile QA | EAS Development Build |
| Metro transport | private Tailscale |
| Next/PDF/Viewer transport | controlled Cloudflare HTTPS |

`com.wafl.app` is a long-lived WAFL brand identifier. It does not derive from Project Name `PeaceByPiece`, planned Company Name `Sanjin Works`, repository folder names, or future legal-entity naming changes. Project Name and Company Name may change independently without renaming the Bundle Identifier. Any exception requires a separate owner decision based on an actual Apple platform constraint.

The current source uses owner `lostab`, EAS project `@lostab/wafl-mobile`, linked project ID `6cc3b260-a2cc-4c97-9c15-764bda530836`, and `com.wafl.app` for both iOS and Android. Project linking and static Development Build configuration do not create Apple credentials, provisioning profiles, registered devices, or a native build.

## EAS follow-up audit

Repository state at alpha.43:

- Apple Developer: Individual membership active.
- Expo account/project identity: owner `lostab`, full name `@lostab/wafl-mobile`, project ID `6cc3b260-a2cc-4c97-9c15-764bda530836` linked in tracked app config.
- `eas.json`: EAS CLI `21.0.1` and one `development` profile with `developmentClient: true`, `distribution: internal`, and process-scoped `APP_VARIANT=development`.
- `expo-dev-client`: `55.0.37`, resolved by Expo SDK 55.
- version policy: internal APP_VERSION/mobile package metadata is `2.0.0-alpha.43`; Expo public app version is `2.0.0`; `expo.extra.appVersion` is `2.0.0-alpha.43`.
- EAS version policy: `cli.appVersionSource` is `remote`; `autoIncrement`, preview/production profiles, submit, channels, and runtime version remain absent.
- iOS physical-device internal development build: the ATS-corrected frozen-credential build finished, reused the existing Distribution Certificate and active ad hoc profile, retained the registered iPhone, and passed installation plus real-device WAFL load without the former ATS error.
- corrected SDK 55 baseline: React Native `0.83.6`, Screens `4.23.0`, Safe Area Context `5.6.2`, Constants `55.0.17`, Linking `55.0.16`, Font `55.0.8`, and Dev Client `55.0.37`. `expo install --check`, Expo Doctor 19/19, and canonical Verify pass.
- Android internal development distribution: not configured or built in this checkpoint.
- build numbers: the installed alpha.43 internal QA artifact retained iOS build number `1`, matching the earlier successful internal build, and is accepted for this completed Development Build smoke. Evaluate an EAS-compatible monotonic iOS `autoIncrement` policy before the next Development Build; alpha.43 does not add it retroactively.
- EAS Update: choose a runtime policy only when `expo-updates` and channels are approved. Prefer the official fingerprint policy for stronger native compatibility, or `appVersion` only with a mandatory native-version bump discipline.

Only the `development` internal-distribution profile exists in alpha.43. Preview, production, submit, EAS Update channels, runtime version, and auto-increment remain separately approved future work. The EAS project may later transfer to a Sanjin Works Expo Organization; no transfer is performed in this checkpoint.

See `42-ios-development-build-evidence.md` for the bounded credential, failure, correction, and second-build evidence. Full Apple Team, device, certificate, profile, and credential identifiers are never canonical documentation.
