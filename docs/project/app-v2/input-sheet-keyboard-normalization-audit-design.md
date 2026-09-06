# WAFL INPUT / Sheet / Keyboard Normalization Audit and Canonical Design

Status: audit/design complete; static migration continuation `ALPHA73D_SEMANTIC_COORDINATE_NORMALIZATION_QUICK_REVEAL_AND_NUMERIC_KEYPAD_FIX_IPHONE_QA_REQUIRED`

> A73D semantic-coordinate note: prepared focus geometry is canonical only after native measurement relative to the
> Sheet body-content ancestor. Immediate-parent `onLayout` coordinates are never consumed as body-local targets. Long
> Quick Delivery bodies keep body-scroll-first reveal in the keyboard appearance transaction, and numeric direct mode's
> required semantic composition is input + fixed auxiliary slot + mode switch. Owner physical PASS is not inferred.

This document is the alpha.73C audit result and normative design boundary. The original audit changed documentation and permanent contracts only. Phase 1 now executes only the approved reusable-create initial-focus delta; later phases remain unimplemented.

> A73D direction note: `static-sheet-architecture-migration-audit-design.md` supersedes the future `Sheet Drag Owner` and
> free-settle direction in this document. This file remains authoritative for the live A73C input/focus/action inventory and
> implemented behavior until the phased static migration lands.

## 1. Audit baseline and method

- LIVE source is the authority. The retained alpha.73 dirty continuation and the accepted A73B6 keyboard and Drawing changes remain intact.
- The inventory was generated from TypeScript JSX/call-expression traversal and then checked against route composition and user-facing labels.
- Product-source totals are `WaflInputSheet 26`, `WaflReelPickerSheet 8`, `WaflSheetValueField 15`, direct `WaflSheetTextInput 4`, `WaflSheetFocusBlock 2`, and raw JSX `TextInput 6`.
- The raw `TextInput` total includes the one canonical implementation inside `WaflSheetTextInput`; therefore five feature/component raw owners remain outside that wrapper.
- After Phase 1, focus/lifecycle signals are `8` explicit `.focus()` calls, `31` `requestAnimationFrame` calls, and `7` keyboard listeners. The audit baseline had `11` focus calls; the three approved reusable-create prepared callbacks account exactly for the reduction.
- The physical reference is Overview `시즌 -> 직접 입력` and `세부 품목 -> 직접 입력`. Both open a fully usable direct-input Sheet without an initial-focus request. The keyboard starts only after the user taps the field.

## 2. Exhaustive `WaflInputSheet` inventory

