# 2.0.0-alpha.14 WAFL v2 App-first UI Polish + Work Order CTA Mock

- Current GPT checkpoint: `2.0.0-alpha.14`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.13`.
- Baseline commit: `ba43ded540ae97332827e0eb2696a696d7d1d3f8`.
- This patch keeps the `apps/mobile` mock-only boundary and applies field-feedback polish after alpha.13.
- Image/attachment icons are tightened with dependency-free photo, camera, sketch, attachment, and clearer crown-like representative-image marks.
- The decorative hanger line/hook is removed from the garment preview so the image area reads as production reference, not unexplained ornament.
- Size/color current-value selectors now use stable fixed widths for gender, category, and unit so `cm`/`inch` changes do not shift the row.
- Size/color load/save/add actions now include dependency-free helper icons for folder, save, row add, measure, and swatch add.
- Fabric/accessory row actions use short field language: `발주`, `완료`, `취소`, and `삭제`; the action buttons are visually separated from status badges.
- Material order icons avoid send/mail/airplane metaphors and use document request, undo, check, and delete shapes.
- The production-flow rail keeps one continuous line ending at the shipping step, and the current step receives stronger dot/label/status emphasis.
- A global `작지 발주` document CTA is added to the top summary card as local mock state only.
- Clicking `작지 발주` opens an in-screen confirmation panel with readiness checks and a mock `작지 출력 및 발주 완료` action.
- After the mock completion, the production rail marks `발주` as complete and derives the `자재` step from the current fabric/accessory statuses.
- No real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, inline-edit persistence, schema, migration, or production mutation is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker/sketch
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait image icon and work-order CTA review
- iPad mini portrait selector width and confirmation panel review
- iPad Pro landscape material row action/status distinction review
- Galaxy Tab portrait/landscape production rail current-step review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.13 WAFL v2 App-first Alpha.12 UX Follow-up Correction

- Current GPT checkpoint: `2.0.0-alpha.13`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.12`.
- Baseline commit: `c6fd1d831066d70e44d496a83eb375aeaefba116`.
- This patch keeps the `apps/mobile` mock-only boundary and corrects the alpha.12 UX items that still read too much like visible settings, bottom action rows, or segmented process fragments.
- Image/attachment actions now use dependency-free visual helper icons for photo, camera, sketch, attachment, and representative selection instead of ambiguous text symbols or emoji-like glyphs.
- The carousel keeps the focused image centered, floats the stable `n / total` counter, centers the caption area, and hides memo by default.
- Image titles remain optional: real titles are shown only when present, while fallback labels such as `사진 2` or `스케치 1` stay visually small and non-mandatory.
- Size/color selectors now show only current-value buttons such as `공용`, `상의`, and `cm` on the default screen; option piles are not permanently exposed.
- Size template load/save and size/body-part add actions remain grouped at the same top level without listing every saved template by default.
- Fabric/accessory row actions move onto the unit/price/amount line so repeated rows stay shorter and the user's eye reads amount plus allowed action together.
- `발주요청` stays text-first and no longer depends on a send/mail/airplane-like action symbol.
- Completed material/accessory rows remain read-only and expose no action buttons.
- The six-step production-flow rail now uses one continuous horizontal line with evenly placed dots, labels, and statuses on the same center axis.
- No real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, inline-edit persistence, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker/sketch
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait image carousel/action icon review
- iPad mini portrait current-value selector review
- iPad Pro landscape material row amount/action alignment review
- Galaxy Tab portrait/landscape continuous production rail review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.12 WAFL v2 App-first Alpha.11 UX Follow-up Correction

- Current GPT checkpoint: `2.0.0-alpha.12`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.11`.
- Baseline commit: `670447c3d577c15858d75e1aca101654f52bac61`.
- This patch keeps the `apps/mobile` mock-only boundary and follows up on alpha.11 UX feedback before moving to output/share deepening.
- Image/attachment carousel alignment is tightened: the active image remains centered with stable left/right navigation, centered index pills, and a clear `n / total` indicator.
- Image titles are treated as optional. Empty title mock rows fall back to safe labels such as `사진 2`, `스케치 3`, or `첨부 이미지`.
- Photo, camera, sketch, and attachment actions keep text labels and use dependency-free helper symbols without emoji-style meaning drift.
- Size/color controls change from always-visible chip piles to current-value selectors for gender, product category, and unit.
- Saved size templates are no longer listed on the default screen; only the current configuration is shown, with load/save actions separated from direct size/body-part edit actions.
- Fabric/accessory rows keep status labels in a fixed row position, use row border color only as secondary status support, and move allowed actions to a consistent action row.
- Order request uses a request/check style helper symbol and explicit `발주요청` text, not a send/mail/airplane-like arrow.
- Completed material/accessory rows remain read-only and expose no action buttons.
- The six-step production-flow rail keeps `발주`, `자재`, `재단`, `공정`, `검수`, and `출고`, while dot, step label, and status are aligned on the same center axis.
- No real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, inline-edit persistence, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker/sketch
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait image carousel/index/action review
- iPad mini portrait size selector and table-action review
- iPad Pro landscape material row status/action alignment review
- Galaxy Tab portrait/landscape production-flow rail review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.11 WAFL v2 App-first UX Correction

- Current GPT checkpoint: `2.0.0-alpha.11`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.10`.
- Baseline commit: `00fa7cd5380f8790ca9d1b2a0916b8c043c8b870`.
- This patch keeps the `apps/mobile` mock-only boundary and corrects practical UX issues found after alpha.10.
- Image/attachment now uses a single-image carousel card with left/right movement, current index, representative-image state, separate representative/delete controls, and no visible "tap for detail" instruction.
- Attachment rows show filename, file type, output include/exclude, and upload timestamp in `YYYY.MM.DD HH:mm:ss` mock format.
- The overview removes ambiguous trading/production and short memo rows. It shows participating companies and a stronger next-check work card instead.
- Size/color now starts from gender, product category, unit, and saved template load/save mock controls. The size table removes the generic division column and uses `size / chest / length / shoulder / sleeve`; color rows include small swatches.
- Fabric and accessory status flow is simplified to `입력중`, `발주요청`, and `완료`: editable/request/delete, complete/cancel/delete, and read-only respectively.
- The six-step production rail remains `발주`, `자재`, `재단`, `공정`, `검수`, `출고`, with more centered spacing and clearer current-step emphasis.
- No nested button pattern is intentionally added. Carousel image navigation, thumbnail selection, and action controls are sibling press targets.
- No real DB, API, R2, PDF Worker, upload, camera, file picker, sketch, share, print, order, delivery, inline-edit persistence, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker/sketch
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait carousel and material status review
- iPad mini portrait size/color and attachment timestamp review
- iPad Pro landscape centered production-flow rail review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.10 WAFL v2 App-first Icon Action Interpretability Polish

