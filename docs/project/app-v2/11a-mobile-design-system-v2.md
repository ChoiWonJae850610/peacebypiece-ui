# WAFL Mobile Design System v2

## Alpha.69 recommendation presentation

- Recommendation is a primary guidance section, never an implicit selection or mutation.
- Size selection derives its first section from target audience × major category, followed by registered and
  unmatched-current choices. `다른 WAFL 사이즈 보기` discloses the remaining system universe on demand;
  direct creation remains available and 44/XS remain separate identities.
- POM selection orders `WAFL 추천 스펙`, `WAFL 추가 스펙`, `우리 회사`, and `현재 사용 중` without
  duplicates. Existing WaflOptionGrid selected-state and staged X/V semantics remain the visual owner.
- A Size/Color replacement with no positive quantity or non-empty measurement loss applies on the first V.
  Real loss replaces the active Sheet body with the shared WAFL INPUT question/helper/two-row reel/V choice state
  using concise `취소` / `변경` actions; technical counts, centered two-button cards, and a second global Modal are forbidden.
- Target/major dependent reset uses that same-sheet choice state. While visible it replaces the chooser interaction,
  retains accessible decision focus, and keeps the underlying staged state for safe restoration; cancellation restores
  the chooser and confirmation reuses its canonical exactly-once operation.

## Alpha.68 Draft persistence and native asset boundary

- Draft controls are local-instant. Saving state belongs to one section-level dirty/batch owner;
  keystrokes and Size/Color cells never present network latency as an input affordance.
- A successful local edit or fast boundary flush has no user-facing success notice. Only a real
  interaction-blocking flush shows `변경사항을 저장 중입니다.` for its actual duration; validation,
  conflict, and failure remain visible. A failed flush preserves the latest local value, and a stale
  response cannot clear a newer dirty generation.
- List swipe actions use fixed semantic slots: trailing Delete and leading Copy/Reorder. Full swipe
  never mutates, disabled Reorder retains its slot, and vertical scrolling closes an open row.
  A touch or dominant vertical move never reveals actions; deliberate horizontal intent activates
  one finger-tracking row, resisted action-width bounds, and a spring to exactly one open side.
  Search/filter/refresh, another row gesture, another row tap, or list scroll clears the owner.
- WorkOrder titles use one quiet secondary line for authoritative KST creation time:
  `YY/MM/DD HH:mm:ss` with no prefix label. It never uses updated time, client-now, or insertion time and never changes sort.
- Copy and Reorder share one modal interaction blocker from tap through authoritative core-detail open;
  optional child hydration does not prolong it. Reorder adds no second confirmation sheet.
- Every WorkOrder entry path shares core-first hydration. A successful authoritative detail read opens the
  WorkOrder; assets, partner options, and series history use one independently settled, bounded-retry
  child owner. Child failure is reported by exact area but never replaces the usable core screen.
- High-value asynchronous actions share one ordered grammar: a semantic confirmation only when required,
  then the canonical full-interaction processing blocker, then the existing top result banner only after
  confirmed success. Confirmation never contains a spinner, and failure never emits success copy.
- Final WorkOrder generation and Draft deletion use one WAFL safety-card surface with the same dim,
  radius, spacing, typography, and image-tab X/Check action owner as the processing blocker family.
  The decision state has no spinner; Check changes the same card into its action-specific processing
  state. Ordinary order request/cancel/complete actions do not add explanatory yes/no popups.
- A flush-time interaction displays `변경사항을 저장 중입니다.` only for the real save duration.
  The first valid tab, field, list, back, or navigation intent wins; later input is ignored until save
  success replays that exact intent once. Failure drops the intent and preserves dirty values.
- PDF Preview and attachment viewing stay inside WAFL. Image and PDF are the only user attachment
  display classes; authenticated bytes, safe-area close, zoom/navigation and bounded retry belong to
  the shared native viewer family. Image viewing uses a white/light-neutral canvas so dark assets
  remain legible without altering source color.
- Standard WAFL Share has no duration picker in this version: the one canonical duration is 72 hours.

## Alpha.67 identity PICK and PDF renderer grammar

Issued/finalized/read-only WorkOrders render the persisted `본생산 / 샘플` identity as fixed text or a badge, never as an interactive segmented control. Draft identity alone is editable; Reorder remains forced to 본생산. Overview `시즌` and `세부 품목` use canonical draggable `reelAdaptive` WAFL PICK surfaces. Season uses the paired option-reel owner with year on the left and `SS / FW / 상시` on the right; Detail Item uses the single option-reel owner. Both retain centered-selection physics, staged X/V, and the exact shared `직접 입력으로 변경 / WAFL PICK으로 변경` mode switch. Their bounded data never nests a same-orientation `FlatList`/`VirtualizedList`, and WorkOrder-local direct values never mutate a global catalog. Legacy persisted strings remain readable.

Public `/v` renders authenticated PDF bytes into self-hosted PDF.js canvas pages. The primary document body never depends on browser-native `object`/`embed` PDF plug-ins; Download remains secondary. Chromium and WebKit-class QA must observe a nonzero rendered first-page canvas, not only the hydrated metadata shell. The native authenticated viewer uses vertical scroll and zoom for document navigation; its canonical visible exit is a sticky bottom WAFL `닫기` action in a footer sibling outside the PDF gesture surface.

Document role: current normative owner for App-first React Native mobile visual tokens, layout, shared component grammar, and responsive behavior.

When this document conflicts with `11-app-design-theme-v1.md`, preserved `docs/project/v2/*`, `/ui`, `ProductionCardMock`, or proposal images, this document and the current typed source owners win. Product behavior, authorization, data contracts, and mutation policy remain owned by their specialist contracts.

## Canonical source owner

`apps/mobile/constants/theme.ts` owns the single typed `WAFL_THEME`. Extend that owner; do not create competing screen-local theme objects. Shared layout components consume semantic roles from it.

### Palette

The implemented palette remains authoritative: paper `#fffdf8`, muted paper `#f3eee4`, deep navy `#17263d`, navy ink `#23375a`, brick orange `#9b4a27`, fabric beige `#f7f0e5`, olive `#667052`, border `#dfd5c8`, disabled `#8f857b`, read-only `#75695d`, edit-active `#8b5e3c`, error `#a13933`. Proposal-image approximations are not token values.