| # | File / owner | User-facing surface | Family | Initial focus | Presentation / action ownership | Audit decision |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `WaflDecisionSheet` | central destructive Decision | PICKER | none | fixed reel body, safe choice then V | keep standalone Decision owner |
| 2 | `WaflPairedOptionReelPickerSheet` | paired option reel | PICKER | none | reelAdaptive, X/V | keep |
| 3 | `WaflReelPickerSheet` | option/numeric reel and numeric direct entry | PICKER / NUMERIC_TEXT | raw autofocus only after direct-keypad mode mounts | reelAdaptive, X/V; numeric accessory follows keypad capability | keep as intentional PICKER-internal exception |
| 4 | `MobileWorkOrderExperience` | `저장하지 못한 변경` | PICKER | none | contentFit recovery choice | keep |
| 5 | `WorkOrderCreateSheet` | `새 레시피` | FORM_TEXT | prepared opt-in | footerless direct-input, native Done canonical create | `OPTIONAL_CANONICAL`; not Phase 1 |
| 6 | `QuickDeliveryAddressSearchSheet` | `주소 검색` | SEARCH_TEXT | after-open `.focus()` | default Sheet, debounced results, Search return label | normalize in Phase 3/4 |
| 7 | `QuickDeliveryFoundation` | 출발지/도착지 `직접 입력` | FORM_TEXT | nested return intent only, with local rAF | footerless direct-input, nested picker/search | replace local rAF with one nested-return focus owner |
| 8 | `QuickDeliveryFoundation` | `퀵 전달 요청 미리보기` | PICKER | none | read-only preview | keep |
| 9 | `WorkOrderDocumentWorkbench` | `퀵 전달` | FORM_TEXT | manual | parent direct-input registry owns 기사명/연락처/메모 | keep current IA in minimum plan |
| 10 | `WorkOrderDocumentWorkbench` | `문서에 포함할 첨부` | PICKER | none | staged checkboxes and X/V | keep |
| 11 | `WorkOrderDocumentWorkbench` | `사이즈·색상별 수량` | PICKER | none | read-only expandable | keep |
| 12 | `WorkOrderDocumentWorkbench` | `작업지시서 공유` | PICKER | none | contentFit command confirmation | keep |
| 13 | `WorkOrderSketchEditor` | `텍스트 추가` | FORM_TEXT | prepared opt-in after session/geometry readiness | footerless direct-input; confirm commits one text element | `KEEP` while A73B lifecycle remains owner-gated |
| 14 | `WorkOrderListScreen` | `필터` | PICKER | none | staged filter choices | keep |
| 15 | `WorkOrderDetailOverview` | `발행 전 확인` | PICKER | none | read-only readiness | keep |
| 16 | `WorkOrderDetailOverview` | 원단/부자재 `추가` | FORM_TEXT / NUMERIC_TEXT / MULTILINE_TEXT | manual | one Sheet body, canonical fields and reel children | keep, audit in Phase 2/3 regression |
| 17 | `WorkOrderSeasonPickerSheet` | `시즌 직접입력` | MANUAL_TEXT | none | footerless direct-input | physical reference; keep |
| 18 | `WorkOrderDetailItemPickerSheet` | `세부 품목 직접입력` | MANUAL_TEXT | none | footerless direct-input | physical reference; keep |
| 19 | `WorkOrderReorderCreateSheet` | `리오더 만들기` | PICKER | none | content/read action | keep |
| 20 | `WorkOrderSeriesHistorySheet` | `작업 이력` | PICKER | none | read-only history | keep |
| 21 | `MeasurementTemplatePickerSheet` | `스펙 불러오기` | PICKER | none | selection and processing | keep |
| 22 | `CompanyTemplateSaveSheet` | `스펙 저장` | FORM_TEXT | manual | footerless direct-input, multiple editable rows | keep manual; Phase 3 action regression |
| 23 | `SpecItemSelectionSheet` child | `직접 스펙 만들기` / rename | FORM_TEXT | manual after Phase 1 | nested footerless direct-input | Phase 1 applied; explicit field tap |
| 24 | `SpecItemSelectionSheet` parent | `스펙 항목 선택` | PICKER | none | staged grid and same-Sheet Decision | keep |
| 25 | `StructureSelectionSheet` | Size/Color selection and reusable create | PICKER / FORM_TEXT | create child manual after Phase 1 | parent staged grid; child footerless direct-input | Phase 1 applied; explicit field tap |
| 26 | `WorkOrderSizeColorReadOnly` | matrix/spec full view | INLINE_EDIT / NUMERIC_TEXT | tap-activated | fullView Sheet owns vertical scroll; cells own inline edit/reel | keep; Phase 2/3 regression |

## 3. Reel, field, and raw-input inventory

### 3.1 `WaflReelPickerSheet` consumers

| Owner | Surface | Classification | Decision |
| --- | --- | --- | --- |
| `MaterialPartnerPickerSheet` | 거래처 | PICKER | keep |
| `WorkOrderMaterialEditor` | unit/value reel | PICKER / NUMERIC_TEXT | keep |
| `WorkOrderMaterialsReadOnly` | unit/value reel | PICKER / NUMERIC_TEXT | keep |
| `WorkOrderDetailOverview` | 대상/대분류 | PICKER | keep |
| `WorkOrderOverviewPickerSheets` | 세부품목 / paired season | PICKER | keep |
| `WorkOrderProductionAuthoring` | process/partner/status picker | PICKER | keep |
| `MeasurementCellEditor` | 완성 스펙 numeric | PICKER / NUMERIC_TEXT | keep |
| internal paired/numeric variants | option and keypad rendering | PICKER | one internal owner |