- Current GPT checkpoint: `2.0.0-alpha.10`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.9`.
- Baseline commit: `57889601e9de78bf3e5fecf13bc3feee23380f0f`.
- This patch keeps the `apps/mobile` mock-only boundary and polishes action/icon interpretability after alpha.9 field feedback.
- Image/attachment top actions now read as photo, camera, sketch, and attachment entry points with compact icon captions instead of ambiguous standalone symbols.
- Image thumbnails now carry the detail-view affordance on the thumbnail itself, while the separate tile action cluster is reduced to representative-image and delete controls.
- Fabric and accessory row action clusters use a consistent grammar for current-state action, lock/edit state, view, delete, and optional photo selection.
- Status-based primary actions still expose only one current action: order request, order completion, or information check.
- Size-add and color-add actions move beside their relevant size-template and color-list areas as compact `+` chips instead of detached large buttons.
- The six-step production-flow rail expands across the available width more evenly, while detailed process rows remain grouped below.
- No nested button pattern is intentionally added. Thumbnail detail press areas and action buttons remain sibling controls.
- No real DB, API, R2, PDF Worker, upload, camera, file picker, share, push notification, auth, order, delivery, inline-edit persistence, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait icon-caption density review
- iPad mini portrait action cluster review
- iPad Pro landscape production-flow rail review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.9 WAFL v2 App-first Button and Action Cluster UX Polish

- Current GPT checkpoint: `2.0.0-alpha.9`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.8`.
- Baseline commit: `7fdc3a4c05ad8879512a5903a6aa780bdfcbf9aa`.
- This patch polishes the `apps/mobile` mock button/action grammar instead of adding real feature integration.
- Fabric and accessory rows remove repeated bottom text primary buttons. The current state action moves into the row-top action cluster beside the status badge.
- Fabric and accessory add entry points move to the section header as compact `+` icon buttons.
- Row-level editing is represented as inline-edit affordance text, while locked/completed rows show read-only/locked direction.
- Image/attachment restores a compact top action row for image upload, camera, sketch, and attachment mock entry points without connecting real picker/camera/sketch/upload behavior.
- Production flow rail spacing and process structure are clarified: the six baseline steps remain the top rail, and detailed process items are grouped inside the process step.
- Flow addition is treated as an advanced/exception mock direction; the default visible `+` action focuses on process addition.
- Output/share keeps the document workbench and uses a more consistent compact icon action row for view/share/print/save/save-delivery placeholders.
- No nested button pattern is intentionally added. Button-like actions stay in separated action clusters rather than inside another button tile.
- No real DB, API, R2, PDF Worker, upload, camera, file picker, share, push notification, auth, order, delivery, inline-edit persistence, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real inline edit save
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait one-column action-density review
- iPad mini portrait action cluster review
- iPad Pro landscape production-flow rail review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.8 WAFL v2 App-first Real-Use UX Alignment Correction

- Current GPT checkpoint: `2.0.0-alpha.8`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.7`.
- Baseline commit: `fe9c9cef17ab1f84522ef1bbdd3370432555cf15`.
- This patch corrects the `apps/mobile` mock toward real apparel-production usage instead of adding real feature integration.
- Customer-facing mock screens no longer show internal production-card IDs such as `WAFL-2408-119` in the list, header, or document preview.
- Image tiles now behave like thumbnail-first visual references: no per-image title/description input burden on the default surface, with representative-image crown/selection and detail/delete affordances only.
- The first-image auto-representative rule, representative fallback direction, and no-real-camera/file-picker/upload boundary are shown as mock copy only.
- Attachment mock rows now follow the existing WAFL/R2 allowed file shape by using image/PDF examples only; `.txt` and `.xlsx` examples were removed from the mobile mock.
- Factory delivery memo is represented as a separate editable-looking field, not as an attached text file.
- Size/color now shows only the selected unit (`cm` or `inch`) in the measurement table; the same cell no longer mixes both units.
- Size/color includes visible size-add and color-add mock actions plus product-type template suggestions for top, bottom, one-piece, outer/jumper, and sweatshirt/overall patterns.
- Fabric and accessory rows no longer expose `E`/`L` letters. Row actions use compact icon-like controls for lock/read, view, edit, delete, and optional photo selection while preserving one current primary action.
- Fabric/accessory item photo is presented as optional only; default item entry is not blocked by a missing photo.
- Production flow now uses the baseline six steps: order, material, cutting, process, inspection, and shipping. Statuses are simplified to `준비`, `작업중`, and `완료`.
- Cutting is displayed as a removable default step, and process addition is separated from flow-step addition.
- Output/share keeps the alpha.7 document workbench but reduces repeated row action clusters and focuses on document setting, included items, and delivery-request summaries.
- No real DB, API, R2, PDF Worker, upload, camera, file picker, share, push notification, auth, order, delivery, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real push notification
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait one-column production-card flow review
- iPad mini portrait review
- iPad Pro landscape centered workbench review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.7 WAFL v2 App-first Signature UI Correction

- Current GPT checkpoint: `2.0.0-alpha.7`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.6`.
- Baseline commit: `396b90dec09b1746d519d7dbf96e434ff8b07894`.
- This patch strengthens the `apps/mobile` mock as a WAFL signature production-card UI instead of adding real feature integration.
- The production-flow tab now includes a compact progress rail from `발주 요청` through `출고 준비`, with WAFL-specific handoff states such as `전달 준비`, `공정 메모 필요`, and `납기 확인 필요`.
- The production-flow detail remains a mock factory/process preparation surface. It does not become a real-time production tracker, drag system, or long-press implementation.
- The output/share tab now includes a document preview/workbench mock: document list, selected production-document sheet preview, included information chips, delivery-request summary, and compact icon actions.
- Icon-style actions are kept dependency-free with `View`/`Text`/`Pressable` grammar because no new icon dependency is added.
- The image tile structure no longer nests an action `Pressable` inside an outer image-tile `Pressable`; the tile is a container and the delete action is the only button-like control in that tile.
- Existing alpha.5 visual fidelity and alpha.6 production-card wording are preserved.
- Image/attachment mock deepening, representative-image UX rules, and camera/photo/attachment placeholder details are deferred to `2.0.0-alpha.8`.
- No real DB, API, R2, PDF Worker, upload, camera, file picker, share, auth, order, delivery, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait one-column production-card flow review
- iPad mini portrait review
- iPad Pro landscape centered workbench review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.6 WAFL v2 App-first /ui Alignment Correction