### Spacing and layout

- base spacing: `4 / 8 / 12 / 16 / 24 / 32`
- phone/tablet screen gutter: `16 / 24`
- card/compact-card padding: `12 / 8`
- section/large-section/control/tight gap: `12 / 16 / 8 / 4`
- action-tile gap: `6`
- action-tile min/preferred/max width: `72 / 88 / 112`

One page shell owns the outer gutter and centered/max-width behavior. A selected feature root must not reapply a second screen gutter. Internal card padding is not a screen gutter.

### Radius, border, and touch

- field `10`, action tile `10`, major card `14`, compact card `10`, sheet `18`, pill `999`
- canonical border/hairline is the shared theme border role
- minimum touch and inline control `44`, action tile minimum height `54`, tab rail minimum height `48`
- icon roles: small `18`, standard `20`, large `24`

Special image, swatch, carousel, and fullscreen geometry may remain intentionally local when it expresses a distinct product role.

### Typography

A2Z remains the font-family owner. Semantic roles are product title `20/26` (compact `18/24`), section title `15/20`, card title and body-strong `13/18`, body `12/18`, field label `11/16`, meta `10/15`, action label `10/14`, badge `9/13`, and text input `16/20` or greater. Screens map content to roles before retaining a domain-specific exception.

## Shared component grammar

