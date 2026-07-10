# WAFL App Design Theme v1 — Dongdaemun Atelier Ops

## 1. Theme Definition

Theme name:

```text
동대문 제작 워크룸
```

Internal name:

```text
Dongdaemun Atelier Ops
```

WAFL App Design Theme v1 defines the first visual foundation for the mobile/tablet WAFL app. The app should feel like a professional production workspace for Korean apparel work: fast, dense, deadline-aware, material-aware, and practical.

The product should not feel like a student portfolio, landing page, pretty sample app, gradient showcase, or a stack of oversized demo cards. The app should help a production user read fabric, accessory, process, due-date, cost, and current status quickly.

## 2. Color System

Final color values may be tuned after device review. The current contract is semantic consistency.

### Base

| Token | Use |
| --- | --- |
| Warm Paper | App background and app-level canvas |
| Off White | Quiet screen surface |
| Work Surface | Production workbench area |
| Card White | Data card and list row surface |
| Soft Line | Borders, dividers, compact separators |

### Primary

| Token | Use |
| --- | --- |
| Deep Navy | Main selected state, primary app identity, confirmed action |
| Navy Ink | Strong text, dense production labels, header copy |

### Production Accent

| Token | Use |
| --- | --- |
| Brick Orange | Order request, urgent production action, schedule attention |
| Thread Amber | Pending or follow-up detail |
| Fabric Beige | Material texture, swatch-like quiet accents |
| Deep Olive | Completed or locked production state |

### Status

| Label | Visual direction |
| --- | --- |
| 입력중 | warm gray |
| 발주 가능 | deep navy / muted blue |
| 발주 요청 | brick orange / amber |
| 발주 완료 | deep olive |
| 주의/잠김 | muted red |

## 3. Font Policy

- `2.0.0-alpha.18` applies 에이투지체 / A2Z as the first bundled app UI font from owner-provided local files.
- Font assets live under `apps/mobile/assets/fonts/a2z/`.
- Source/license tracking lives at `apps/mobile/assets/fonts/a2z/FONT-SOURCE.md`.
- The app screen does not need font attribution text.
- A2Z Regular, Medium, SemiBold, and Bold are the primary runtime UI weights.
- A2Z Black and ExtraBold are included as assets but should not be overused on dense production-card screens.
- Codex must not arbitrarily download or include font files.
- PDF/Worker font embedding is separate from app UI font application and must be handled in a later PDF-specific version.

## 4. Card Rules

- Use minimal shadow.
- Prefer border, divider, and background contrast over decorative elevation.
- Radius should be medium and practical.
- Information must read before decoration.
- Do not use a portfolio-style hero card as the default production-card structure.
- Keep practical data density for quantity, due date, material, accessory, process, and amount.
- Large visual blocks are allowed only when they directly support production work, such as representative image review or sketching.

## 5. Mobile And Tablet Policy

- Normal mobile production-card screens are designed for portrait orientation.
- Mobile landscape is not recommended or supported for the normal production-card flow.
- Tablet must support both portrait and landscape.
- Future drawing/sketch modules may allow both portrait and landscape on mobile because drawing and visual review may need rotation.

## 6. Action Policy

- Mobile actions are icon-only first.
- The current status primary action may use a short text button when the action must be unambiguous, such as `발주 요청` or `발주 완료`.
- Show only one primary action for the current status.
- Do not show `발주 요청` and `발주 완료` at the same time.
- Destructive actions use a red icon-only control and a later confirmation pattern.
- Tablet may show icon plus a short label where width allows it.

## 7. Tab Criteria

