# WAFL v2 Expo Environment Setup Plan - 2.0.0-alpha.1

## Purpose

This document records the future Expo setup direction without creating an Expo project in this version.

## Development baseline

Expected local baseline:

- Windows PC.
- VS Code.
- Node.js.
- Existing repository and Git workflow.

Future implementation may evaluate:

- Expo CLI.
- EAS CLI.
- Expo Go for the earliest mock tests.
- development build when native auth, camera, file, or platform APIs require it.

## iOS testing

Windows cannot directly run the iOS Simulator.

iOS testing should use:

- real iPhone/iPad hardware with Expo Go or a development build,
- EAS Build when formal test builds are needed.

## Android testing

Android testing should use:

- Galaxy Tab hardware when possible,
- Android Studio emulator as a fallback or supplement.

## Not done in this version

This version does not run commands or create:

```text
mobile/
apps/mobile/
Expo project
EAS config
native build files
package dependency changes
lockfile changes
```

Expo skeleton creation is planned for `2.0.0-alpha.2`.