- Current GPT checkpoint: `2.0.0-alpha.6`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.5`.
- Baseline commit: `1ee39d6f54a49d49468c21eae55b267bd905c7b9`.
- This patch aligns the `apps/mobile` mock with the settled `/ui` production-card flow instead of adding real features.
- The mobile mock now emphasizes the production-card input, order, factory-delivery, document, and delivery-request flow from the `/ui` baseline.
- A compact tab-aware `다음 확인` panel replaces a generic assistant feeling and shows the next business check for overview, image/attachment, size/color, fabric, accessory, production flow, and output/share.
- The production-flow section is reframed away from generic production-progress tracking and toward `제작 공장 + 추가 공정 + 공장 전달 준비`.
- Production-flow wording now uses WAFL-specific checks such as `공장 전달 준비`, `공정 메모 필요`, and `납기 확인 필요`, rather than generic `진행 예정`, `일정 확인`, or `대기`.
- Output/share now shows document type and included information first, then compact view/share/print/save mock actions.
- Delivery-request rows show one origin, one destination, multiple items, contact confirmation, and delivery memo.
- Size/color user-facing wording is kept as `사이즈·색상` across the mobile mock and updated App-first docs.
- Image/attachment deepening, representative-image UX rules, and camera/photo/attachment placeholder details are deferred to `2.0.0-alpha.8`.
- No real DB, API, R2, PDF Worker, upload, camera, file picker, share, auth, order, delivery, drag, or long-press behavior is connected.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- real drag/long-press mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait one-column production-card flow review
- iPad mini portrait review
- iPad Pro landscape centered workbench review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.5 WAFL v2 App-first Visual Fidelity Correction

- Current GPT checkpoint: `2.0.0-alpha.5`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.4`.
- Baseline commit: `8666afbeb67d71826463f27e2f388db256532e6d`.
- This patch corrects the `apps/mobile` mock visual fidelity after App Design Theme v1 adoption.
- Scope is visual foundation only: no new feature integration and no real DB, API, R2, PDF Worker, upload, camera, file picker, share, auth, order, or delivery mutation.
- The runtime app no longer shows a design-explanation strip. Theme language remains in docs, while the app surface behaves like a production tool.
- The mock reduces repeated boxed-card feeling with softer list rows, line-based metrics, compact tab treatment, and practical workbench spacing.
- Representative image, list thumbnail, output preview, and material/accessory rows use React Native `View`/`Text` based garment and swatch placeholders instead of plain text boxes or external assets.
- Mobile remains portrait-first for normal production-card screens. Tablet portrait/landscape keeps a centered workbench with restrained width and no heavy desktop admin three-panel layout.
- Status-based material/accessory rows still expose only one current primary action.
- Image/attachment deepening, representative-image UX details, and camera/photo/attachment placeholder rules are deferred beyond `2.0.0-alpha.6`.
- Font files, external images, new dependencies, root package metadata changes, root lockfile changes, and production behavior are still not added.
- Expo generated local outputs such as `.expo` and `apps/mobile/node_modules` are not source deliverables and must not be committed or included in source ZIP handoff.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- real order/delivery mutation
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait one-column visual fidelity review
- iPad mini portrait review
- iPad Pro landscape centered workbench review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.4 WAFL v2 App Design Theme v1 and Mobile Mock Redesign

- Current GPT checkpoint: `2.0.0-alpha.4`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.3`.
- Baseline commit: `2c7cadf3ae9a4ec99a505ccfaf71482e1a457f8d`.
- This patch adds the first App-first visual foundation document: `docs/project/app-v2/11-app-design-theme-v1.md`.
- Theme direction: `동대문 제작 워크룸 / Dongdaemun Atelier Ops`.
- `apps/mobile` is redesigned as a mock-only professional production workroom surface with warm paper/off-white base, deep navy primary, brick orange/thread amber production accents, and deep olive completion states.
- The mobile mock keeps normal production-card screens portrait-first and uses compact, information-dense cards rather than large portfolio-style samples.
- Tablet mock behavior is represented as a centered/wide workbench with a production-card list and selected card detail, without turning into a heavy desktop admin three-panel layout.
- Status-based row actions now expose only one current primary action: input/check guidance, `발주 요청`, `발주 완료`, or no action for completed rows.
- Font files, external images, new dependencies, real camera/file/upload/share/PDF/API/DB/R2/Worker connections, and root package metadata changes are still not added.
- Expo generated local outputs such as `.expo` and `apps/mobile/node_modules` are not source deliverables and must not be committed or included in source ZIP handoff.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait one-column review
- iPad mini portrait review
- iPad Pro landscape centered-width review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.3 WAFL v2 App-first Production Card Mock UX

- Current GPT checkpoint: `2.0.0-alpha.3`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.2`.
- Baseline commit: `3dad6e86956f59e8699fd350a319cdb8b483cc57`.
- This patch improves the Expo skeleton into a visually inspectable mock production-card app screen.
- `apps/mobile` now shows a richer mock-only production card with top production summary, image/attachment, size/color, fabric, accessory, production flow, output/share, and delivery-request sections.
- The mobile app remains React Native primitive based and does not add dependencies.
- The app display version is aligned to `2.0.0-alpha.3`.
- Expo generated local outputs such as `.expo` and `apps/mobile/node_modules` are not source deliverables and must not be committed or included in source ZIP handoff.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

Manual device QA remains required before product verification:

```text
- iPhone portrait one-column review
- iPad mini portrait review
- iPad Pro landscape centered-width review
- Galaxy Tab portrait/landscape rotation review
- Expo Web preview inspection after local server run
```

---

# 2.0.0-alpha.2 WAFL v2 App-first Expo Skeleton and Public Web Boundary

- Current GPT checkpoint: `2.0.0-alpha.2`.
- Baseline source before this patch: repository `APP_VERSION: 2.0.0-alpha.1`.
- Baseline commit: `e0332307604d99e6a63b68f14d3aef71f44a5c77`.
- This patch creates the first App-first Expo React Native skeleton under `apps/mobile`.
- Expo SDK choice: SDK 55, because it supports Node `20.19.x` and the owner environment is Node `20.20.2`.
- The mobile skeleton is mock-only and shows 제작 카드 navigation for 개요, 이미지·첨부, 사이즈·색상, 원단, 부자재, 제작 플로우, and 출력·공유.
- `www.wafl.co.kr` is recorded as the public WAFL app landing site for app introduction, download area, pricing, examples, Instagram CTA, inquiry, trial request, and waitlist.
- `/ui`, `/roadmap`, and `/functions` are now localhost-only development check routes.
- `/system` and `/workspace` are documented as long-term removal targets, but no route is deleted in this patch.
- New version line: `2.0.0-alpha.2`.

Explicitly not changed:

```text
- DB migration
- API route behavior
- Neon schema
- Cloudflare R2 Worker
- PDF Worker
- real file upload/delete
- real camera/photo/file picker
- real share-link generation
- real PDF generation
- real auth callback
- production data
- root package.json
- root package-lock.json
- pnpm lock/workspace files
- /system or /workspace deletion
```

---

# 2.0.0-alpha.1 WAFL v2 App-first Transition Documentation

- Current GPT checkpoint: `2.0.0-alpha.1`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.27`.
- Baseline commit: `a35a4e0f1ccb714f5146cd5a29aeb973c025fdc7`.
- `0.30.0-alpha.27` is the final committed/pushed `/ui` production-card design baseline before the App-first transition.
- This patch starts the WAFL v2 App-first line.
- Customer-facing product direction moves to Expo React Native mobile/tablet app first.
- Next.js remains for system admin, customer admin advanced settings, operations, API, file/PDF/R2/Worker integration, `/ui` design showroom, internal docs, and test console.
- This patch is documentation and version alignment only.
- No Expo project is created in this patch.
- New version line: `2.0.0-alpha.1`.

Explicitly not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real app implementation
- Expo skeleton
- package dependency
- lockfile
- production behavior
```

---

# 0.30.0-alpha.27 WAFL v2 /ui Image/Attachment Compression and Output/Share Delivery Correction

