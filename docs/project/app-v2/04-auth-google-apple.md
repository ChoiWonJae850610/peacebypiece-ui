# WAFL v2 Google and Apple Auth Direction - 2.0.0-alpha.1

## Customer login direction

For customer app login, prioritize:

- Google account.
- Apple ID.

This aligns the App-first product with iPhone, iPad, and Android tablet usage.

Alpha.47 Tailscale developer auto-connect is a dev/test-only QA mechanism, not customer login and not a replacement for the future native Google/Apple flow. It accepts the Serve-provided login only on the exact tailnet Serve host, maps it through a process-local hash pair to one active WAFL system administrator, and creates a bounded Company A effective workspace session. It is production-blocked, retains the one-time code fallback, and stores no raw login or email in tracked source.

## Role and permission stance

The app may show Korean role labels:

- 시스템관리자
- 고객사 관리자
- 디자이너
- 재고관리

Runtime behavior must still be permission/action-code based instead of hardcoded role branching.

## Signup and provisioning boundary

Customer signup, approval, provisioning, Trial, billing, and company membership policies remain preserved from the existing product policy documents.

After signup/provisioning, a customer user enters the app through an approved company membership and permission context.

## Apple Developer account and transfer policy

Apple Developer Program Individual enrollment is complete and Apple approval email is pending. EAS Build, App Store Connect setup, credentials, project linking, device registration, TestFlight, and store submission must not start until a later approved work order after the account is active.

The future company-account direction is Apple Developer Organization under planned Company `Sanjin Works`, followed by Apple App Transfer from the Individual account. The canonical Bundle Identifier is `com.wafl.app`; it is a stable WAFL brand identifier and does not depend on Project Name `PeaceByPiece` or Company Name `Sanjin Works`.

Apple login and provider selection remain user-controlled. Codex must not enter credentials, create unattended auth keys, or change account/team policy without explicit approval. The technical EAS and identifier authority is `06-expo-environment-setup.md`.

## Not implemented in this version

This version does not add:

- native OAuth client configuration,
- OAuth credential files,
- Apple sign-in implementation,
- Google sign-in implementation,
- auth API changes,
- DB migration,
- `.env` changes.
