# WAFL v2 Expo Environment Setup Plan - 2.0.0-alpha.2

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

Future implementation may evaluate:

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

This version does not create:

```text
EAS config
native build files
production OAuth credentials
real camera/file/share behavior
```

Dependency installation and lockfile generation are allowed only inside `apps/mobile`.