- Current GPT checkpoint: `0.30.0-alpha.27`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.26`.
- This patch continues from the uncommitted alpha.13 through alpha.26 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom correction only. The goal is to reduce visible image/attachment noise, move attachment inclusion selection to output/share, and compact delivery-request rows without wiring real services.
- New version line: `0.30.0-alpha.27`.

## 0.30.0-alpha.27 checkpoint

The `/ui` internal WAFL v2 showroom now treats the image tab as a thumbnail-first representative-image picker and the output/share tab as the place where document attachments are selected.

The correction demonstrates:

```text
- User-facing "이미지 자산 목록" wording is changed to "이미지 목록".
- Image items are reduced to thumbnail placeholder, crown representative selector, and delete icon.
- File name, long note, source badge, visible preview eye icon, and "대표" text are removed from the default image list.
- Image preview opens by clicking the thumbnail/item, with file name and type shown inside the preview mock.
- Crown representative selection, header reflection, representative deletion fallback, and no-image state from alpha.26 remain intact.
- Attachment rows remove preview eye icon, production-document checkbox, and included/not-included badges.
- Attachment inclusion is selected from output/share through an included-attachment area and attachment picker mock.
- Selected attachments can be removed from the output/share chip list.
- Output/share shows the representative image as a small thumbnail instead of a filename string.
- 작업지시서 and 공장 전달 작업지시서 rows remove the visible preview eye icon and use row selection for preview mock.
- Delivery-request rows remove the repeated 배송요청 badge, align row height, compress item lists to "외 n개", and show long memo only in detail mock.
- Delivery-request share/print/save actions are icon-only, with mobile and tablet favoring compact/bottom-sheet style mocks.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real file preview API
- real image drawing, edit, or camera capture tooling
- real share-link generation
- real PDF generation
- real order mutation
- real delivery-request API
- real process/unit/size management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` image density, attachment-selection location, document row behavior, and delivery-request presentation, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.26 WAFL v2 /ui Image Asset Structure and Production Summary Correction

- Current GPT checkpoint: `0.30.0-alpha.26`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.25`.
- This patch continues from the uncommitted alpha.13 through alpha.25 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom correction only. The goal is to show multi-image assets, representative-image selection behavior, attachment inclusion, compact card actions, production-summary cost structure, and inch fraction entry without wiring real services.
- New version line: `0.30.0-alpha.26`.

## 0.30.0-alpha.26 checkpoint

The `/ui` internal WAFL v2 showroom now treats images and attachments as managed Sheet assets instead of fixed upload slots.

The correction demonstrates:

```text
- Image/photo/sketch/reference files appear as a list of image assets with file-like names, source type, thumbnail placeholders, preview, representative selector, and delete action.
- The first added image becomes representative automatically when no image exists.
- Deleting a non-representative image keeps the selected representative image.
- Deleting the representative image selects the first remaining image, and deleting the last image leaves the Sheet with no representative image.
- The selected representative image is reflected immediately in the Sheet header and output/share mock; the header also supports the no-image state.
- Attachments are separate from image assets and include a mock "제작 문서에 포함" toggle that is reflected in output/share.
- Mobile image/photo/sketch/attachment add actions are icon-first, and sketch uses the palette/brush visual language.
- Fabric/accessory row order-request and order-complete actions sit in the top-right row action cluster instead of bottom-heavy buttons.
- The Sheet header no longer repeats unit/total cost; overview "제작 요약" carries 한벌 단가, 총 예상, 원단 총액, 부자재 총액, and 공정 총액.
- Overview no longer repeats status, and 로스/여유 비용은 별도 항목이 아니라 발주수량 x 단가에 포함되는 기준으로 설명된다.
- Size/color inch mode includes a mock fraction helper with integer input plus none, 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, and 7/8 choices.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real image drawing, edit, or camera capture tooling
- real share-link generation
- real PDF generation
- real order mutation
- real delivery-request API
- real process/unit/size management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` asset management, representative-image behavior, compact actions, production-summary wording, and size helper behavior, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.25 WAFL v2 /ui Image, Size/Color, Output/Share, and Confirmation Flow Correction

- Current GPT checkpoint: `0.30.0-alpha.25`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.24`.
- This patch continues from the uncommitted alpha.13 through alpha.24 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom correction only. The goal is to show image/attachment management, size/color structure, output/share inclusion, representative-image selection, and confirmation-first material actions without wiring real services.
- New version line: `0.30.0-alpha.25`.

## 0.30.0-alpha.25 checkpoint

The `/ui` internal WAFL v2 showroom now shows the production-card flow as image-first, size/color-aware, and confirmation-first.

The correction demonstrates:

```text
- Image/attachment is promoted to a first-class section tab with representative image selection.
- The selected representative image is reflected in the production summary and output/share mock.
- Size/color is a separate section with size-system selection, size chips, measurement table, unit toggle, and color quantity rows.
- Output/share states that the generated document includes representative image, size/color, material, process, and memo data.
- Material delete, order request, order-missing, and order-complete actions open confirmation mock panels instead of implying immediate execution.
- Process rows are thinner inline-edit rows instead of heavy nested cards.
- Mobile keeps the same section flow and shows confirmation as a bottom-sheet mock with safe-area padding.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real image drawing or edit tooling
- real share-link generation
- real PDF generation
- real order mutation
- real delivery-request API
- real process/unit/size management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` section structure, representative-image flow, confirmation panels, size/color entry, and output/share wording, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.24 WAFL v2 /ui Overview Summary and Card Action Grammar Correction

- Current GPT checkpoint: `0.30.0-alpha.24`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.23`.
- This patch continues from the uncommitted alpha.13 through alpha.23 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom correction only. The goal is to simplify the overview summary, move work-needed counts to fabric/accessory tab badges, and unify material/process card action placement.
- New version line: `0.30.0-alpha.24`.

## 0.30.0-alpha.24 checkpoint

The `/ui` internal WAFL v2 showroom now presents the production-card hub with fewer repeated statuses and clearer row-level actions.

The correction demonstrates:

```text
- Overview keeps only quantity, due date, estimated unit cost, estimated total, and one plain status line.
- Overview shortcut buttons for fabric input/order, accessory input/order, and output/share are removed.
- Fabric/accessory work-needed counts move to small warning tab badges instead of repeated summary badges.
- Fabric/accessory section summaries are text-centered lines, not rows of competing badges.
- Material rows show status, lock/unlock icon, and delete icon in the top-right action cluster.
- Material primary actions sit at the lower/right edge with send/check icons for order request and order completion.
- Locked material rows no longer show visible "수정 잠김" text; the state is communicated with a lock icon and quieter row treatment.
- Process content keeps the `제작 플로우` title but uses the same card grammar for 제작 공장 and additional process cards.
- Process cards show process, factory/partner, quantity, unit, unit price, amount, due date, drag-handle mock, and delete icon.
- Process address/contact/change/copy/up-down/detail actions are removed from the default screen.
- Assistant is reduced to current blocker, next recommendation, and output/share availability.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- real delivery-request API
- real process/unit management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` summary density, tab badges, material actions, and process card grammar, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.23 WAFL v2 /ui Fixed Panel Scroll and Action Reduction Correction