- `MobileWorkOrderExperience` is the current WorkOrder page shell and consumes the canonical gutters.
- `WaflSectionCard` owns major card surface, border, radius, padding, and optional header.
- `WaflActionTile` owns icon/short-label action appearance.
- `WaflActionTileGroup` owns tile gap, wrap, balanced width, and the `112` maximum; one action is not forced full width and two actions do not inflate on tablets.
- `WaflInputSheet` owns the WAFL Sheet System v2 X/V and deep-editor presentation. It has five explicit sizing classes: measured fixed `contentFit`, compact-initial draggable `adaptiveExpandable`, intrinsic reel-driven `reelAdaptive`, normal-initial draggable `expandable` (the canonical medium `0.68` initial ratio and expanded `0.94` maximum), and near-full draggable `fullView`. `reelAdaptive` uses the visible reel rows plus its actual label, mode switch, validation/help, staged actions, and safe area instead of inheriting the general form-sheet medium floor. In `contentFit`, actions immediately follow measured body content and the measured footer participates in compact height. Sizing selects only the initial/minimum/maximum geometry; every draggable class uses the same continuous release physics. Slow release settles at the actual released height, bounded flick projection remains continuous, and only min/max/dismiss boundaries constrain the result. No consumer may restore rigid medium/expanded release snapping. Swipe/backdrop/X dismissal is cancel-only and never implies V/confirm.
- Sheet drag arbitration belongs to the shared owner. At body offset zero a downward gesture may move the sheet; while content is scrolled the body retains the gesture. The settled free height persists only for the current open session. Close/reopen starts from that surface's canonical initial height, while late content measurement raises an unsafe minimum only as far as required and never shrinks a user-expanded sheet. Nested editors keep independent staged state and return to the parent without committing the parent.
- Every staged X/V sheet exposes both actions before keyboard entry. `contentFit` places them immediately after measured content; draggable sheets reserve header, bounded body viewport, footer, and safe area in their initial geometry. A disabled V remains visible. X/V are whole-sheet actions, not field completion or an input accessory: keyboard appearance does not lift them to keyboard top and may occlude them until keyboard dismissal. Nested child routing closes the outgoing native sheet before presenting the next sheet, fully resets its lifecycle before focusing the new route, preserves the parent draft, and leaves no invisible modal overlay after return.
- Staged-action layout is one real ordered sibling frame: `HEADER -> BODY VIEWPORT -> X/V FOOTER -> SAFE AREA`. The footer never uses inverse translation, absolute positioning, or per-feature bottom padding to float over fields. At every expandable detent the shared owner subtracts the current sheet offset from the body viewport while the footer keeps its own measured layout space; only the body workspace grows when the sheet expands. A long body scrolls its last field fully above the footer. `contentFit` includes the measured footer and action gap exactly once in its compact target instead of inheriting the expandable medium floor. Disabled actions reserve the same space.
- `WaflInputSheet` is the canonical staged-sheet owner for presentation, root geometry, slide and detents, open/close/reopen lifecycle, gesture base, body viewport and vertical scroll extent, keyboard inset, safe area, X/V footer, and nested parent/child handoff. Feature consumers supply content, sizing class, staged state, X/V callbacks, and feature-specific horizontal/reel/grid interaction. A staged consumer must not add its own root `Modal`, root `KeyboardAvoidingView`, vertical body `ScrollView`, detent transform, gesture responder, animation, or footer offset unless the Result records a distinct intentional exception. On the mounted iOS header path the stable visual offset, page-Y base, and ready flag are established synchronously at responder grant; the first MOVE must never wait for a native `stopAnimation` callback or be discarded.
- True-bottom is permanent: the shared body-end semantic gap makes the last real item scroll fully through the keyboard-occluded viewport. Keyboard appearance never applies an outer root shift, rewrites the gesture base, or lifts the sibling X/V footer. The shared owner measures the focused field, label/help context, and semantic gap; it first scrolls, and only when needed expands the free-settled sheet by the minimum required rise. It remembers the pre-keyboard settled height and restores it when the keyboard closes, except when the user manually drags while the keyboard is open, in which case that new height becomes authoritative.
- Every open generation cancels stale animation, aligns visual translation and logical detent, clears drag/velocity/closing refs, and derives the next gesture base from the stopped animation's actual value. In the repeated `OPEN -> DRAG -> SNAP -> CLOSE -> REOPEN -> TOUCH_DOWN -> MOVE -> SNAP` contract, `TOUCH_DOWN` alone changes position by exactly zero; this includes Quick preview/parent return and Attachment reopen paths.
- Reusable-catalog direct creation is a child route, not a second staged commit surface. It uses the registered direct-input confirm through native Done or the minimal keypad action, has no duplicate body `추가` or dead footer V, returns through the shared close/unmount/reopen handoff, and stages the newly created option in its parent. The parent V alone owns the later WorkOrder selection batch.
- Size, Color, and Spec Item reusable-create children share the semantic `adaptiveExpandable` create policy: compact content-measured initial height, visible handle, free-settle drag, and the canonical sheet focus/keyboard path. Initial pixel height may differ with content (for example, the Color palette), but a text-entry creator must not fall back to fixed `contentFit`. Fixed `contentFit` remains for truly fixed/simple surfaces without draggable text-entry behavior.
- Every live WAFL TextInput form sheet, including WorkOrder creation, uses the semantic `adaptiveExpandable` text-entry policy: a compact content-appropriate initial height, visible handle, common free-settle drag, and the canonical sheet focus/reveal lifecycle. `contentFit` is reserved for truly fixed/simple non-form surfaces. Automatic focus is requested only from the current open generation's presentation-ready `onAfterOpen` boundary; raw mount-time `autoFocus` must not race body measurement or entrance animation.
- `adaptiveExpandable` is the canonical Saved Spec and variable catalog sizing policy: short measured content opens compact with a real handle, longer content grows only to the bounded medium maximum and then scrolls, and expanded remains available. Measurement is scoped to the current title/sizing/action generation. A late async measurement may grow a medium sheet, but it never collapses a sheet after the user has interacted or expanded it.
- A sheet open is one atomic bottom-origin entrance. Deterministic `reelAdaptive` geometry resolves from the known reel body plus measured shared chrome before animation; measured `contentFit`/`adaptiveExpandable` content waits off-screen for a stable current-open-generation measurement. A visible fallback stop followed by a second correction animation is forbidden. Drag capture begins only after entrance completion, when the gesture base equals the actual visual position; close/reopen discards prior-generation measurement and repeats the same single entrance.
- A dynamically measured nested child uses the canonical nested presentation generation in its measurement identity. It may enter from a bounded safe fallback, but only a measurement from the current generation may reconcile that fallback to the usable adaptive target. Layout changes must not cancel the queued entrance and leave a title-only strip; after manual drag, late measurement may raise an unsafe minimum but must not shrink the user-settled height.
- Focus reveal belongs to the shared sheet body. The canonical reveal target is the whole semantic field block—label/context, complete input, inline validation/help, and breathing room—not only the native TextInput. The owner measures that block and the live body viewport, scrolls the body first, and expands a free-settled sheet only by the minimum rise that scrolling cannot supply. Fabric and Accessory share the same field-block path; feature consumers do not add per-field offsets. Numeric direct entry reserves enough context for the input, decimal reason, and `WAFL PICK으로 변경`; X/V remains at physical sheet bottom and is not part of that keyboard-visible requirement. Multiline content/caret movement reuses the same body reveal path.
- Every editable field mounted in a WAFL sheet registers both its actual native TextInput target and its enclosing semantic field block through the canonical sheet focus provider. Tap-to-focus, post-presentation focus, content-size changes, and multiline caret movement all reuse that owner; screen-local `KeyboardAvoidingView` or hard-coded reveal offsets are forbidden.
- Every live single-line inline value keeps identical participating geometry before and during focus. `ControlledInlineEditValue` and the shared editable-value surface own that invariant: focus may change caret, underline/border colour, text emphasis, or a subtle tint, but never width, height, minimum height, padding, radius footprint, or surrounding gaps. Multiline values may grow only from content, never merely from focus. Sheet fields use the same rule through `WaflSheetValueField`/`WaflSheetTextInput`.
- Editable and read-only sheet values use one semantic surface family. Editable values expose the canonical thin underline and may become first responder; read-only values use the same geometry with muted treatment, no underline, cursor, keyboard, or edit handler. A display-format toggle such as Finished Spec cm/inch never changes this editability affordance.
- Numeric precision is a domain-owned validation semantic. Direct entry shows the canonical red reason immediately, preserves the typed value without truncation or rounding, and keeps V visible but disabled until valid. Input-mode switching remains keyboard-reachable.
- `WaflReelPickerSheet` is the only live reel-sheet owner. A reel body owns value scrolling while the shared sheet header owns free drag. Single-choice and dual numeric reels may have different intrinsic initial body heights, but both route through `reelAdaptive`, include the same compact field label above the reel, and keep one atomic entrance; direct numeric mode keeps the same sheet session and `WaflInputModeSwitch` route. A required-choice route with candidates and no valid current candidate stages its first real option atomically with open, so reducer value, visual center, initial index, and V share one source. An invalid persisted candidate is treated as no valid selection, not as a visual-only center. Nullable pickers retain their unset state. A create-first picker with no safe business default uses the UI-only `미지정` sentinel and keeps V disabled until a real option is selected; that sentinel is never persisted or used for dependent lookup.
- The compact visual handle is `42×4`, but its responder owner is a full-width header drag zone with a minimum `44`-point hit height. The dedicated mounted header captures the native responder from touch-down on iOS and derives continuous `translateY` updates from the actual touch `pageY`; it does not defer acquisition to a movement-threshold PanResponder callback after a child has already taken the responder. Custom body scrolling and `bodyScrollable=false` never disable that header path. A bottom-origin sheet starts below its target and slides up, and every cancel/dismiss path slides down before unmount. A visible handle therefore means real draggable behavior; an intentionally fixed `contentFit` sheet removes the handle.
- `WaflWorkOrderTabBody` owns one shared top and horizontal body inset for every live Maker tab. Feature roots keep their internal card padding but must not add a second outer screen gutter or top offset.
- Production authoring is a sibling of the live Materials compact-card family: shared surface, border, radius, padding, field rhythm, action hit area, and left-accent geometry without sharing material business logic. The factory accent denotes the fixed factory role; additional-process accents are a deterministic function of canonical process type code and never encode request/completion status. Selection values route to the canonical WAFL PICK; scalar money and nullable memo values use `ControlledInlineEditValue` in place. Derived cost remains server-owned but is not repeated as an authoring field. A normal Production edit path must not wrap these few fields in a multi-field form sheet. Cached cards remain visible during background refresh; only an uncached unresolved first load uses the shared WorkOrder-tab loader (`제작 정보를 불러오는 중입니다.`), and a real read failure renders product-safe retry UI.
- The six live WorkOrder tabs share one asynchronous loading grammar. A tab with usable parent/cached content renders it without a loader or re-entry flash; an uncached unresolved asynchronous source uses `DelayedLoadingMessage` with the tab-specific sentence inside the normal `WaflWorkOrderTabBody`; a synchronous/parent-loaded tab never invents loading state; and a genuine failure uses product-safe retry without raw transport copy. This rule does not authorize feature-local skeleton systems.
- The alpha.65 live sheet inventory is a permanent routing owner, not an informal list. Every active bottom-origin surface is classified as canonical draggable/free-settle, intentionally fixed, or an interaction-specific exception; a new surface must enter that inventory and may not acquire a feature-local responder. Address Search is a draggable text/search surface: it waits for the current `WaflInputSheet` presentation-ready boundary before focusing, while header drag and result-body scrolling remain independent. Automation records `PHYSICAL_GESTURE_NOT_INFERRED`; owner iPhone remains the physical gate.
- Size, Color, and Spec Item direct creation are one reusable-create family. Their parent choosers use the exact shared `WaflReusableCreateEntryAction` (`+ 직접 만들기`) with one icon, label, typography, spacing, hit target, position, and pressed/disabled grammar. `WaflReusableCreateForm` owns the child `< 기본 …` row and `WaflSheetValueField` name surface; the three child routes use the same sheet-body inset while Color alone owns the palette and read-only colour metadata. A child creator has no footer or body create CTA; empty/invalid state disables the registered native/minimal-accessory confirm without changing the input geometry.
- A source field keeps identical participating geometry while its child PICK/INPUT is open. Inactive and active-sheet-open states have the same width, minimum height, padding, radius footprint, and surrounding gaps; only tint, existing hairline colour, icon, or text emphasis may change. This applies to Overview reel/date fields, Materials reel/partner fields, and Production selection fields as one extension of the focus-neutral single-line rule.
- Production and Materials share `WaflSectionCategorySwitch`, `WaflCompactEntityCard`, `WaflCompactField`, compact summary/action-row, and delete-action presentation owners. Production uses one outer section with `기본 공정 / 추가 공정`; the trailing action is contextual, so Basic exposes only its order lifecycle action family and Additional exposes only add. Production's collapsed summary is one Material-style line containing authoritative `수량 · 금액`; unit cost remains in the field body and is not repeated in the summary. Selection labels, values, underline affordance, wrapping, chevron spacing, expand/collapse, divider, and delete slots remain semantic shared owners rather than Production-local lookalikes. Accent remains type identity and never lifecycle state.
- Production basic-process order lifecycle mirrors the current Material action semantics while retaining process-domain storage: `ready → in_progress → completed`, with `in_progress → ready` cancel. Request requires a real factory, positive WorkOrder total, and positive integer-won unit labor cost. Request locks Basic fields, cancel restores draft editing, completion is terminal, and Additional Process receives no order lifecycle in this bounded delta.
- Production labor cost reuses the integer-won semantic owner and `number-pad`; decimal drafts, paste, validation, and persistence are forbidden. Factory and Additional memo share one 100-character multiline owner/config and render the live `N / 100` counter while editing. Eligible-partner reels stage the first eligible real partner for new selection; a zero eligible partner list renders a stable empty state, never invokes `scrollToIndex`, keeps V disabled, and keeps X/back available. New Process selection remains the intentional `미지정` exception.
- Production keeps one active canonical `WaflReelPickerSheet` invocation for Factory, Process, or Partner. Each route inherits the Unit picker's `reelAdaptive` sizing, 44-point header drag zone, free-settle release, atomic entrance, and separation between reel-body value scrolling and header sheet dragging. A required Partner choice with no current value stages the first real eligible partner before presentation so visual center, reducer value, initial index, and immediate V state agree; Process creation intentionally retains its `미지정`/disabled-V exception.
- Production mutations re-read the authoritative process projection inside the serialized queue before every command. The command uses the current entity version and persisted process identity; the unique factory role may reconcile a stale captured card to the sole current factory row, while an unresolvable Additional identity fails safely without creating a row. Runtime physical QA must use the alpha.65 Production capability profile; an alpha.64 external gate 404 is not a process repository `not_found`.
- `WaflMetricField` owns the common outer metric tile and the same inner `ValueSurface` for editable and read-only values. Editable child controls alone provide one thin underline; matrix-derived total quantity uses the same inner surface with underline zero and no edit handler.
- Definition rows use a consistent label/value hierarchy, touch/read height, and divider inset.
- Primary irreversible business actions retain their domain hierarchy and are not converted into generic tiles.