The numeric keypad path switches from reel to a newly mounted numeric field and uses raw `autoFocus`. It is not a general direct-input opening policy. It is a deliberate, user-triggered PICKER internal mode: `WAFL PICK -> 숫자 직접 입력`. It remains `KEEP` until Phase 3 supplies an equivalent explicit picker policy.

### 3.2 Canonical sheet fields

- `WaflSheetTextInput` registers the mounted native input, semantic reveal block, layout identity, direct-input order, return-key semantics, and minimal accessory eligibility.
- `WaflSheetValueField` supplies label/input/help/error as one semantic focus block. Read-only fields do not enter the editable registry.
- Direct `WaflSheetTextInput` callsites are numeric reel input, Material editor field, Address Search, and the internal field used by `WaflSheetValueField`.
- `WaflSheetValueField` callsites cover Recipe create; Quick driver, endpoint, address, contact and memo; Overview direct season/detail; reusable Size/Color/Spec creation; Company template save/rename; and Sketch text.

### 3.3 Raw JSX `TextInput`

| Owner | Route / role | Family | Why it bypasses sheet field | Decision |
| --- | --- | --- | --- | --- |
| `WaflSheetTextInput` | canonical internal native host | all Sheet text families | implementation boundary | keep |
| `ControlledInlineEditValue` | Overview/material/table same-position edit | INLINE_EDIT / NUMERIC_TEXT / MULTILINE_TEXT | not a Sheet form; active row replaces display in place | keep, later align action semantics only |
| `WorkOrderListScreen` | list search | SEARCH_TEXT | full-screen list header, not Sheet | keep raw owner; add explicit Search action policy in Phase 3 |
| `MobileConnectScreen` | DeveloperAutoConnect manual code | MANUAL_TEXT | isolated connection screen outside customer WorkOrder Sheet | keep isolated |
| `InlineEditableValue` | historical `ProductionCardMock` | INLINE_EDIT | showroom fixture only | P2 historical debt; never use as live owner |
| `CompactInlineEditableField` | historical `ProductionCardMock` | INLINE_EDIT | showroom fixture only | P2 historical debt; never use as live owner |

## 4. Autofocus inventory

| Callsite | Current mechanism | Decision | Reason |
| --- | --- | --- | --- |
| New Recipe | prepared Sheet callback -> ref focus | `OPTIONAL_CANONICAL` | opening intent is immediate naming; B4-B6 safety exists, but it is not the default family |
| Sketch Text | session-scoped prepared callback -> ref focus | `KEEP` | canvas tap explicitly begins a text-entry session; A73B1 prevents stale/nested focus |
| Direct Size | no opening focus; mounted shared field waits for press | `REMOVE` applied | user entered a catalog editor, not necessarily keyboard entry; matches manual reference |
| Direct Color | no opening focus; palette and field are initially keyboard-free | `REMOVE` applied | palette/control exploration is primary before color name |
| Direct Spec/POM create/rename | no opening focus; mounted shared field waits for press | `REMOVE` applied | catalog child presents first and waits for field tap |
| Address Search | `onAfterOpen` -> ref focus | `OPTIONAL_CANONICAL` | search is the sole task, but action semantics and lifecycle should be explicit |
| Quick direct return from Address Search | local focus intent -> local rAF -> detail-address ref | `NESTED_RETURN_FOCUS_ONLY` | valid return intent, but duplicate scheduling owner must move into shared nested handoff/focus policy |
| Numeric reel direct mode | mounted raw `autoFocus` | `KEEP` as PICKER exception | user explicitly changed into keypad mode; not a Sheet-open default |
| Controlled inline edit | tap activation -> rAF focus, second rAF only for numeric draft preparation | `KEEP` | activation itself is explicit focus intent; does not own Sheet presentation |
| historical mock inline fields | raw mount `autoFocus` | `REMOVE` if promoted; otherwise fixture-only | not a live product owner |