- Current GPT checkpoint: `0.30.0-alpha.23`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.22`.
- This patch continues from the uncommitted alpha.13 through alpha.22 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom correction only. The goal is to make PC/tablet frames read as fixed-height work panels with internal scroll, reduce unnecessary global actions, and simplify the production flow/output sections.
- New version line: `0.30.0-alpha.23`.

## 0.30.0-alpha.23 checkpoint

The `/ui` internal WAFL v2 showroom now presents the production-card prototype as a fixed work hub rather than a long page.

The correction demonstrates:

```text
- Desktop uses fixed-height Product Explorer / central production card / Assistant panels, with internal scroll per panel.
- Tablet landscape uses fixed-height product list, work area, and Assistant regions; tablet portrait uses a drawer-style product selector mock instead of a permanent long selector above the work area.
- Mobile removes global fabric/accessory add buttons and shows add actions only inside the active fabric or accessory section.
- Fabric/accessory row actions are limited to order request, order completion, and delete where appropriate.
- Requested/ordered/received/done material rows read as locked/read-only with muted treatment and a lock indicator.
- Top production summary avoids repeating product type, quantity, due date, and production status.
- Metrics are compacted to a few badges plus text instead of awkward badge rows.
- Factory/process is titled 제작 플로우 and shows representative factory details plus additional process rows with reorder/copy/delete icon actions.
- Output/share removes duplicate summary/contact blocks and keeps document and delivery-request row-level actions.
- Assistant remains focused on current blockers, recommendation, missing/unordered items, and output/share availability.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- real delivery-request API
- real process/unit management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` responsive layout, panel scrolling, action placement, and output/process wording, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.22 WAFL v2 /ui Assistive Feature Exposure and Factory/Process Structure Correction

- Current GPT checkpoint: `0.30.0-alpha.22`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.21`.
- This patch continues from the uncommitted alpha.13 through alpha.21 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom simplification only. The goal is to reduce assistive-function exposure on default fabric/accessory/output screens and clarify representative factory plus additional-process structure.
- New version line: `0.30.0-alpha.22`.

## 0.30.0-alpha.22 checkpoint

The `/ui` internal WAFL v2 showroom now keeps the default production-card screen more focused.

The correction demonstrates:

```text
- Fabric and accessory default sections show item rows, quantity math, order status, add/order/view-all actions, and next actions first.
- Input source, supplier import, stock import, previous-record copy, unit reference, and similar assistive functions move into drawer/editor mock surfaces.
- Accessory category chip/summary space is removed from the default view; category remains as row-level supporting information.
- Output/share removes top-level common view/share/print buttons and keeps actions on each document or delivery-request row.
- Quick delivery memo is represented through delivery-request creation and request rows, not as a standalone document row.
- Factory/process defaults to representative production factory information plus additional process rows.
- Sewing is treated as the normal representative production-factory work, while special sewing can still appear as an additional process exception.
- Assistant repeats less section detail and focuses on current blockers, next recommended action, missing/unordered warnings, and output/share availability.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- real delivery-request API
- real process/unit management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` density, action placement, output/share behavior, and factory/process structure, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.21 WAFL v2 /ui User Wording, Loss/Allowance Ordering, Output/Share, and Quick Delivery Flow Correction

- Current GPT checkpoint: `0.30.0-alpha.21`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.20`.
- This patch continues from the uncommitted alpha.13 through alpha.20 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom wording and mock-flow correction only. The goal is to remove awkward Sheet/PDF-heavy user wording, clarify loss/allowance ordering, and show document output plus quick delivery request flow.
- New version line: `0.30.0-alpha.21`.

## 0.30.0-alpha.21 checkpoint

The `/ui` internal WAFL v2 showroom now uses more natural user-facing Korean wording and clearer ordering/delivery flows.

The correction demonstrates:

```text
- User-facing showroom copy avoids Sheet/시트 wording and uses 제작 카드, 제작 요약, 출력·공유, 작업지시서, 공장 전달 작업지시서, and 퀵 전달 메모.
- Top product summary removes current-PDF style metric wording and focuses on product type, quantity, due date, unit cost, total amount, and production state.
- Fabric/accessory rows show required quantity, loss/allowance quantity, stock use, order quantity, total required quantity, leftover quantity, and leftover handling.
- Leftover/over-order handling is represented as no leftover, factory allowance, loss included, stock conversion, or all used in current production.
- Unit and process selection are shown as unified chip lists with small company-standard labels instead of large system/company splits.
- Output/share tab uses document names without repeating PDF in each title.
- Document rows expose short view/share/print actions with icon-centered controls.
- Quick delivery request mock groups selected items by one origin, one destination, and a delivery memo, showing when multiple requests are needed.
- Long factory, supplier, address, and contact values use wrapping definition-list rows rather than fixed-height boxes.
- Section tabs, device switcher, document actions, and mobile tabs use centered/even icon-first alignment.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- real process/unit management API
- real delivery request API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` terminology, ordering math presentation, output/share wording, and quick delivery flow, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.20 WAFL v2 /ui Card Reduction and PDF-Friendly Sheet Layout Correction

- Current GPT checkpoint: `0.30.0-alpha.20`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.19`.
- This patch continues from the uncommitted alpha.13 through alpha.19 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom layout correction only. The goal is to reduce excessive nested card/box visuals and make the central WAFL Sheet read more like a paper/PDF-friendly production document.
- New version line: `0.30.0-alpha.20`.

## 0.30.0-alpha.20 checkpoint

The `/ui` internal WAFL v2 showroom now uses fewer small cards and presents Sheet data as larger sections with document-like rows.

The correction demonstrates:

```text
- Sheet summary header uses a product thumbnail plus one compact document summary line instead of metric boxes.
- Input source, unit reference, and process reference examples are shown as toolbar/chip rows inside the Sheet section.
- Overview uses definition-list style rows for cost, missing data, order readiness, factory delivery, and current PDF status.
- Fabric/accessory preview items are table-like rows inside one section card, not many separate item cards.
- Accessory categories are shown as compact chips while the item list remains row-based.
- Process delivery details and process steps use definition rows and reorderable row lists instead of nested cards.
- PDF/share uses a current PDF document block, included-information summary, PDF-purpose rows, and delivery definition rows.
- Assistant summary is reduced to a next-action panel plus compact Sheet context rows.
- Mobile header replaces small summary boxes with one compact total/current-PDF metadata line.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- real process/unit management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` layout density and PDF-friendly Sheet presentation, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.19 WAFL v2 /ui Material Input, Status, Unit, and Process Flow Correction

