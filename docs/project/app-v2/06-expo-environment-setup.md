# WAFL v2 Expo Environment Setup

Document role: canonical owner for supported Expo/native environment, app identity, installed-build reuse, and setup boundaries. Runtime operations belong to `41-external-mobile-qa-runbook.md`; device acceptance belongs to `05-device-test-plan.md`; permanent approval and delivery rules belong to `09-codex-working-rules.md`.

## Canonical identity

| Field | Value |
| --- | --- |
| Project | `PeaceByPiece` |
| Brand | `WAFL` |
| Planned company | `Sanjin Works` |
| Website | `https://www.wafl.co.kr` |
| Expo owner | `lostab` |
| Expo project | `@lostab/wafl-mobile` |
| EAS project ID | `6cc3b260-a2cc-4c97-9c15-764bda530836` |
| iOS bundle identifier | `com.wafl.app` |
| Android package | `com.wafl.app` |
| Expo public version | `2.0.0` |
| Internal APP_VERSION | `2.0.0-alpha.49` |
| iOS Development Build | build number `1` |

`com.wafl.app` is the stable WAFL brand identifier and does not derive from repository project or planned company names.

## Supported source baseline

- Mobile application directory: `apps/mobile`.
- Expo SDK: `55.0.28`.
- Expo Router: `55.0.17`.
- React: `19.2.0`.
- React Native: `0.83.6`.
- Expo Dev Client: `55.0.37`.
- Expo Go is not an official WAFL QA path.
- Root package/workspace structure remains separate from the standalone mobile package.

The active package and lockfile are authoritative. Do not install, update, remove, or regenerate dependencies merely to restate this document. Dependency/lockfile changes require an exact approved Delta.

## App version split

- `lib/constants/version.ts` and mobile trace metadata carry the internal alpha version.
- Expo/iOS/Android public app version remains `2.0.0` until a native/release Delta changes it.
- `expo.extra.appVersion` mirrors the internal alpha version for diagnostics.
- iOS build number remains `1` for the accepted installed Development Build.
- Root `package.json` follows its own package metadata policy and is not the app display version.

## Installed Development Build reuse

Reuse the current installed iOS Development Build when a Delta changes only JavaScript/TypeScript, server code compatible with the existing client, contracts, or documents and keeps all of these unchanged:

- native dependencies and plugins;
- Info.plist and AndroidManifest inputs;
- ATS policy;
- bundle/package identifiers;
- Expo SDK and React Native native compatibility;
- EAS profile, credentials, signing, project identity, and device registration.

If any item must change, stop the non-native version. Do not run EAS Build/Update or modify credentials automatically.

## Development-only ATS boundary

The Development variant alone permits private Tailscale Metro HTTP through the existing `100.64.0.0/10` exception. Default and production-like config contain no such exception. `NSAllowsArbitraryLoads`, public HTTP exceptions, and a production Tailscale exception are forbidden.

The exception is native binary configuration. Reload or JavaScript delivery cannot change it.

## External development transport inputs

Process-local mobile public inputs:

- `EXPO_PUBLIC_WAFL_API_BASE_URL`: exact Tailscale Serve HTTPS origin for developer authentication and business API;
- `EXPO_PUBLIC_WAFL_WEB_BASE_URL`: exact Cloudflare Quick Tunnel HTTPS origin for Preview/Viewer;
- the existing external-QA flag and Tailscale Metro advertisement.

Do not inject identity hashes, DB fingerprints, mutation approvals, session secrets, credentials, or connection codes into Metro/public bundle variables.

Transport implementation and start/stop procedure are owned by `41-external-mobile-qa-runbook.md`.

## EAS boundary

The repository currently retains one internal `development` profile with Development Client and internal distribution. Preview/production/submit profiles, EAS Update channels/runtime policy, automatic build-number changes, App Store/TestFlight/Play workflows, account transfer, and credential operations require separate approval.

The accepted Apple account and build history is immutable evidence in `42-ios-development-build-evidence.md`; do not repeat or rewrite it here.

## Platform testing

- Windows cannot run the iOS Simulator; use real iPhone/iPad hardware with the installed Development Build.
- Android testing may use Galaxy hardware or Android Studio emulator when the active Delta permits it.
- Actual acceptance and `NOT_RUN` classification are owned by `05-device-test-plan.md`.

## Setup safety

- Never persist temporary Quick Tunnel origins, Tailscale identity, auth keys, login URLs, account credentials, certificate identifiers, DB fingerprints, or runtime mutation approvals in tracked config.
- Do not add a firewall rule by default. A proven reachability failure requires a separate narrow approval.
- Do not change Tailscale account, policy, Funnel, service state, or device sharing as routine setup.
- Do not introduce another Expo tunnel provider or fallback transport.
- Do not claim a new native build, Expo install correction, or device registration unless corresponding immutable evidence exists.

## Current alpha.49 effect boundary

Alpha.49 changes canonical documentation and document-validation infrastructure only. Expo public version, iOS build number, SDK, dependencies, plugins, native manifests, ATS, EAS profile, credentials, EAS Build, and EAS Update remain unchanged.