### Mobile input component routing

| Input responsibility | Current canonical owner | Boundary |
| --- | --- | --- |
| Sheet root, gesture, sizing, scroll, keyboard, footer, lifecycle | `WaflInputSheet` | Every active bottom-origin WAFL input surface |
| Labeled editable/read-only sheet field, help/error display | `WaflSheetValueField` | Composes the focus-aware primitive; domain validation stays outside |
| Native text entry inside a sheet | `WaflSheetTextInput` and `WaflSheetFocusBlock` | Registers semantic field geometry with the sheet focus owner |
| Single-choice/numeric reel and direct-mode switch | `WaflReelPickerSheet`, `WaflInputModeSwitch` | `reelAdaptive`; reel scrolling and sheet dragging remain separate |
| Live inline edit | `ControlledInlineEditValue` | Overview, Materials, Size/Color and later live Maker authoring |
| Choice and option grids | `WaflChoiceButtons`, `WaflOptionGrid` | Typed staged choice semantics |
| Numeric draft/commit | `mobileDisplay.ts` plus the relevant domain precision/conversion owner | Material scale and Finished Spec cm/inch are not copied into generic UI |
| Search or developer connection | Intentional local input | Different lifecycle; raw `TextInput` alone is not a consolidation reason |
| Historical/showroom inline fields | `InlineEditableFields` | `ProductionCardMock` reference only; forbidden as a new live Maker owner |

New sheet forms search this matrix before composing label, input, focus, read-only, help, or error grammar locally. `WaflSheetValueField` owns presentation and focus registration only; feature-specific normalization, validation, mutation, and reconciliation remain with the typed domain owner. Numeric inline and numeric sheet controls remain separate interaction components while sharing `normalizeNumericDraft`/`normalizeNumericCommitValue` and their domain precision policy.

## Responsive and accessibility rules

Phone is portrait-first. Tablet supports portrait and landscape using useful width without becoming compressed desktop administration. Action tiles cap and wrap rather than stretch. Horizontal tab rails and data tables may scroll; first/last content keeps shell alignment. Accessible names, state, 44-point targets, readable input type, non-color state cues, and sheet return behavior are required.