| Tab | Visual standard | Required direction |
| --- | --- | --- |
| 개요 | Dense production summary | Representative image, product identity, quantity, due date, status, unit cost, totals, trading/production summary, short memo |
| 이미지·첨부 | Thumbnail-first asset review | Representative image, image list, representative badge/crown concept, first-image auto-representative note, attachment list |
| 사이즈·색상 | Compact table and chips | Standard size, customer size, free size, cm/inch switch, inch fraction helper placeholder, color chips, color quantity |
| 원단 | Row-first material work | Name, supplier, color, required quantity, loss/allowance, stock use, order quantity, unit, unit price, amount, over-order handling, status |
| 부자재 | Row-first accessory work | Name, option/color, supplier, required quantity, loss/allowance, stock use, order quantity, unit, unit price, amount, status; category stays secondary |
| 제작 플로우 | Process workbench | Main factory, additional processes, partner, quantity, unit, unit price, amount, due date, stage status; drag/long-press direction only |
| 출력·공유 | 제작 문서 composition | 작업지시서, 공장 전달 작업지시서, 배송요청서 만들기, 배송요청 추가하기, view/share/print/save, attachment inclusion placeholder |

## 8. Runtime Visual Fidelity Rule

`2.0.0-alpha.5` applies this theme as an app surface correction, not as an in-app concept board.

- Do not show a runtime theme explanation strip such as `Dongdaemun Atelier Ops` inside the normal app surface.
- Keep theme rationale in documentation and let the screen itself communicate the production workroom direction.
- Avoid repeated bordered boxes when a divider, row, tab underline, or quiet background contrast is enough.
- Use representative image, garment thumbnail, output preview, and swatch placeholders built from React Native `View` and `Text`.
- Do not add external image assets, font files, icon libraries, or dependencies for these placeholders.
- Material and accessory rows should reveal fabric/accessory sense through compact swatches plus production data, not through large decorative cards.
- Summary values should prefer dense line rows over portfolio-style metric cards.
- Mobile must stay portrait-first for normal production-card screens, while tablet keeps restrained centered/wide workbench layouts.

## 9. Forbidden Direction

- Student portfolio feeling.
- Excessive gradient styling.
- Landing-page style exaggerated copy.
- Showing buttons together when the real policy allows only one current-state primary action.
- Real customer, vendor, factory, or workorder images.
- Font or image assets with unclear license.
- New font download or external image download in this version.
- Real camera, file picker, upload, share link, PDF generation, API, DB, R2, or Worker connection in this visual foundation version.

## 10. Production-Card Language Alignment

`2.0.0-alpha.6` keeps the visual theme while tightening the WAFL production-card flow.

- The app mock should not feel like a generic production-management, project-management, or schedule-tracking product.
- Use production-card language first: `제작 카드`, `제작 요약`, `이미지·첨부`, `사이즈·색상`, `원단`, `부자재`, `제작 플로우`, and `출력·공유`.
- The production-flow section should read as `제작 공장 + 추가 공정 + 공장 전달 준비`.
- Prefer `공장 전달 준비`, `작업지시서 전달 준비`, `공정 메모 필요`, `단가 확인 필요`, `납기 확인 필요`, `전달 전 확인`, and `전달 완료`.
- Avoid default mock statuses such as `진행 예정`, `일정 확인`, and `대기` when they make the screen feel like a generic tracking board.
- Replace developer-like `Assistant` framing with compact user-facing labels such as `다음 확인`, `작업 사인`, `확인할 일`, or `오늘 확인`.
- Output/share should show `작업지시서`, `공장 전달 작업지시서`, `배송요청서 만들기`, and `배송요청 추가하기` as business document rows, with included information shown before compact actions.
- User-facing copy should use `사이즈·색상`; internal implementation may still use `size` and `color`.
- Image/attachment detail deepening is not part of this alpha.6 alignment pass and remains deferred.

## 11. Signature UI Correction

`2.0.0-alpha.7` adds WAFL signature UI cues without changing the mock-only boundary.

