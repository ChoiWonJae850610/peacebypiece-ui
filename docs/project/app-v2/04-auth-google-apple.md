# WAFL v2 Google and Apple Auth Direction - 2.0.0-alpha.1

## Customer login direction

For customer app login, prioritize:

- Google account.
- Apple ID.

This aligns the App-first product with iPhone, iPad, and Android tablet usage.

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

## Native account setup

Apple Developer Program and Google Play Console setup are needed only in later formal testing and distribution phases.

They are not required in this documentation checkpoint.

## Not implemented in this version

This version does not add:

- native OAuth client configuration,
- OAuth credential files,
- Apple sign-in implementation,
- Google sign-in implementation,
- auth API changes,
- DB migration,
- `.env` changes.