### Document viewer close and Finished Spec full-view ownership

- The native PDF gesture surface and the canonical exit have separate sibling layout planes. A
  sticky bottom WAFL primary action labeled `닫기`, with a minimum 44-point target and accessible
  name `작업지시서 보기 닫기`, exits to the current WorkOrder Document context. The visible top
  back affordance and explicit previous/next page buttons are not active viewer grammar; a passive
  page indicator may remain synchronized with vertical scrolling.
- Finished Spec full view has one vertical scroll owner: the `WaflInputSheet` body. The table
  expands all POM rows, reports `총 N개 항목`, and derives any quiet below-content affordance from
  actual body scroll metrics. A single selected Size expands into remaining table width; multiple
  Sizes retain the canonical horizontal frozen-axis behavior. The X/V footer remains outside and
  sticky to that body scroll.

## Ownership discipline

Before adding visual code, classify the responsibility as `REUSE`, `EXTEND`, `EXTRACT`, `NEW`, or `INTENTIONALLY LOCAL`. Same-semantics screen gutter, major card, section gap, action tile, and typography roles have one active owner. Local arbitrary substitutes in a new tab or alpha.65+ feature are a completion blocker.

The mechanical alpha.64 audit found 218 repeated literal groups. That count is context, not a mandate for indiscriminate replacement. This contract requires semantic convergence in the current Maker six-tab presentation scope while preserving bounded domain-specific literals and historical evidence.

## Owner IA simplification review variant

Status: `OWNER_PHYSICAL_REVIEW_REQUIRED`.

- `WaflMetricGrid` owns a two-column normal-phone metric layout and promotes to four columns only when each cell retains the canonical readable minimum width. Metric cells use the shared `64` minimum height and the section-card content width without a second nested gutter.
- Definition-row groups use one semantic divider inset. Normal rows in one group do not invent row-specific widths; a separately emphasized total surface may use its own explicit semantic separator.
- `WaflMetricField` owns one metric surface and geometry. Its child inline-control owner supplies exactly one thin editable underline; the metric wrapper does not add a second underline. Read-only and derived values such as total quantity keep the same surface without an underline.
- `WaflFrozenAxisTable` owns the shared presentation-only matrix grammar. In the main card the left label column is fixed while the header and body share horizontal Size scrolling; there is no nested vertical main-card scroll. In full view the corner, Size header, and left labels remain frozen on their respective axes while x/y body scrolling is synchronized.
- Editable frozen-table cells use one geometry-preserving presentation in Size/Color and Finished Spec. Focus may change the thin underline color, text/caret emphasis, or an inset-only surface tint, but it never changes outer width/height, row/column position, grid-border position, padding, or participating border width. A large rounded outer focus box is forbidden. The cm/inch display toggle continues to change formatting only; both editable modes use the same focus grammar and only locked/read-only cells omit the underline.
- The earlier owner-approved Finished Spec inch cell is the visual baseline for editable frozen-table numerics. Its canonical underline is a short, bounded, centered value-surface affordance with clear breathing room from both cell borders; it must not expand into a near-full-width second grid line. Finished Spec cm/inch and Size/Color quantity use that exact same shared surface. The line length is independent of whether the value is `0`, `-`, an integer, or a fractional inch. Focus changes color/tint only and never underline length, thickness, inset, or participating geometry, while genuinely locked/read-only cells omit it.
- That same shared surface owns the vertical relationship: its underline remains separated from the frozen-table bottom grid border by one consistent nonzero visual gap. Finished Spec cm/inch and Size/Color quantity inherit the same bounded value-surface height and centered row placement; neither a local renderer nor focus state may move the line toward the grid border.
- Size and Color use one default-expanded `색상·사이즈` matrix card. Compact 44-point `사이즈` and `색상` header actions use ruler and palette semantics and open the unchanged selection flows without putting counts in buttons. Five or fewer Color rows stay inline; six or more show the first five plus `전체보기`. Size count never triggers full view.
- Finished Spec is default-expanded and reuses the frozen-axis owner. Five or fewer POM rows stay inline; six or more show the first five plus `전체보기`. Size count never triggers full view, and WorkOrder Size source-of-truth and measurement mutation ownership remain unchanged.
- The combined Materials presentation uses a same-page category switch, not a second global tab bar. Its Fabric and Accessory count badges use the typed `WAFL_THEME.badge.fabric` and `WAFL_THEME.badge.accessory` semantic roles. Only the selected typed list renders, and one shared 44-point trailing plus opens that category's existing add flow.
- The selected material category uses the normal full list and existing paging behavior; there is no presentation-only four-card clipping. Fabric and Accessory remain separate typed domain/API/service entities.

These review variants change presentation only. WorkOrder mutation, Size/Color source-of-truth, batch X/V, hard delete, quantity synchronization, and material lifecycle owners are unchanged until physical review accepts the visual result.

## Alpha.64 Spec Catalog / Sheet review variant

Status: `OWNER_PHYSICAL_REVIEW_REQUIRED`.

- Finished Spec uses the table corner label `스펙 항목 〉` as the entry to the same-company reusable spec-item catalog. Selection is locally staged; X is zero WorkOrder mutation and V emits one logical batch command and one transaction.
- An editable draft keeps that same `스펙 항목 〉` entry in the Finished Spec empty state. Existing POM rows, saved-template application, a pre-existing measurement aggregate, and major-category presence are not prerequisites for opening the chooser. Major category scopes WAFL recommendations only; without it the chooser explains how to unlock recommendations while category-neutral company items and `직접 만들기` remain available. Issued/locked surfaces remain read-only.
- Catalog rows are reusable company authoring data. WorkOrder POM rows and saved-template POM rows remain independent historical snapshots, so catalog rename/deactivation never rewrites issued or existing snapshot display values.
- The WorkOrder feature tab rail is the only sticky element inside the detail page shell. The list/back control and product identity summary scroll away; the global WAFL/company header remains owned outside the detail scroller.
- An authenticated full-screen document viewer is an app-level reading surface, not a staged input sheet. It owns one safe-area header/back action, the actual native PDF page canvas, a stable `현재 / 전체` page indicator, explicit previous/next controls, vertical page navigation, bounded zoom, and a bounded retry state. Scroll-driven page changes and button-driven renderer jumps update the same page state; endpoint controls remain disabled. Closing it restores the existing Document-tab context. It never substitutes an external browser, a public share URL, or a raw object URL for authenticated in-app viewing.
- Document actions are role-specific. `보기` reuses the authenticated native viewer. `공유` alone creates one controlled public `/v` link and sends that URL exactly once in restrained business copy. `저장` downloads the workspace-authenticated internal PDF to a verified temporary local PDF and opens the native file/save surface without Safari, a public token, raw R2, or a secret-bearing URL; temporary bytes are removed after handoff. Share/QR metadata uses one row each for creation, expiry, last access, and access count rather than punctuation-compressed prose.
- All long Maker editors using `WaflInputSheet` inherit the same draggable detent, scroll-body, fixed-footer, safe-area, keyboard, and cancel semantics rather than implementing local sheet chrome.
- Reusable Size, Color, and Spec Item chooser creation uses the shared parent action `+ 직접 만들기`. Domain record creation such as fabric/accessory add keeps its domain action label.

