# 0.20.59 build fix

## Scope

Fix the 0.20.58 build failure caused by Korean i18n multiline strings in `lib/i18n/ko/workorder.ts`.

## Cause

The attachment empty-state strings were split across physical lines inside double quotes. Turbopack parsed this as an unterminated string constant.

## Fix

- Converted attachment empty-state copy to escaped newline strings.
- Updated `APP_VERSION` to `0.20.59`.

## Non-goals

- No API changes.
- No DB schema changes.
- No permission/state-transition changes.
- No R2, attachment, memo, trash, or purge flow changes.