- The production-flow tab may use a compact progress rail to show the production-card handoff path: `발주 요청`, `자재 준비`, `재단`, `봉제/추가공정`, `검수/포장`, and `출고 준비`.
- The rail should read as readiness and handoff guidance, not as a generic schedule tracker or real-time production status engine.
- Use WAFL-specific statuses such as `완료`, `전달 준비`, `공정 메모 필요`, `납기 확인 필요`, `공장 확인 필요`, and `전달 전 확인`.
- Output/share should look like a document workbench: document list, selected production-document preview sheet, included information, delivery-request summary, and compact icon action cluster.
- Icon actions may be built with `View`/`Text`/`Pressable` when no direct icon dependency exists. Do not add a dependency only for visual polish.
- Button-like actions must not be nested inside another button-like tile. Image tiles can be static containers while their delete/representative actions remain separate controls.
- Image/attachment mock deepening is deferred to `2.0.0-alpha.8`.
- The alpha.7 correction must not add real API, DB, R2, PDF Worker, upload, camera, file picker, share, order, delivery, drag, or long-press behavior.

## 12. Real-Use UX Correction

`2.0.0-alpha.8` keeps Dongdaemun Atelier Ops but removes mock-app friction that would feel unrealistic in apparel production work.

- Do not expose internal production-card IDs on customer-facing default surfaces.
- Image tiles should be thumbnail-first and should not ask for a title or description per image on the default screen.
- Representative-image selection should be visible through a compact crown/selection affordance.
- Attachments should follow the existing WAFL file policy shape in mock examples: image and PDF examples are acceptable; unsupported text/spreadsheet examples should not be invented.
- Factory delivery memo belongs to a memo field, not to an attachment file.
- Size/color tables should show one selected unit at a time. A unit toggle must change the displayed values if it is shown.
- Product-type size templates are suggestions and must remain editable in the mock direction.
- Fabric and accessory rows should use compact icon-like action clusters, not exposed `E`/`L` letters.
- Fabric/accessory photos are optional affordances, not required fields.
- Production-flow visual language should use six baseline steps and simple states: `준비`, `작업중`, `완료`.
- Cutting can be represented as a removable default step, while adding an internal process remains separate from adding a flow step.
- Output/share should keep a document-workbench feel without repeated action clusters.
- No dependency, external asset, font file, real upload, camera, file picker, share, PDF, API, DB, R2, Worker, push notification, order, delivery, drag, or long-press integration is added by this correction.

## 13. Button And Action Cluster Polish

`2.0.0-alpha.9` keeps Dongdaemun Atelier Ops but tightens repeated button grammar.

- Row information must read before action controls.
- Fabric and accessory rows use a compact action cluster at the row top, next to the status badge.
- The current-state primary action may be icon-only when its accessibility label is explicit.
- The default row surface should not repeat large text buttons such as order request, order complete, or information check.
- Section add actions use compact header `+` buttons instead of bottom button stacks.
- Inline edit should feel like touching the value itself, not hunting for a repeated edit button.
- Locked/completed rows use badge and lock/read-only language rather than edit/action affordances.
- Image/attachment actions are grouped in a compact top row for image upload, camera, sketch, and attachment placeholders.
- Production-flow uses the six-step rail as the main rhythm; internal process rows belong inside the process step.
- Output/share action icons should share size, spacing, and density with the rest of the app.
- No dependency, external asset, font file, real upload, camera, file picker, share, PDF, API, DB, R2, Worker, push notification, order, delivery, inline-edit save, drag, or long-press integration is added by this correction.

## 14. Icon Action Interpretability Polish

`2.0.0-alpha.10` keeps the compact action grammar but allows short captions where symbols alone slow down production judgment.

- Repeated icons may include one-word Korean captions such as `사진`, `카메라`, `스케치`, `첨부`, `발주`, `완료`, `보기`, and `삭제`.
- Captioned icon buttons should remain compact; they must not become large portfolio-style CTA buttons.
- Thumbnail detail/view should live on the thumbnail surface, while destructive and representative actions stay as separate sibling controls.
- Material row action grammar should be stable across fabric and accessory rows: status badge, one current action when allowed, lock/edit state, view, delete, optional photo.
- Size/color add controls should be small `+` chips near the affected list or table.
- The production-flow rail should feel like a workbench timeline that uses available width, not a cramped sample-app strip.
- No dependency, external asset, font file, real upload, camera, file picker, share, PDF, API, DB, R2, Worker, push notification, order, delivery, inline-edit save, drag, or long-press integration is added by this correction.