## Alpha.68 WAFL Decision and Alert feedback owners

- A binary product decision uses the normal `WAFL INPUT` chrome, one two-row option reel, a safe opening option, and one footer V. It has no footer X: backdrop, system back, drag dismissal, and safe+V all resolve as zero mutation; the action option plus V invokes the existing callback exactly once.
- Decision labels describe real actions (`취소/확정`, `유지/삭제`, `유지/해제`, `유지/미지정`) and never use generic `예/아니오`. This does not change ordinary editor sheets, whose staged X/V contract remains canonical.
- A transient success, warning, or error is one centered, buttonless `WAFL Alert` card with a default lifetime of about 1.2 seconds. Persistent validation remains inline. Loading is not a timed alert: it keeps the existing centered spinner card until the owning command explicitly completes.

## Alpha.69 active-sheet decision and processing lifecycle

- Standalone binary decisions continue to use `WaflDecisionSheet`. A destructive decision requested while `WaflInputSheet` is already active must reuse `WaflDecisionChoiceBody` inside that same Modal: the body changes to question/helper/reel/V and cancellation restores the prior chooser and staged selection.
- The active-sheet decision never mounts `WaflDecisionOverlay`, never presents another React Native Modal, and defaults to the safe option. Safe+V mutates zero; action+V invokes the existing command owner once.
- A command whose blocker must precede expensive preparation enters pending synchronously, commits the presentation across the shared frame boundary, then begins fetch/mutation. Artificial delay is forbidden; success, failure, stale identity, and unmount paths all clear the owning pending state.

## Alpha.65 visual spec selector variant

Status: `OWNER_PHYSICAL_REVIEW_REQUIRED`.

- The Finished Spec chooser is a visual spec selector for the canonical upper, lower, outer, and dress categories. One non-interactive normalized garment diagram owns silhouette and measurement feedback; only the four-column option grid is interactive.
- Every mapped WAFL-provided item uses its stable system spec key and can render a real start/end measurement span, anchor dots, a solid or dashed guide, an optional authored connector, and its canonical Korean display label. Multiple staged selections remain checked in the grid while the most recently activated mapped item alone receives the warm preview. An unmapped company/custom/current item remains fully selectable in the grid and never receives a fabricated diagram line.
- `상의` uses a long-sleeve silhouette. `하의`, `아우터`, and `원피스` use their corresponding garment definition. `기타`, legacy `셋업`, and any unsupported category are intentionally grid-only.
- `WAFL 제공`, `우리 회사`, and retained `현재 사용 중` candidates all route through the same four-column wrapping grid and the existing X-zero/V-one-batch staging. Company rename/deactivation and shared `+ 직접 만들기` remain available without adding diagram hit targets.
- New Overview category authoring retires `셋업`; persisted setup WorkOrders remain readable and may explicitly move to another category. This presentation change never deletes, migrates, remaps, or rewrites existing Finished Spec rows or values.
- Physical fidelity review supersedes the first generic annotation layout. The shared renderer and selected-state model remain canonical, but upper/lower/outer/dress each own hand-authored technical flat geometry: explicit measurement polylines, optional extension lines, short rail connectors, and bounded label rectangles. No midpoint-to-rail or shortest-path fallback may generate a connector for a mapped item.
- Labels live on deliberate top/left/right/bottom rails and connectors remain local to their measurement. Connector crossing through an unrelated span, long diagonals through the garment center, and wireframe/spider-web presentation are forbidden. Inactive items keep only their neutral Korean label index: their full span, extension line, connector, and endpoint dots are absent. Selection reveals only that item's authored warm geometry and never changes garment geometry. The grid remains the only selection control.
- The diagram uses a compact bounded footprint so its complete technical flat and the first useful four-column grid rows coexist in the normal sheet body without a second nested vertical scroller. This fidelity variant remains `OWNER_PHYSICAL_REVIEW_REQUIRED`; screenshot evidence is a pre-handoff rejection gate, not owner acceptance.
- The garment base is an asset-first front/back pair. Upper, lower, outer, and dress each own two fixed repository-authored technical-flat SVGs: left is front and right is back, for eight authored views total. SVG paths and their TypeScript runtime mirrors remain exact; bounded owner-reviewed reauthoring updates both together. The shared renderer must not procedurally generate, infer, mirror, or alter a garment silhouette.
- Rendering order is `STATIC FRONT/BACK GARMENT PAIR -> ONE DYNAMIC MEASUREMENT OVERLAY -> four-column GRID`. Static views have no selected colour, measurement label, connector, code, or interaction. Stable system-code overlays remain category-authored and selection changes only the focused explanation; garment geometry is identical for zero, one, or multiple staged selections. Debug axes, construction nets, skeleton guides, and garment-construction measurement lines are forbidden.
- The garment-only diagram is deliberately decluttered: one balanced front/back pair with zero measurement label pills, spans, endpoint dots, extension lines, connectors, center axes, or construction nets. One previewed item alone may render its complete measurement overlay and one label on its stable authored `front` or `back` side. The opposite side stays quiet, and unpreviewed geometry never remains underneath it.
- The diagram is now a focused preview, not a plural selection summary. Opening the chooser shows only the static garment. Toggling one mapped WAFL item on keeps the full grid staging but previews exactly that one item; toggling another mapped item moves the preview without clearing either check. Turning the previewed item off, or toggling an unmapped company/custom/current item, returns to garment-only. X and V continue to own the unchanged staged batch semantics.
- All eight static technical-flat views use proportion-preserving uniform scale plus translation only. Each view contains one conventional pair of sleeves or trouser legs, so upper/outer/dress cannot read as four-armed and lower reads as normal front/back trousers. Quiet garment construction detail stays in the deep-navy family. Every one of the 55 stable mapped spec keys owns one documented `front` or `back` route; measurement overlay cardinality remains zero or one and a label/connector exists only for the active preview. This front/back variant remains `OWNER_PHYSICAL_REVIEW_REQUIRED` and automated screenshots never infer owner acceptance.
- Upper, outer, and dress front/back assets use one continuous authored outer silhouette per view (with an optional separate collar construction path) so neckline, shoulder slope, shoulder point, sleeve head, sleeve and body read as one garment. The armhole is a quiet construction seam rather than a second closed sleeve/body outline. Lower front/back assets remain the accepted byte-stable baseline. This shoulder/armhole fidelity refinement remains `OWNER_PHYSICAL_REVIEW_REQUIRED`; automated source-shape checks and rendered evidence are rejection gates only.
- The narrow neckline/pocket fidelity continuation keeps that architecture and geometry ownership. Upper and dress front/back use a simple symmetric round neckline; outer front/back use a calm rounded neck opening with quiet curved collar construction instead of forced notch/spike geometry. Outer pockets are a symmetric axis-aligned straight pair and remain subordinate to the silhouette. Lower stays byte-stable. These authored-asset assertions are automated rejection gates only and the variant remains `OWNER_PHYSICAL_REVIEW_REQUIRED`.

