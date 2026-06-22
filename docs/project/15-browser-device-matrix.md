# PeaceByPiece Browser and Device Matrix

## Supported QA Baseline

| Class | Browser | View/orientation | Priority |
| --- | --- | --- | --- |
| Windows PC | Chrome current | 1366px and wider | P0 |
| iPhone | Safari current | portrait | P0 |
| Android phone | Chrome current | portrait | P0 |
| iPad | Safari current | portrait and landscape | P0 |
| Galaxy Tab | Chrome current | portrait and landscape | P0 |
| Windows PC | Edge current | desktop | P1 |
| macOS | Safari current | desktop | P1 |

“Current” is recorded with the actual browser/OS version in release evidence; it is not assumed indefinitely.

## Critical Scenarios

Across P0 targets verify:

- authentication/session recovery;
- workorder list, detail, editing, stage actions;
- material/supplier order flow;
- upload/download and PDF download when implemented;
- drawer, modal, focus, scroll lock, and return position;
- long Korean text and multi-row tables;
- portrait/landscape transition on tablets;
- permission-denied and expired-session states.

## Layout Boundaries

- desktop and wide landscape tablet: three-panel where supported;
- compact landscape tablet: two-panel;
- portrait tablet and mobile: drawer/card/accordion behavior;
- no horizontal page overflow except intentional table scrollers;
- primary actions remain reachable without overlapping fixed UI.

## Evidence Record

Record device model, OS, browser/version, viewport/orientation, deployed commit, scenario, result, screenshot only when useful, and defect link. Emulator results do not replace at least one real iPhone/iPad/Android/Galaxy Tab pass at release checkpoints.