## 15. Practical UX Correction

`2.0.0-alpha.11` keeps Dongdaemun Atelier Ops and makes the app mock feel less like a sample screen under heavier real production-card data.

- The image area should feel like a production review carousel: one image in focus, clear current index, representative state, quick representative/delete actions, and optional thumbnail strip.
- Attachment metadata should be operational, not decorative: filename, type, output include/exclude, and upload timestamp.
- Overview should surface participating makers and next work, not generic memo/help language.
- Size/color should feel like a saved measurement workbench: gender, category, unit, template load/save, size rows, body-part addition, and color quantity swatches.
- Material and accessory actions should read as status flow, not as a pile of row tools. `입력중` can request/delete, `발주요청` can complete/cancel/delete, and `완료` is read-only.
- Production flow remains a six-step handoff rail and should be visually centered and calm enough for tablet review.
- No dependency, external asset, font file, real upload, camera, file picker, sketch, share, print, PDF, API, DB, R2, Worker, push notification, order, delivery, inline-edit save, drag, or long-press integration is added by this correction.

## 16. Alpha.11 UX Follow-up Correction

`2.0.0-alpha.12` keeps Dongdaemun Atelier Ops and removes remaining mock-screen friction before output/share flow work.

- Carousel review should feel centered and calm, with one focused image and centered index controls.
- Image labels should support real field work where many photos are added without title entry.
- Selector controls should show the current production choice first and keep alternatives small.
- Saved templates belong behind load/save entry points, not as a permanent visual list.
- Material/accessory status should be read from fixed text and action grammar first; color accents only reinforce state.
- Order request actions should read as production requests, not message sending.
- Production rail columns should be orderly: dot, step label, and state stacked on one axis.
- No dependency, external asset, font file, real upload, camera, file picker, sketch, share, print, PDF, API, DB, R2, Worker, push notification, order, delivery, inline-edit save, drag, or long-press integration is added by this correction.

## 17. Alpha.12 UX Follow-up Correction

`2.0.0-alpha.13` keeps Dongdaemun Atelier Ops and makes the alpha.12 correction more legible in the mock UI.

- Action symbols should look like production tools: photo, camera, sketch, attachment, representative selection, request, delete.
- Default image review should emphasize the visual reference, not memo or title-entry work.
- Current-value selectors should feel like quick production choices, not a settings screen.
- Material and accessory row actions should sit near quantity and amount data so production users can scan and act quickly.
- The production-flow rail should read as one calm handoff line across the card.
- No dependency, external asset, font file, real upload, camera, file picker, sketch, share, print, PDF, API, DB, R2, Worker, push notification, order, delivery, inline-edit save, drag, or long-press integration is added by this correction.

## 18. Alpha.14 UI Polish + Work Order CTA Mock

`2.0.0-alpha.14` keeps Dongdaemun Atelier Ops and tightens small UI signals that slow repeated production judgment.

- Icons should look like the production action they represent: photo, camera, sketch, attachment, representative crown, request document, undo, check, and delete.
- The image preview should avoid decorative details that do not help production review.
- Selector widths should stay fixed enough that repeated field use does not feel unstable.
- Action buttons should not look like status badges. Status is a label; action is a button.
- Per-item material/accessory `발주` is separate from the global `작지 발주`.
- `작지 발주` should feel like a document/readiness checkpoint, not an immediate hidden mutation.
- Production-flow emphasis should guide the current step without turning the rail into a decorative timeline.
- Local CTA completion may update only mock screen state.
- No dependency, external asset, font file, real upload, camera, file picker, sketch, share, print, PDF, API, DB, R2, Worker, push notification, order, delivery, schema, migration, inline-edit save, drag, or long-press integration is added by this correction.