## Alpha.66 compact pre-issue readiness action

Overview places one compact readiness row immediately after 비용 구성. A nonzero canonical issue collection uses the quiet warm-accent `발행 전 확인 N건` action with a chevron; zero uses the compact positive `발행 준비 완료` state. The action never embeds a top-three preview. Its read-only `WaflInputSheet` renders the complete current issue collection with ordinary scrolling and close grammar. Count and sheet membership share the same server-canonical array. Actionable rows show a quiet current-tab destination based on stable issue code; unknown issues remain visible without a fabricated destination.

Readiness is version-reconciled, not locally counted. A successful readiness-relevant mutation that advances the WorkOrder entity version invalidates any detail projection whose canonical `readiness.basedOnVersion` trails that version. The shared mutation/query controller fetches and publishes one current canonical detail projection; Overview count and the open Sheet therefore continue to read the same refreshed `readiness.issues` array. Failed mutations do not create refresh success, and screens must not increment, decrement, or rebuild a second issue counter.

## Alpha.67 post-clean-base input and reconciliation grammar

Fabric and Accessory share the Basic Process memo character-count presentation owner. `사용부위` is a hard 30-character field and `메모` is a hard 100-character field in both create-sheet and same-position inline editing. The counter is `N / maximum`, is derived from the staged value, and never substitutes silent client or server truncation.

After Size or Color removal, the visible frozen-axis projection must publish one reconciled matrix: cells, row/column/grand totals, WorkOrder total, revision total, and Finished Spec Size columns advance together. A stale footer total is not an acceptable intermediate UI state after command success.

## Alpha.68 boundary-save sheet geometry

Draft input is locally immediate and network persistence is boundary-owned; a completed keystroke or
picker V must not trigger an idle-timer save. Overview pickers and Material quantity pickers keep the
compact card's original field geometry while their canonical WAFL INPUT sheet is active. They do not
replace the card row with a full-width editing surface. WorkOrder creation uses the existing keyboard-
adaptive sheet owner: focus raises it, keyboard dismissal restores the pre-keyboard resting geometry,
and repeated focus cycles cannot accumulate position drift. Create, Copy, and Reorder share one centered
creation-processing blocker; it blocks duplicate commands until the authoritative created core opens.

Single-line sheet inputs may opt into native `blurAndSubmit` without changing the default field owner.
The current opt-in is limited to the new Recipe product-name field: keyboard Done/V blurs and dismisses,
the keyboard-adaptive sheet restores its prior resting geometry, and repeated refocus cycles do not drift.
The create sheet owns one entrance-focus token per visible session. Once consumed—or explicitly dismissed
by Done—that token cannot focus the native input again; only a later user press or a new sheet session may
reopen the keyboard. A dirty Production subsection transition uses the shared central save blocker until
its real flush resolves; a clean transition renders no blocker.

## Alpha.66 WorkOrder identity badges and list filter

Create and detail share one WorkOrder-character semantic owner with `본생산 / 샘플`, but presentation follows context. Create uses the labeled form-sized `작업 구분` variant and fresh `샘플` default. Detail uses a compact two-segment grouped-button variant anchored at the hero text area's top-right: its visible height follows the badge family, its equal-width segments and smaller grouped radius distinguish action from pill badges, and the canonical minimum touch area is preserved invisibly. The pair never drops below the title or returns to full width. Workflow status remains the single strong badge and is positioned directly below the representative image in detail. WorkOrder identity is secondary: the duplicate detail Sample pill is absent because the interactive control already communicates character; applicable `N차 리오더` and `재작업` pills remain, while list-card identity badges remain unchanged. A passive source-title/lineage sentence is not header copy; source data stays in the read model until a future actionable relation is approved. Identity filtering uses a separate shared WAFL INPUT action/sheet with a single-choice `전체 / 본생산 / 샘플` group and an independent multi-select `리오더 / 재작업` group. Zero to three removable active chips may sit near search, but they never become a second persistent rail. The filter surface reuses the canonical staged X/V, sheet, choice, touch-target, and accessibility owners.
## Alpha.68 create-sheet keyboard and Modal blocker parity

- A keyboard-enabled `WaflInputSheet` snapshots its settled offset at the keyboard-session entrance.
  Native hide restores that offset unless the user dragged during the session; field-reveal expansion is
  not a restore prerequisite.
- A sheet-hosted native `Modal` that needs a processing blocker renders the existing
  `WaflActionProcessingBlocker` inside that Modal. A second screen-local blocker is forbidden.
- Processing feedback that needs helper copy sends title and helper through the shared feedback owner;
  clean transitions render no blocker.

## Alpha.68 intrinsic keyboard geometry stabilization

