# WAFL component quality pass 0.21.36

## Goal

0.21.36 is a low-risk quality pass for shared WAFL components. It does not change feature logic, data flow, persistence, or workflow state transitions.

## Scope

- WaflButton / WaflLinkButton now expose consistent foundation, variant, and density markers.
- WaflInput / WaflTextarea / AppSelect expose field density consistently.
- AppBadge exposes compact tone and density markers.
- WaflSurface family exposes tone/state markers so the catalog and screen audit can distinguish shape from state.
- AppSelect trigger shares the field interaction class used by WaflInput.

## Reason

The prior pass unified many screens visually, but final inspection needs a reliable way to tell whether a visible element is a surface, control, compact, or icon primitive. The data markers make remaining inconsistencies easier to scan without changing business behavior.

## Keep

- Do not change workflow logic.
- Do not change DB/API calls.
- Do not alter save/review/request/complete actions.
- Keep true round exceptions for spinner, dot, avatar, progress, and chart primitives.