`AUTO_FOCUS_DIRECT_INPUT` is not an interaction family. Autofocus is a policy attached to a family and must be explicit, optional, generation-scoped, and presentation-ready.

## 5. Reference behavior and Direct Color root

Season and Detail direct input are smooth because they use the ordinary `WaflInputSheet` presentation, register the field, and wait for an explicit user tap before focus. Sheet entrance, body measurement, and drag readiness settle before any keyboard frame exists. The same Sheet still owns reveal and keyboard restoration after focus.

Before Phase 1, Direct Color differed in four source-owned ways:

1. Entering the custom route supplies `onPreparedForAutoFocus={() => nameInputRef.current?.focus()}`.
2. Prepared direct-input opening couples the first visible Sheet target to the keyboard frame before the user chooses whether to edit the name or inspect the palette.
3. Direct-input internal taps preserve the keyboard and the locked editing session may restore an unexpected hide.
4. While that keyboard is visible, header release may only dismiss the whole Sheet or snap back to the measured keyboard-visible offset; free-settle is not available.

The palette was therefore placed inside a keyboard-owned geometry even when the user was interacting with color controls rather than text. This was not a color-grid defect and required no Color-specific offset. Phase 1 removes those three prepared focus callbacks. The Sheet now opens at ordinary geometry with keyboard hidden; an explicit field tap enters the unchanged shared keyboard lifecycle. Phase 2 still owns keyboard-visible header drag normalization.

## 6. Responder and geometry ownership

Current source has one vertical Sheet body owner and one header drag owner:

- header `dragRegion` captures responder from touch-down while draggable and ready;
- body `ScrollView` owns vertical body swipes and is disabled only during an active header drag;
- horizontal rails/grids own only their local horizontal/control interactions;
- direct-input body taps use `keyboardShouldPersistTaps="always"` and `keyboardDismissMode="none"`;
- default sheets use `handled` tap persistence;
- body reveal consumes measured forward scroll first and Sheet rise only for residual occlusion;
- `translateY` remains the single root Sheet-Y value.

The structural responder split is sound. The active conflict is policy after header drag begins with a direct-input keyboard visible: `resolveWaflDirectInputDragRelease` replaces generic free-settle with dismiss-or-snapback, while `shouldRestoreDirectInputKeyboard` may refocus after an unclassified hide. The canonical direction is header drag -> explicit keyboard-dismiss reason -> no auto-refocus -> generic bounded free-settle. Body swipe remains body scroll and must never begin root drag.

## 7. Keyboard action grammar

| Family | Single field / last field | Intermediate field | Multiline | Numeric/phone without native Return | Search |
| --- | --- | --- | --- | --- | --- |
| MANUAL_TEXT / FORM_TEXT | `완료`, canonical confirm only where the form declares confirm | `다음` | newline preserved | one minimal `다음` or `완료` accessory | n/a |
| SEARCH_TEXT | n/a | n/a | n/a | n/a | `검색`, explicit search action |
| MULTILINE_TEXT | form action remains independent of focus | next is not forced | newline | optional external CTA, not newline replacement | n/a |
| NUMERIC_TEXT | semantic `완료` | semantic `다음` | n/a | minimal accessory supplies the same semantic action | n/a |
| PICKER | X/V applies picker draft | n/a | n/a | keypad completion returns to the same picker apply owner | n/a |
| INLINE_EDIT | `완료` means finalize that active value when configured | not a multi-field form by default | newline or explicit inline action | must expose a reachable finalization action | n/a |

Keyboard type must not decide the business meaning. It decides only whether native Return is available and therefore whether a minimal accessory is needed. Focus and blur must not change a CTA from `다음` to save, or from Search to dismiss.

Current gaps:

- Address Search labels native return `search`, but supplies no explicit `onSubmitEditing`; search actually runs from a 350 ms text-change debounce. The key is visual grammar without an Action owner.
- WorkOrder list search labels return `done` and has no explicit Search action; it is a live filter, so this can remain a dismiss-key policy but must be documented distinctly from SEARCH_TEXT submit.
- Direct-input normal keyboards derive Next/Done from the editable registry; numeric/phone keyboards use the same semantic navigation through the minimal accessory.
- Raw numeric inline inputs rely on explicit inline X/V or blur finalization rather than the Sheet accessory.

## 8. Quick Delivery ownership map

| Area | Current owner | Input / action | Nested route |
| --- | --- | --- | --- |
| Main editor | `WorkOrderDocumentWorkbench` -> `QuickDeliveryFoundation` | 기사명, phone 연락처, 메모; manual focus | main `퀵 전달` Sheet |
| Group/item context | `QuickDeliveryFoundation` | partner group horizontal rail, item list, preview button | main |
| Endpoint choice | `MaterialPartnerPickerSheet` | registered partner / unset / direct input | `picker` |
| Direct endpoint | `QuickDeliveryFoundation` | read-only postcode/basic address, detail address, phone contact, address-search action | `direct` |
| Address search | `QuickDeliveryAddressSearchSheet` | query, debounced result list, load-more, result select | `address` |
| Preview | `QuickDeliveryFoundation` | read-only request preview | `preview` |
| Nested transition | `useWaflNestedSheetHandoff` | close outgoing Sheet, two-frame presentation generation, open next route | all nested routes |
| Return focus | `QuickDeliveryFoundation.handleDirectAfterOpen` | generation/endpoint intent plus extra local rAF to detail address | address -> direct only |

### 8.1 Address Search state machine

```text
DIRECT --주소 검색--> ADDRESS_OPENING
ADDRESS_OPENING --onAfterOpen--> QUERY_FOCUSED
QUERY_FOCUSED --<2 chars--> IDLE(empty results)
QUERY_FOCUSED -->=2 chars + 350 ms--> LOADING
LOADING --success--> RESULTS | EMPTY
LOADING --failure--> ERROR
RESULTS --더보기--> LOADING_MORE --> RESULTS
RESULTS --result tap--> DIRECT_PENDING_RETURN_FOCUS
DIRECT_PENDING_RETURN_FOCUS --nested generation match--> DETAIL_ADDRESS_FOCUSED
QUERY_FOCUSED/RESULTS/ERROR --닫기--> DIRECT(no return focus)
```

The search icon is decorative within the input surface; `주소 검색` is the explicit route action from Direct Address; result cards select; `더보기` paginates. The native `검색` key is currently not an explicit transition. Phase 3 must choose either explicit submit Search or a clearly documented live-search return action, not leave focus/blur as accidental behavior.

### 8.2 Minimum normalization (A)

- Keep one Quick main Sheet and the current picker/direct/address/preview routes.
- Keep driver fields manual.
- Define Address Search as SEARCH_TEXT with explicit Search semantics.
- Move address -> direct detail focus from feature-local rAF into one nested-return focus policy.
- Preserve draft values, endpoint identity, and generation-safe handoff.
- Apply shared keyboard-visible header-drag behavior and action grammar.

### 8.3 Phased IA split recommendation (B)

After the minimum normalization is physically accepted, split the entry surface without changing the data model:

1. `Driver Info`: 기사명, 연락처, 메모.
2. `Address Direct Input`: endpoint, detail address, contact, partner-switch affordance.
3. `Address Search`: search task and result selection only.

Each route gets one presentation, focus, scroll, and action owner. Preview remains read-only. This reduces one long mixed registry and makes phone-pad, multiline, search, and nested return semantics independently testable. It is P2 product/IA work and requires a separate owner-approved package.

## 9. Canonical ownership architecture

### 9.1 Owners