- Current GPT checkpoint: `0.30.0-alpha.19`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.18`.
- This patch continues from the uncommitted alpha.13 through alpha.18 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom material/accessory input clarity, simplified order status, mobile editor mock, unit/process reference use, and small-frame typography correction only.
- New version line: `0.30.0-alpha.19`.

## 0.30.0-alpha.19 checkpoint

The `/ui` internal WAFL v2 showroom now makes material/accessory entry easier to understand, especially on mobile.

The correction demonstrates:

```text
- Fabric/accessory user-facing status is simplified to input, orderable, order requested, or order completed meanings.
- Received/inbound/inventory reflection language is hidden from the main Sheet input screen.
- Abstract issue badges are replaced by concrete warnings such as missing unit price, missing supplier, missing color/option, or quantity confirmation.
- Fabric/accessory item cards show item name, simplified state, supplier, explicit color/option, required quantity, stock use, order quantity, unit, unit price, amount, and one primary action.
- Mobile phone frame includes + fabric and + accessory buttons that open a local editor panel inside the 390px frame.
- Mobile editor mock shows fabric/accessory name, color/option, supplier import, required quantity, unit, unit price, stock use, order quantity, and memo fields.
- Input source wording is changed to new input, supplier import, stock import, and previous record copy.
- Unit selection shows system/base units, company units, and unit-add request.
- Process tab shows base process, company process, process-add request, temporary process input, and a sortable/editable process list.
- Process items show factory/supplier, quantity, unit, unit price, amount, due date, memo/warning, and move/copy/delete actions.
- Small-frame typography uses compact text rows and nowrap values for money, quantity, and units.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- real process/unit management API
- workspace/system production behavior
- production guard
- package.json, package-lock.json, pnpm-lock.yaml, or pnpm-workspace.yaml
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` input behavior, mobile editor flow, status language, and responsive typography, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.18 WAFL v2 /ui Sheet Input-Order-PDF Flow Correction

- Current GPT checkpoint: `0.30.0-alpha.18`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.17`.
- This patch continues from the uncommitted alpha.13 through alpha.17 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom Sheet-centered input, order, amount summary, and PDF delivery flow correction only.
- New version line: `0.30.0-alpha.18`.

## 0.30.0-alpha.18 checkpoint

The `/ui` internal WAFL v2 showroom now frames one WAFL Sheet as a production card that connects material/accessory input, amount review, order request readiness, and current PDF delivery.

The correction demonstrates:

```text
- Overview tab changed into a manager summary dashboard.
- Manager summary shows Sheet status, estimated unit cost, fabric/accessory/process amounts, total estimate, missing unit prices, unordered items, factory delivery readiness, and current PDF status.
- Fabric tab uses compact item cards with input source, required quantity, stock use, order quantity, unit, unit price, amount, status, and next action.
- Accessory tab keeps category grouping while showing the same input, amount, status, and order action flow as fabric.
- Input source examples are direct input, supplier selection, stock use, and previous Sheet copy.
- Mobile uses compact item cards instead of table-like previews.
- Product selector stays one-column in compact contexts to avoid vertical text clipping.
- PDF/share tab is reorganized around current PDF, PDF view/share/download actions, included information, and delivery data cards.
- User-facing PDF copy avoids snapshot/STEP/developer-preview wording and maps Sheet status to incomplete, order, making, or completed PDF meaning.
- Factory delivery PDF and quick delivery PDF concepts are shown as PDF purposes without connecting real generation or sharing.
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- workspace/system production behavior
- production guard
- package.json or lock files
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` flow, copy, and responsive content behavior, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.17 WAFL v2 /ui Device-Size Prototype Correction

- Current GPT checkpoint: `0.30.0-alpha.17`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.16`.
- This patch continues from the uncommitted alpha.13/alpha.14/alpha.15/alpha.16 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom device-size and copy-density correction only.
- New version line: `0.30.0-alpha.17`.

## 0.30.0-alpha.17 checkpoint

The `/ui` internal WAFL v2 showroom now uses device-width prototype frames instead of relying on browser zoom or compressed panels.

The correction demonstrates:

```text
- Device switcher split into Desktop, Tablet 세로, Tablet 가로, and Mobile
- Tablet 세로 frame near 768px and Tablet 가로 frame near 1024px
- Mobile phone frame near 390px without transform-scale shrinking
- Mobile product search/selection entry that changes the selected Sheet and actions
- Korean-first visible status labels without English code parentheses in the main prototype
- Fabric/accessory/process quantity and due-date display corrected to Korean business notation and YY/MM/DD dates
- History tab, history summary count, and history-centered Assistant copy removed from the main showroom
- Help/info boxes reduced so the prototype reads more like a working WAFL Sheet screen
- Badge/status pills constrained to avoid mobile overflow and horizontal clipping
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- workspace/system production behavior
- package.json or lock files
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` device presentation, copy density, and responsive behavior, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.16 WAFL v2 /ui Interactive Mock Prototype Correction

- Current GPT checkpoint: `0.30.0-alpha.16`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.15`.
- This patch continues from the uncommitted alpha.13/alpha.14/alpha.15 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom interactive mock correction only.
- New version line: `0.30.0-alpha.16`.

## 0.30.0-alpha.16 checkpoint

The `/ui` internal WAFL v2 showroom now behaves as a small interactive prototype instead of a mostly static explanation screen.

The correction demonstrates:

```text
- Device mode switcher for Desktop, Tablet, and Mobile prototype frames
- Four mock Product/Style records with separate thumbnail, Sheet status, fabric, accessory, process, PDF/share, history, and Assistant data
- Product Explorer local-state selection that changes the selected Sheet preview
- Section Tabs local-state selection for overview, fabric, accessory, factory/process, PDF/share, and history
- Desktop 3-column prototype with Product Explorer, WAFL Sheet hub, Assistant, and local drawer preview
- Tablet prototype with compact product selector, Sheet summary, tabs, selected-section preview, collapsed/expanded Assistant, and detail panel
- Mobile phone-frame prototype with product selector, sticky section nav, current section accordion, and local bottom sheet mock
- Assistant next-action copy that changes by selected product and selected section
- Fabric/accessory data volume preserved while default views show preview rows and detail entry points
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- workspace/system production behavior
- package.json or lock files
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` behavior, device presentation, and local interactions, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.15 WAFL v2 /ui Sheet Navigation Showroom Correction

- Current GPT checkpoint: `0.30.0-alpha.15`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.14`.
- This patch continues from the uncommitted alpha.13/alpha.14 `/ui` showroom work and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom navigation/responsive correction only.
- New version line: `0.30.0-alpha.15`.

## 0.30.0-alpha.15 checkpoint

The `/ui` internal WAFL v2 showroom now corrects the Sheet from a long vertical document into a navigation-based work hub.

The correction demonstrates:

```text
- WAFL Sheet Summary Header with product name, Sheet status, thumbnail, item counts, process count, PDF/share state, and history count
- Section Tabs / segmented navigation for overview, fabric, accessory, factory/process, PDF/share, and history
- Selected-section preview instead of always-expanded fabric/accessory/process/PDF sections
- Fabric tab with summary metrics, 3-4 row preview, and full-list drawer entry
- Accessory tab with category group summary, 4-5 item preview, and full-list drawer entry
- Static desktop detail drawer mock for full fabric/accessory editing
- Assistant next action text that changes by selected tab
- Tablet frame with compact product selector, Sheet summary, section tabs, selected-section preview, and collapsed Assistant
- Mobile phone-frame with sticky section nav, current accordion, and bottom sheet mock
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- real order mutation
- workspace/system production behavior
- package.json or lock files
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` layout and responsive explanation, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.14 WAFL v2 /ui Showroom Section/Responsive Correction

- Current GPT checkpoint: `0.30.0-alpha.14`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.13`.
- This patch continues from the uncommitted alpha.13 `/ui` showroom prototype and keeps that work intact.
- Implementation scope: `/ui` internal v2 showroom correction only.
- New version line: `0.30.0-alpha.14`.