- Adaptive body height is intrinsic child content plus the static semantic end gap. Keyboard inset is
  transient scroll/reveal space and must never be written back into the adaptive medium-height owner.
- A delayed scroll `contentSize` callback after native hide cannot alter the pre-keyboard detent.
  Three repeated sessions return to the same resting geometry unless a deliberate sheet drag made a
  new offset authoritative.

## Alpha.68 text-entry keyboard reveal clearance

- Text-entry WAFL INPUT sheets use the theme-owned `textEntryFocusRevealClearance` (`72`) for the
  focused semantic field block. Generic focus context remains `56`; numeric keypad context remains
  `112`. Reel, Decision, and non-text sheets do not inherit the text-entry token.
- Reveal is `max(0, desired clearance - current field-to-keyboard gap)`. Genuine intrinsic overflow
  may scroll first; transient keyboard padding is not forward-scroll capacity. A short form therefore
  lifts only by its missing clearance instead of remaining visually pinned to the keyboard.
- Keyboard reveal never changes intrinsic/adaptive resting height. Native hide restores the exact
  pre-keyboard settled offset unless a deliberate user drag made the current geometry authoritative.

## Alpha.68 text-entry visual-coordinate normalization

- Focused field, body viewport, keyboard top, and the sheet anchor are compared only after conversion
  to the same visual-window coordinate space. The sheet's known animated top is the anchor: if native
  measurement omitted the transform, the missing translation is added once; if measurement already
  includes it, correction is zero. Feature call sites must not compensate with local offsets.
- Real intrinsic overflow scrolls first and only the remaining shortfall lifts the free-settled sheet.
  A bounded two-frame post-lift remeasurement may converge stale animation-frame geometry; it may not
  increase the `72` semantic clearance or alter keyboard-hide restoration and user-drag ownership.

## Alpha.68 mounted-ref reveal measurement

- The focused semantic block, live body viewport, and animated sheet are measured from their actual
  mounted host refs. A numeric native handle is a bounded compatibility fallback, never the primary owner.
- Zero, non-finite, non-positive, clearly out-of-window, stale-focus, and stale-sheet frames are invalid.
  One next-frame ref remeasure is allowed before one fallback attempt; invalid frames never silently
  become a zero-rise decision.
- The shared `72` clearance, visual-window anchor correction, scroll/rise policy, keyboard-hide restore,
  user-drag authority, and non-text sheet behavior remain unchanged.

## Alpha.68 direct-input keyboard mode

- Direct text-entry `WaflInputSheet` consumers opt into one semantic `directInput` mode with explicit
  editing, confirming, cancelling, and closing session ownership. Keyboard show selects one shared
  content-aware intermediate detent from stable window, keyboard, header, intrinsic-body, safe-area,
  and resting geometry; only insufficient small-device geometry clamps to `offset 0`.
- Normal direct-input fields use native Next/Done and attach no accessory native ID. Only a focused iOS
  keyboard capability without native Return/Done receives the per-session accessory ID and one minimal
  action: `다음` through mounted editable refs when a later field exists, otherwise `완료` through the
  canonical confirmation guard. There is no common Previous/Next/Done bar. Read-only fields are absent
  from the registry and Android renders no accessory.
- Direct-input ScrollViews persist every internal tap and do not dismiss on scroll, so helper, blank-space,
  control, and input-transfer taps retain the keyboard/focus session. Non-direct sheets preserve the prior
  handled-tap behavior; backdrop and drag dismissal remain separate canonical owners.
- Single-line native return resolves to next for intermediate fields and done for the last/single field.
  Every direct-input single-line field uses submit-before-blur. Invalid final submit therefore preserves
  keyboard, focus, and geometry; only an accepted canonical confirm blurs and dismisses. Multiline newline
  semantics remain.
- The content-aware keyboard detent is the sole direct-input sheet-Y owner. Mounted-ref reveal is limited
  to body scrolling and cannot invoke a secondary sheet rise. Repeated focus or validation within one
  keyboard session does not rerun the detent animation.
- Keyboard-visible header drag has only two releases: existing cancel/dismiss with mutation zero, or
  snap-back to the current keyboard detent. Gesture-active keyboard hide suppresses auto-refocus;
  confirming, cancelling, closing, unmount, and background also never reopen it. A true unexpected hide
  during editing retains one bounded refocus.

## Alpha.68 direct-input canonical close and footerless presentation

- Backdrop cancellation and parent/nested `visible=false` use one mechanical close owner. Direct-input
  close suppresses restore, blurs the mounted field, dismisses the keyboard, invalidates the active open
  generation, and closes the sheet. Only the user-cancel reason invokes `onCancel`; programmatic close
  proceeds to `onAfterClose` without a duplicate business callback.
- A direct-input backdrop claims cancellation on first touch and keeps its press fallback idempotent.
  Large-drag cancellation uses the same owner; small-drag snap-back and internal-tap persistence are unchanged.
- Direct-input keeps its registered confirm owner but has no bottom action footer, footer height, or footer
  readiness dependency. Reusable direct Size/Color/POM forms also have no duplicate body `추가`; native Done
  or the minimal keypad action calls the same canonical confirm.
- Processing presentation is opt-in. New Recipe uses `replaceSheet`: the mounted form state remains available
  for failure recovery while its surface, interaction, accessibility descendants, and minimal accessory are
  hidden behind the central blocker. Non-opt-in processing presentation remains unchanged.

## Alpha.68 close-animation ownership

- Close claims dismissal and cancelling/closing session ownership before input blur or keyboard dismissal.
  A keyboard-hide event owned by confirmation or close cannot restore a prior detent, reveal a field, or
  refocus the keyboard.
- While dismissal owns the sheet, ordinary settle animations are rejected so the exit animation cannot be
  stopped by restore/reveal work. One close-operation identity and idempotent finalizer own teardown,
  callback cardinality, and the after-close handoff; timers are not an alternate completion owner.
## Alpha.69 destructive-choice scroll and processing lifecycle

An active `WaflInputSheet` Decision keeps the canonical WAFL INPUT question/helper/two-row reel/V body but makes the parent body non-scrollable, including content-fit overflow states. The reel `FlatList` is therefore the sole vertical scroll owner. Visible processing blockers acquire state and cross the shared two-frame presentation boundary before work starts; fixed-duration display delays are forbidden.