| Owner | Owns | Must not own |
| --- | --- | --- |
| Sheet Presentation Owner | mounted/rendered/presented/open generation, entrance/close completion, sizing and local geometry publication | input focus, return-key business action |
| Focus Owner | editable registry, semantic block, current focus identity, optional initial-focus policy, nested return-focus intent | Sheet-Y animation, keyboard frame |
| Keyboard Owner | platform show/hide/frame/session reason, accessory capability, hide/restore eligibility | feature mutation, raw body scrolling |
| Body Scroll Owner | body metrics, user body scroll, focus reveal desired/applied scroll and returned residual | root drag and root Sheet-Y |
| Sheet Drag Owner | header-only gesture, free-settle/dismiss, user-set geometry | body swipe, field focus, business confirm |
| Action Owner | Next/Done/Search/picker V/form confirm semantic command and exactly-once guard | deciding geometry from focus/blur |

### 9.2 Dependency direction

```text
Feature route/state
  -> Sheet Presentation Owner
      -> Focus eligibility / presented generation
          -> Focus Owner
              -> Keyboard intent
                  -> Keyboard Owner (native frame/session)
                      -> Body Scroll Owner (apply available scroll, return residual)
                          -> Sheet Presentation Owner (minimum residual rise only)

Header gesture
  -> Sheet Drag Owner
      -> Keyboard Owner (explicit user-drag dismiss reason)
          -> Sheet Drag Owner (free-settle after hide; no refocus)

User/native/accessory action
  -> Action Owner
      -> Focus Owner for Next, or feature canonical confirm/search
```

No feature may call the Sheet-Y animation. Focus may request visibility but receives no translate handle. Keyboard may request a scroll/residual plan but cannot mutate business state. Action semantics are selected from the interaction family and field order, not from keyboard visibility or keyboard type.

### 9.3 Canonical invariants

- Sheet open is not keyboard open. Manual focus is the default.
- Autofocus is optional policy, never a family, and runs only after the declared presentation/prepared boundary.
- Body swipe is body scroll; header drag is Sheet drag.
- A keyboard-visible header drag should dismiss with reason `userDrag`, suppress refocus, then free-settle.
- Already-visible semantic field produces Sheet movement zero.
- Hidden field consumes real forward body capacity first and only residual Sheet rise.
- Keyboard hide restores pre-keyboard geometry unless user drag has claimed new settled geometry.
- Focus/blur never changes CTA meaning.
- Single/last is Done, intermediate is Next, Search is Search, and keyboard type only selects native vs minimal accessory representation.
- Screen-specific keyboard offsets, duplicate root ScrollViews, duplicate Sheet-Y owners, raw mount autofocus, and feature-local focus timers are forbidden.

## 10. Debt map

### P0 — first implementation risks

1. Direct Size/Color/Spec prepared autofocus: resolved by Phase 1 manual-focus application; physical acceptance remains owner-gated.
2. Direct-input keyboard-visible header drag has dismiss-or-snapback only; it cannot settle freely, and unexpected-hide restoration can reopen the keyboard.
3. Quick address return has a parallel feature-local `requestAnimationFrame` focus owner outside the nested presentation and shared Focus owners.
4. Address Search advertises `검색` without an explicit Search action transition.

### P1 — normalization debt

1. Interaction family and initial-focus policy are implicit combinations of props rather than one typed contract.
2. Search/live-filter/Done behavior is not documented at raw input boundaries.
3. Inline numeric and Sheet numeric use different completion surfaces without one capability-to-action policy document.
4. The current 11a keyboard section still describes the superseded four-point raw-delta didShow rule; A73B6 uses semantic visibility and an eight-point evidence token.
5. Current full inventory is not represented by a permanent contract until alpha.73C.

### P2 — product and historical debt

1. Quick Delivery mixes driver, endpoint, search, items, and preview in one parent experience; the phased three-surface IA should be separately approved.
2. `InlineEditableFields` and `ProductionCardMock` retain raw autofocus for historical/showroom use and must not be promoted.
3. Mobile connection and list search remain intentional raw inputs but need explicit boundary notes if their behavior changes.

## 11. Implementation phases

### Phase 1 — manual reusable-create focus (implemented; iPhone QA required)

