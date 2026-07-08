# WAFL v2 App Device Test Plan - 2.0.0-alpha.1

## Purpose

This document defines the first App-first device QA matrix. It is a planning document only and does not implement tests.

## iPhone

Verify:

- mobile one-card production flow,
- camera access,
- image selection,
- bottom sheet behavior,
- login,
- share flow.

## iPad mini

Verify:

- tablet portrait layout,
- product selector drawer,
- overflow controls,
- size/color table readability.

## iPad Pro

Verify:

- tablet landscape layout,
- production-card authoring,
- multi-touch image review,
- document/output review.

## Galaxy Tab

Verify:

- Android tablet layout,
- file picker,
- camera permission,
- Korean input,
- screen rotation.

## Shared QA requirements

For every app feature that edits or shares production data, later implementation must verify:

- Korean input stability,
- numeric input behavior,
- modal/bottom-sheet close behavior,
- orientation recovery,
- image/file permission prompts,
- share-sheet behavior where available,
- no raw R2/Worker/internal token exposure.

This version is documentation only, so no device QA evidence is required yet.