## 0.30.0-alpha.14 checkpoint

The `/ui` internal WAFL v2 showroom now explains that real Sheet work is not handled by one large fabric/accessory card per item. Fabric and accessory are presented as section/list cards that summarize many items and lead into full list/edit/order flows.

The correction demonstrates:

```text
- Fabric section card with 6 mock fabric rows
- Fabric summary metrics: total count, total amount, unordered count, issue count
- Fabric actions: view all, add fabric, request order
- Accessory section card with 12 mock accessory rows
- Accessory category grouping for buttons, zipper, label, cord, package, sewing parts, and other
- Accessory actions: view all, add accessory, request accessory order
- Factory/process section as multi-step process timeline/list
- PDF/share as whole-Sheet snapshot lifecycle
- Desktop / Tablet / Mobile structure preview
- Mobile one-column section accordion direction
```

Explicitly still not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- workspace/system production behavior
- package.json or lock files
```

This version remains mock-only and visual/product-direction oriented. Because it changes visible `/ui` layout and responsive explanation, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.13 WAFL v2 /ui Showroom Prototype Baseline

- Current GPT checkpoint: `0.30.0-alpha.13`.
- Baseline source before this patch: repository `APP_VERSION: 0.30.0-alpha.12`.
- This patch is the first narrow WAFL v2 code implementation entry.
- Implementation scope: `/ui` internal v2 showroom prototype only.
- New version line: `0.30.0-alpha.13`.

## 0.30.0-alpha.13 checkpoint

The `/ui` internal catalog now includes a mock-only WAFL v2 showroom prototype above the existing component catalog.

The showroom demonstrates:

```text
- Product Explorer / WAFL Sheet / Assistant layout meaning
- Product/Style and Sheet header
- image/sketch as first-class Sheet data
- base info, fabric, accessory, factory/process, PDF/share Sheet Cards
- Korean-first Sheet/Card status labels with English code hints
- mock action-code examples without role-name branching
- Assistant next action panel
- form field samples with mobile-safe 16px input/select/textarea text
- PDF-like Sheet preview
- mobile one-column card flow with safe-area-aware action area
```

Explicitly not changed:

```text
- DB migration
- API route
- Neon schema
- R2 Worker
- PDF Worker
- real file upload/delete
- real share-link generation
- workspace/system production behavior
- package.json or lock files
```

This version remains a visual/product-direction prototype. Because it changes visible UI and responsive layout, owner browser review is still required before calling the UI product-verified.

---

# 0.30.0-alpha.12 WAFL v2 Operational Policy Absorption Baseline

- Current GPT checkpoint: `0.30.0-alpha.12`.
- Baseline source before this patch: `peacebypiece-ui-0.30.0-alpha.11.zip` with matching repo-state `repo-state-0.30.0-alpha.11-20260706-230647.txt`.
- Repo-state baseline: `master = origin/master`, working tree clean, pushed, `APP_VERSION: 0.30.0-alpha.11`.
- Build baseline: owner-provided build log passed Next.js production build, TypeScript, and static generation.
- This patch absorbs the v1-docs gap review findings into the active v2 baseline and drafts the first narrow Codex work order. It is documentation/version/prompt-preparation only.
- New version line: `0.30.0-alpha.12`.

## 0.30.0-alpha.12 checkpoint

The previous gap review established that v2 changes the product center but does not discard confirmed operational policy. This checkpoint converts that finding into active v2 implementation constraints in `docs/project/v2/14-operational-policy-absorption.md`.

Absorbed policy areas:

```text
- commercial onboarding / Trial / approval / provisioning
- billing / plan / storage quota / storage add-on
- Neon source-of-truth / safe migration / tenant isolation
- R2 / Worker / file lifecycle
- production guard and destructive-operation guard
- system default catalog / categories / sizes / units
- system-admin and customer-admin account lifecycle
- company export / deletion / restore / purge
- product completion evidence
- PowerShell/dev-test automation follow-up
```

First recommended Codex work order after this checkpoint:

```text
docs/codex-prompts/0.30.0-alpha.13-v2-ui-showroom-prototype.md
```

That work order is mock-only and explicitly forbids DB migration, API implementation, R2/Worker mutation, production behavior change, package dependency change, and broad workspace replacement.

## Active v2 Codex read order

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/v2/00-start-here.md`
4. `docs/project/v2/01-product-definition.md`
5. `docs/project/v2/02-ui-philosophy.md`
6. `docs/project/v2/03-data-model.md`
7. `docs/project/v2/04-permission-action-codes.md`
8. `docs/project/v2/05-status-workflow.md`
9. `docs/project/v2/06-screen-spec.md`
10. `docs/project/v2/07-design-system.md`
11. `docs/project/v2/08-feature-spec.md`
12. `docs/project/v2/09-test-plan.md`
13. `docs/project/v2/10-roadmap-0.30.md`
14. `docs/project/v2/11-pdf-share-spec.md`
15. `docs/project/v2/12-codex-working-rules.md`
16. `docs/project/v2/13-v1-gap-review.md`
17. `docs/project/v2/14-operational-policy-absorption.md`
18. `docs/project/25-korean-unicode-encoding-standard.md`
19. `docs/project/32-product-completion-and-ui-evidence-standard.md`

---

# 0.30.0-alpha.11 WAFL v2 v1-docs Gap Review Baseline

- Current GPT checkpoint: `0.30.0-alpha.11`.
- Baseline source before this patch: `peacebypiece-ui-0.30.0-alpha.10.zip` with matching repo-state `repo-state-0.30.0-alpha.10-20260706-224807.txt`.
- Repo-state baseline: `master = origin/master`, working tree clean, pushed, `APP_VERSION: 0.30.0-alpha.10`.
- Build baseline: owner-provided build log passed Next.js production build, TypeScript, and static generation.
- This patch records the v1-docs vs v2-docs gap review. It is documentation only.
- New version line: `0.30.0-alpha.11`.

## 0.30.0-alpha.11 checkpoint

The owner asked to compare the first-pass v2 design with the existing docs before Codex implementation. This checkpoint records the gap review in `docs/project/v2/13-v1-gap-review.md`.

Important conclusion:

```text
v2 replaces the product center and screen model.
v2 does not erase confirmed commercial, signup, billing, storage, deletion, DB safety, R2, PDF, QA, or production guard policies.
```

The review identifies required v2 absorption areas:

```text
- signup / consent / Trial / approval / provisioning
- plan / billing / storage quota / storage add-on
- Neon source-of-truth and safe migration
- R2 / Worker / file lifecycle
- system default catalog / size / unit
- system-admin and customer-admin operations
- company export / deletion / restore / purge
- product completion evidence
- PowerShell/dev-test automation follow-up
- v1 workorder route/domain to v2 Sheet/Card mapping
```