## 19. Alpha.15 Icon Library Adoption

`2.0.0-alpha.15` keeps Dongdaemun Atelier Ops and moves the app mock from temporary drawn icons to a consistent icon library.

- The mobile mock uses `lucide-react-native` for action icons and `react-native-svg` as the Expo-compatible SVG runtime.
- Icon selection should favor concrete production meaning over decoration: photo, camera, sketch, attachment, crown, folder, save, ruler, palette, document request, clipboard check, preview, share, print, undo, check, delete, search, notification, and more.
- The WAFL icon wrapper/mapping is the preferred place to choose icons and tune size, stroke, and tone.
- Status badges and action buttons remain visually distinct.
- Per-item material/accessory `발주` is separate from global `작지 발주`.
- The icon library does not authorize real camera, file picker, upload, share, print, PDF, order, delivery, API, DB, R2, Worker, schema, migration, or production mutation work.
- Package metadata checked: `lucide-react-native` uses ISC; `react-native-svg` uses MIT.

## 20. Alpha.16 Tab Alignment And Editable-Affordance Correction

`2.0.0-alpha.16` keeps Dongdaemun Atelier Ops and corrects small repeated-use signals that affect production speed.

- Section tabs must feel centered, balanced, and deliberately scrollable on mobile/tablet.
- Active tab text and underline should share one center axis so the selected section is unmistakable.
- Production-card search should appear where users expect it: directly under the 제작 카드 목록 header.
- Editable affordance should be subtle and field-local, not a repeated edit button.
- Locked, requested, or completed rows should remove editable affordance and rely on status, quieter row treatment, and lock/read-only meaning.
- Bottom navigation must use concrete icons plus Korean labels. Internal shortcut letters such as `C/I/D/S` are not customer-facing UI.
- The production rail remains a compact workbench cue and should not grow a connector beyond the `출고` step.
- This correction does not authorize real search, edit-save, upload, camera, file picker, sketch, share, print, PDF, order, delivery, API, DB, R2, Worker, schema, migration, or production mutation work.

## 21. Alpha.17 Inline Edit Visual Language And Flow Simplification

`2.0.0-alpha.17` keeps Dongdaemun Atelier Ops and turns dense editable areas back into read-first production summaries.

- Fabric and accessory rows should look like compact material summary cards, not miniature form screens.
- Editable state is a quiet property of the value itself, such as dotted underline or slightly stronger value color.
- Do not wrap every supplier, color, quantity, loss, stock, and unit value in its own rectangular field.
- Requested and completed rows should feel locked or read-only through status, subdued row tone, and missing edit affordance.
- The amount line remains visually important because order quantity, unit price, and total are production decisions.
- The six-step production rail is a summary of work position, not a manual checklist for every base step.
- Process detail rows are the real mock management surface for factory/additional processes and should use compact meta summaries plus memo and amount.
- This correction does not authorize real search, edit-save, upload, camera, file picker, sketch, share, print, PDF, order, delivery, API, DB, R2, Worker, schema, migration, drag, long-press, or production mutation work.

## 22. Alpha.18 A2Z App Font Application

`2.0.0-alpha.18` applies 에이투지체 / A2Z to the app mock as a typography foundation, not a feature integration.

- A2Z should support the Dongdaemun Atelier Ops feeling by making Korean production labels, amounts, and action text feel native to the app.
- The bundled font applies to ProductionCardMock text, tabs, badges, button captions, bottom navigation labels, and amount/quantity values.
- Runtime weight mapping should stay practical: Regular for body, Medium/SemiBold for work labels, Bold for strong headings and badges.
- Black and ExtraBold are available for future review but should not dominate the current production-card UI.
- Font source/license details are tracked in `FONT-SOURCE.md`, not displayed in the app.
- This correction does not authorize PDF/Worker font embedding, real upload, camera, file picker, sketch, share, print, PDF generation, order, delivery, API, DB, R2, Worker, schema, migration, or production mutation work.
