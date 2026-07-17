# WAFL v2 iOS Development Build Evidence - 2.0.0-alpha.43

Status: `ALPHA43_EXTERNAL_MOBILE_QA_AND_IOS_DEVELOPMENT_BUILD_COMPLETE`

## Canonical version and identity

- Internal APP_VERSION and mobile package trace version: `2.0.0-alpha.43`.
- Expo/iOS/Android public app version: `2.0.0`.
- `expo.extra.appVersion`: `2.0.0-alpha.43`.
- iOS Bundle Identifier and Android package: `com.wafl.app`.
- Expo project: `@lostab/wafl-mobile` with the existing linked project ID.
- EAS CLI policy: `21.0.1`, remote app-version source, one internal `development` profile.
- Expo Go is excluded from official WAFL QA. EAS Development Build is the official device-QA path.

The public version is the numeric release triplet required by the Apple-facing build. The prerelease suffix remains in the internal source and `extra.appVersion` for traceability. Project Name and Company Name remain independent of the long-lived WAFL brand identifier `com.wafl.app`.

## Apple signing readiness

The Individual Apple Team is connected. Exactly one iPhone is registered and included in the existing ad hoc profile. One valid Distribution Certificate and one valid ad hoc provisioning profile exist for `com.wafl.app`. Full Team, device, certificate, profile, Apple ID, credential, and session identifiers are intentionally omitted.

## First build result

The first EAS iOS Development Build completed credential and provisioning setup but ended in `ERRORED` at Install Pods/React Native Codegen. The audited direct cause was the native declaration emitted by `react-native-screens` `4.26.2`, which was incompatible with the effective React Native Codegen path. No installable artifact or QR was created.

## SDK 55 correction

The corrected Expo SDK 55 online compatibility baseline is:

| Package | Version |
| --- | --- |
| Expo | `55.0.28` |
| Expo Router | `55.0.17` |
| React | `19.2.0` |
| React Native | `0.83.6` |
| React Native Screens | `4.23.0` |
| React Native Safe Area Context | `5.6.2` |
| Expo Constants | `55.0.17` |
| Expo Linking | `55.0.16` |
| Expo Font | `55.0.8` |
| Expo Dev Client | `55.0.37` |

The empty `expo-font` plugin entry introduced as an install side effect was removed; runtime font loading and the `expo-font` package remain. `newArchEnabled` is absent. `ios.config.usesNonExemptEncryption` is `false`. `expo-updates`, `runtimeVersion`, auto-increment, preview, production, and submit configuration remain absent.

## Installed build ATS failure

The dependency-corrected Development Build subsequently finished, produced an installable internal artifact, and was installed on the registered iPhone. Its native launcher opened but reported `The resource could not be loaded because the App Transport Security policy requires the use of a secure connection.` for the HTTP Tailscale Metro address.

The iPhone reached the same Metro `/status` URL in Safari, WAFL Local Network permission was enabled, both Tailscale nodes were online, the PC iOS manifest audit returned HTTP 200 `application/expo+json`, the PC JavaScript bundle audit returned HTTP 200 `application/javascript`, and Metro/Expo Router errors were zero. There was no actual iPhone bundle request. These facts identify native ATS as the direct failure before bundle load.

## Development-only ATS correction

`apps/mobile/app.config.js` merges the canonical `app.json`. Only `APP_VARIANT=development` adds `NSAppTransportSecurity.NSExceptionDomains["100.64.0.0/10"].NSExceptionAllowsInsecureHTTPLoads=true`. The EAS Development profile supplies that process variable. Default and production-like Expo config contain no Tailscale ATS exception, and `NSAllowsArbitraryLoads` is absent. Name, owner, slug, public/internal versions, EAS project, Bundle Identifier, tablet support, encryption declaration, Android package, plugins, and remote app-version source remain unchanged.

The native Info.plist change requires a new Development Build. Reload, Expo Go, EAS Update, reinstalling the old binary, or changing Local Network permission cannot alter the old embedded ATS policy.

## Static verification

- `npm ls`: no invalid, extraneous, or peer-conflict result; no Expo Font 57.x.
- `expo install --check`: PASS.
- Expo Doctor: 19/19 PASS.
- Nine corrected alpha.32/33/34/35/36/37/38/40/41 version contracts: PASS.
- Node `24.14.0` canonical `automation-infrastructure` Verify: PASS.
- Next build, root/mobile TypeScript, targeted ESLint, Expo public config, alpha.20-alpha.43 contracts, alpha.42 standalone renderer import smoke, document/Unicode/PowerShell contracts, and `git diff --check`: PASS.
- Mutation audit: 202 findings, 0 high-risk.
- npm audit: 9 moderate findings retained; `npm audit fix` was not run.
- Migration, DB, R2, token, PDF, Worker, and production mutation: zero.

## ATS-corrected build and real-device result

After canonical static verification passed, one non-interactive frozen-credential EAS iOS Development Build ran. It reused the existing Distribution Certificate, active ad hoc profile, and one registered iPhone. Pods, React Native Codegen, Xcode archive, internal artifact generation, install page, and QR all passed. Direct in-memory inspection of the IPA proved Bundle Identifier `com.wafl.app`, public version `2.0.0`, the exact `100.64.0.0/10` insecure-HTTP exception, and no `NSAllowsArbitraryLoads`.

The build retained iOS build number `1`, the same as the earlier successful internal build. The owner accepts that duplicate for this installed internal QA artifact because ad hoc signing, installation, native launch, manifest/bundle load, and the complete bounded device smoke passed. No replacement alpha.43 build is created. Before the next Development Build, adopt or explicitly decide an EAS-compatible monotonic iOS auto-increment policy; the alpha.43 tracked config continues to omit `autoIncrement`.

On the real iPhone, Tailscale remained connected and the signed WAFL Development Build entered through its development-client deep link. Metro returned HTTP 200 `application/expo+json`, advertised the private Tailscale host, and returned the JavaScript bundle as HTTP 200 `application/javascript`. The app displayed the real WAFL screen without the former ATS secure-connection error. The user navigated basic screens, backgrounded and re-entered the app, then performed exactly one Development Client Reload; WAFL displayed again. No fatal red screen, crash, or infinite loading occurred. Login, business-data changes, and PDF token exchange were not performed.

The final external QA runner was stopped through the canonical ownership checks. Only its cloudflared, Next, and Metro processes ended; ownership skip was zero, ports 3100/8081 were released, and Tailscale service/login remained available. DB/R2/token/PDF/Worker/production mutation stayed zero. Final result: `ALPHA43_EXTERNAL_MOBILE_QA_AND_IOS_DEVELOPMENT_BUILD_COMPLETE`.