## Active v2 Codex read order

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/v2/00-start-here.md`
4. `docs/project/v2/01-product-definition.md`
5. `docs/project/v2/02-ui-philosophy.md`
6. `docs/project/v2/03-data-model.md`
7. `docs/project/v2/04-permission-action-codes.md`
8. `docs/project/v2/05-status-workflow.md`
9. `docs/project/v2/06-screen-spec.md`
10. `docs/project/v2/07-design-system.md`
11. `docs/project/v2/08-feature-spec.md`
12. `docs/project/v2/09-test-plan.md`
13. `docs/project/v2/10-roadmap-0.30.md`
14. `docs/project/v2/11-pdf-share-spec.md`
15. `docs/project/v2/12-codex-working-rules.md`
16. `docs/project/v2/13-v1-gap-review.md`
17. `docs/project/25-korean-unicode-encoding-standard.md`
18. `docs/project/32-product-completion-and-ui-evidence-standard.md`

---

# 0.30.0-alpha.10 WAFL v2 Document Governance and Roadmap Baseline

- Current GPT checkpoint: `0.30.0-alpha.10`.
- Baseline source before this patch: `peacebypiece-ui-0.30.0-alpha.9.zip` with matching repo-state `repo-state-0.30.0-alpha.9-20260706-224435.txt`.
- Repo-state baseline: `master = origin/master`, working tree clean, pushed, `APP_VERSION: 0.30.0-alpha.9`.
- Build baseline: owner-provided build log passed Next.js production build, TypeScript, and static generation.
- This patch records the WAFL v2 document governance, v1 keep/rewrite/archive classification, Codex read order, and 0.30 roadmap baseline. It is documentation only.
- New version line: `0.30.0-alpha.10`.

## 0.30.0-alpha.10 checkpoint

The owner provided the applied `0.30.0-alpha.9` source, matching repo-state, and successful build log. This checkpoint continues GPT-side design work and does not authorize broad Codex implementation yet.

This checkpoint completes the first-pass Codex-entry design baseline:

```text
1. WAFL v2 product definition: documented.
2. Product / WAFL Sheet / Sheet Card center objects: documented.
3. IA and screen model: documented.
4. Neon-based data model draft: documented.
5. Permission action code catalog: documented.
6. Sheet/Card status workflow: documented.
7. PDF/share and R2/Worker lifecycle: documented.
8. v2 design system and /ui showroom target: documented.
9. dev/test seed and QA scenarios: documented.
10. v1 keep/rewrite/archive classification: documented.
11. v2 Codex read order and working rules: documented.
12. 0.30 roadmap: documented.
```

Before Codex implementation starts, run one GPT-side consolidated review of `docs/project/v2/*` for conflicts, missing Korean labels, and implementation sequencing. Codex must then receive a narrow work order, not a broad "redesign everything" instruction.

## Active v2 Codex read order

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/v2/00-start-here.md`
4. `docs/project/v2/01-product-definition.md`
5. `docs/project/v2/02-ui-philosophy.md`
6. `docs/project/v2/03-data-model.md`
7. `docs/project/v2/04-permission-action-codes.md`
8. `docs/project/v2/05-status-workflow.md`
9. `docs/project/v2/06-screen-spec.md`
10. `docs/project/v2/07-design-system.md`
11. `docs/project/v2/08-feature-spec.md`
12. `docs/project/v2/09-test-plan.md`
13. `docs/project/v2/10-roadmap-0.30.md`
14. `docs/project/v2/11-pdf-share-spec.md`
15. `docs/project/v2/12-codex-working-rules.md`
16. `docs/project/25-korean-unicode-encoding-standard.md`
17. `docs/project/32-product-completion-and-ui-evidence-standard.md`

---

# 0.30.0-alpha.9 WAFL v2 Seed/Test Scenario Baseline

- Current GPT checkpoint: `0.30.0-alpha.9`.
- Baseline source before this patch: `peacebypiece-ui-0.30.0-alpha.8.zip` with matching repo-state `repo-state-0.30.0-alpha.8-20260706-223952.txt`.
- Repo-state baseline: `master = origin/master`, working tree clean, pushed, `APP_VERSION: 0.30.0-alpha.8`.
- Build baseline: owner-provided build log passed Next.js production build, TypeScript, and static generation.
- This patch records WAFL v2 dev/test seed scenarios, QA matrix, R2/PDF scenario coverage, and future automation follow-up concepts. It is documentation only.
- New version line: `0.30.0-alpha.9`.

## 0.30.0-alpha.9 checkpoint

The owner provided the applied `0.30.0-alpha.8` source, matching repo-state, and successful build log. This checkpoint continues GPT-side design work and does not authorize Codex implementation yet.

Seed/test planning now covers:

```text
- test companies
- Korean role baseline: 시스템관리자 / 고객사 관리자 / 디자이너 / 재고관리
- Product/Style and WAFL Sheet scenarios
- Sheet status and Card status coverage
- PDF lifecycle scenarios: 임시 / 검토용 / 공유용 / 최종 / 만료·폐기
- R2/Worker-controlled file scenario planning
- storage usage levels by company/plan
- inventory receiving/inspection/stock reflection scenarios
- mobile input/modal/orientation QA mapping
- future PowerShell/dev-test automation menu concepts
```

## Updated v2 canonical read order

For WAFL v2 design and later implementation work, read in this order:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/v2/00-start-here.md`
4. `docs/project/v2/01-product-definition.md`
5. `docs/project/v2/02-ui-philosophy.md`
6. `docs/project/v2/03-data-model.md`
7. `docs/project/v2/04-permission-action-codes.md`
8. `docs/project/v2/05-status-workflow.md`
9. `docs/project/v2/06-screen-spec.md`
10. `docs/project/v2/07-design-system.md`
11. `docs/project/v2/08-feature-spec.md`
12. `docs/project/v2/09-test-plan.md`
13. `docs/project/v2/11-pdf-share-spec.md`
14. `docs/project/10-r2-storage-policy.md` before any R2 key/upload/delete implementation.
15. `cloudflare/README.md`, `cloudflare/r2-upload-worker.js`, and `cloudflare/pdf-generator-worker/` before any Worker or PDF generation implementation.
16. Existing v1/0.24 documents only when explicitly needed for preserved operational rules.

## 12-point Codex implementation readiness progress

```text
1. WAFL v2 product definition: complete
2. Core objects Product / Sheet / SheetCard: complete
3. Main IA / screen model: complete
4. DB table draft: complete
5. Permission action code catalog: complete
6. Status model: complete
7. PDF/share method: complete
8. /ui design-system component list: complete
9. seed/test scenarios: first detailed baseline complete
10. v1 document keep/rewrite/archive classification: pending detailed pass
11. Codex read order: active, needs final sync after roadmap/archive work
12. 0.30 roadmap: pending
```

## Implementation boundary

This patch is documentation/version only.

It does not authorize:

```text
- DB migration
- seed mutation
- API implementation
- UI route implementation
- Playwright implementation
- Worker changes
- Cloudflare deployment
- R2 mutation
- production behavior changes
- package dependency changes
- existing v1 document deletion/move
```

Next GPT-side checkpoint should be `0.30.0-alpha.10` for v1 document keep/rewrite/archive classification and Codex read-order cleanup.