- Remove prepared autofocus from Direct Size, Direct Color, and Direct Spec/POM create/rename only.
- Preserve New Recipe, Sketch Text, Address Search, Quick nested return, numeric reel, submit/confirm, geometry, drag, and API behavior.
- Prove palette/body interaction before keyboard, explicit field tap opens keyboard, native Done still confirms once, and parent nested return is unchanged.

### Phase 2 — responder and drag normalization

- Add one explicit keyboard-hide reason and change keyboard-visible header drag to dismiss keyboard then use generic free-settle without refocus.
- Keep body swipe scroll-only and backdrop/large dismiss cancel-only.
- Prove restore, user-set geometry, no drift, no hidden keyboard, and no duplicate Sheet-Y owner.

### Phase 3 — interaction family and action grammar

- Introduce typed family/focus/action policy at the shared input boundary.
- Normalize Search submit, native Next/Done, numeric/phone accessory, multiline newline, and inline completion without changing business commands.
- Preserve PICKER internal keypad semantics.

### Phase 4 — nested focus and Quick minimum normalization

- Replace Quick’s feature-local rAF return focus with one generation-scoped nested-return focus owner.
- Keep current Quick IA and local-only behavior while making address search state/action explicit.
- Validate all fields, phone keyboard, memo/newline decision, endpoint transitions, and preview.

### Phase 5 — approved cleanup / phased Quick IA

- Only after physical acceptance, remove obsolete compatibility props and update every callsite to typed family policy.
- If separately approved, split Quick Delivery into Driver Info, Address Direct Input, and Address Search.
- Remove historical raw owners only if their showroom contracts are separately retired.

## 12. Phase 1 implementation boundary

Checkpoint: `ALPHA73C_PHASE1_MANUAL_REUSABLE_CREATE_FOCUS_IPHONE_QA_REQUIRED`.

Exact source scope:

- `apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx`
- `apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx`
- shared policy/contract files only if needed to encode manual-default focus without changing other consumers
- targeted alpha.73C Phase 1 contract and canonical docs

Exact behavior delta:

- Direct Size, Direct Color, Direct Spec/POM create/rename open as usable Sheets with keyboard closed.
- Tapping the editable field focuses once and uses the existing shared reveal/keyboard owner.
- Direct Color palette, helper, preview, back action, and body scrolling work before and after field focus.
- Native Done/minimal accessory invokes the same canonical create/rename confirm exactly once.
- New Recipe and Sketch prepared autofocus, Quick nested focus, numeric reel autofocus, Sheet drag policy, action grammar, API, schema, and Drawing remain unchanged.

Permanent contracts:

- those reusable create callsites have no `onPreparedForAutoFocus` or raw `autoFocus`;
- reference Overview direct inputs remain manual;
- prepared autofocus remains present only for the explicitly excluded New Recipe and Sketch paths at this phase;
- no keyboard, detent, close, confirm, API, dependency, native, config, EAS, or migration delta;
- Canonical Verify increments and retains A73B1-B6 contracts.

Focused physical iPhone QA:

1. Open Direct Color: Sheet and palette are usable, keyboard stays closed.
2. Scroll/tap palette and small header drag before focusing: body/header ownership remains correct.
3. Tap color name: keyboard opens, field remains visible, palette selection remains intact.
4. Valid Done creates once; invalid Done keeps input; cancel creates zero.
5. Repeat Direct Size and Direct Spec/POM create/rename with the same manual-focus behavior.
6. Verify reference Season/Detail direct input unchanged.
7. Verify New Recipe and Sketch Text prepared autofocus unchanged.
8. Verify close/discard and black-screen regression zero.

## 12.1 Phase 2 implementation boundary

Checkpoint: `ALPHA73C_PHASE2_SHARED_FOCUS_LIFECYCLE_NORMALIZATION_IPHONE_REQA_REQUIRED`.

Phase 2 supersedes the temporary Phase 1 exclusions for New Recipe, Sketch Text, Quick nested return, and Address Search. The normalized lifecycle is now:

`Sheet presentation -> explicit field tap -> keyboard/reveal -> explicit blur or non-input interaction -> keyboard hidden while Sheet remains open`.

Canonical ownership changes:

- ordinary keyboard hide never schedules refocus; a later keyboard session requires another explicit field tap;
- body scroll and non-input body interaction dismiss the current field editing session, while header drag dismisses the keyboard and returns to generic bounded free-settle;
- one focus/keyboard generation receives one normal shared reveal; body measurement settling cannot create a second normal rise, while the existing didShow semantic safety reconciliation remains available for real occlusion;
- phone/number minimal accessory presentation is mounted from the registered capability inventory before first focus;
- field completion has explicit `form`, `dismiss`, and `search` meanings independent of keyboard type;
- direct-input footer presentation is an explicit `auto`, `always`, `cancelOnly`, or `hidden` policy, not a consequence of keyboard geometry mode;
- Quick Address Direct uses persistent Sheet-level X/V and field-level completion only ends editing;
- Address Search opens unfocused, uses Return=`검색` for the real search owner, has cancel-only Sheet action, and guards late async results by visible presentation generation;
- nested Quick triggers invoke the shared focus lifecycle before child presentation and no feature-local rAF focus owner remains;
- Overview child picker cancel closes only that child and never invokes whole-Overview draft rollback.

The intentional numeric Reel `autoFocus` remains a PICKER-internal exception. Drawing Scene/API/history, Quick business data, schemas, migrations, dependencies, native/config/EAS, and Production data are unchanged. Physical result remains owner-gated and is not inferred.

## 12.2 Phase 3 reveal geometry and Overview integrity boundary

Checkpoint: `ALPHA73C_PHASE3_REVEAL_GEOMETRY_OVERVIEW_STATE_INTEGRITY_IPHONE_REQA_REQUIRED`.

Phase 3 keeps the Phase 2 lifecycle and normalizes the temporary geometry it produces. Mounted FocusBlock local geometry is
published for manual direct-input sheets without requesting focus. Every focus generation records the root settled offset
and body offset, then separately accounts for system reveal scroll and user body scroll. Ordinary keyboard dismissal removes
the system delta and restores the root baseline; a user header drag/free-settle remains authoritative. New Recipe uses an
opt-in semantic focus scope spanning the product-name block and complete work-type controls. Material create opts into the
same shared direct-input geometry with persistent Sheet X/V. `keyboardDidShow` remains a generation-guarded semantic safety
check rather than a normal second animation owner.

Overview child ownership is also explicit: due-date X/backdrop/back closes only the date interaction and does not rebuild the
whole staged draft. Major changes clear detail immediately. Target changes use canonical authored taxonomy validity, preserving
valid major/detail and clearing both when the major is invalid for the new target. Existing dependent-data Decision/reset
safety remains in the command path.

## 13. Alpha.73C verification boundary

- Phase 4 checkpoint: `ALPHA73C_PHASE4_COMPACT_REVEAL_KEYBOARD_CLASS_TRANSITION_IPHONE_REQA_REQUIRED`.
- Compact direct-input reveal is semantic-target-first; whole compact composition is not a root-rise proxy unless a persistent footer must remain visible.
- Focus lifecycle is explicit and system compensation is absolute/replaced. TEXT/PHONE_NUMBER/MULTILINE/SEARCH transitions wait for their incoming native frame.
- Original audit product behavior delta: `0`; Phase 1 removed reusable-create prepared focus, Phase 2 applies the shared manual-focus lifecycle/action normalization, Phase 3 owns reveal-cycle geometry and Overview child-state integrity, and Phase 4 corrects compact reveal plus keyboard-class transition ownership.
- Source/API/schema/migration/dependency/native/config/EAS delta: `0/0/0/0/0/0/0/0`.
- Production/Owner/ambiguous mutation: `0/0/0`.
- Physical result: not inferred; this package produces the implementation plan, not a product candidate.
