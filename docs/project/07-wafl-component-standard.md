# WAFL Component Standard

## Scope

WAFL is the shared visual and interaction system for PeaceByPiece. Repeated UI structures must converge on shared tokens, primitives, and composed patterns.

## Required Component Families

- page shell, page hero, workspace shell
- summary card and metric card
- section panel and section header
- filter/search/action bar
- table, responsive list, and mobile card fallback
- button, icon button, overflow action, and destructive action
- input, select, textarea, date, quantity, and validation message
- modal, drawer, sheet, confirmation, and focus trap
- loading, empty, error, permission-blocked, and locked states
- toast, inline feedback, save state, and mutation progress
- file preview/upload state and usage/quota visualization

## Visual Rules

- Use theme tokens for spacing, radius, border, typography, elevation, and state colors.
- Avoid screen-local arbitrary radius, shadow, and spacing when a WAFL token exists.
- Information hierarchy is more important than decorative variation.
- Dense operational screens may reduce spacing but must retain touch target and readability standards.

## Interaction Rules

- Buttons have explicit default, hover, focus, disabled, loading, and destructive states.
- Modals and drawers lock background scroll, preserve return focus, support ESC where applicable, and prevent accidental duplicate submission.
- Mobile numeric inputs request numeric keyboards where valid.
- Tables define overflow, sticky behavior, empty state, and mobile fallback.
- Save feedback must distinguish saving, saved, failed, stale, and locked states.

## Accessibility Rules

- Semantic labels and accessible names are mandatory.
- Keyboard navigation and visible focus are required for PC workflows.
- Color alone cannot carry state meaning.
- Dialog title, description, focus trap, and close behavior must be present.
- Touch targets must remain usable on iPhone, Galaxy, and tablet devices.

## Adoption Rule

A new screen must use existing WAFL components first. A new shared component is justified when at least one of these applies:

- the pattern repeats across two or more screens;
- it implements a safety or accessibility contract;
- it centralizes responsive behavior;
- it removes divergent state handling.

Do not force commonization when domain semantics materially differ. Prefer a shared primitive plus domain composition.

## Review Checklist

- no avoidable one-off token values;
- all resource states covered;
- responsive behavior defined;
- permission and mutation state visible;
- keyboard, focus, and scroll behavior verified;
- customer-facing copy uses canonical terminology/i18n;
- component catalog or documentation updated when a reusable API changes.
