# Maker WorkOrder Tab IA v2

Document role: current normative information-architecture owner for the six visible Maker WorkOrder mobile tabs. Shared visual tokens and components are owned by `11a-mobile-design-system-v2.md`; business behavior remains with domain/API contracts.

## Common frame

Overview, Image/Attachment, Size/Color, combined Materials, Production, and Document share one page shell, tab rail, one `WaflWorkOrderTabBody` start inset, section rhythm, major-card grammar, action-tile family, and sheet-based deep-edit language. Their internal data structures need not be identical. The actual rendered outer chain applies that inset once between the sticky rail frame and the selected feature root. Size/Color does not mount an empty editor wrapper, conditional spacer, or second top padding before its first `색상·사이즈` card; editor feedback chrome exists only while feedback or an editor is actually present. The visible rail is `개요 / 이미지·첨부 / 사이즈·색상 / 원부자재 / 제작 / 문서`.

The live `새 작업지시서` text-entry form uses the shared compact `adaptiveExpandable` sheet policy rather than fixed `contentFit`. It completes one current-generation entrance before requesting product-name focus, remains freely draggable, and keeps X as cancel and V as the single create command. Closing before presentation readiness cancels the pending generation; reopening never reuses a stale keyboard/focus intent.

## Overview

The product identity/hero remains concise. Basic information is one coherent major card/row group and cost composition is another. Due date, total quantity, useful counts, and existing authoring behavior remain unchanged. Readiness and warning content is contextual rather than a competing visual system. No cost or readiness calculation changes belong here.

IA simplification review status: `OWNER_PHYSICAL_REVIEW_REQUIRED`. Basic information uses the shared responsive metric grid: two columns on a normal phone and four only at a comfortably readable width, with 64-point minimum-height cells and no extra inner gutter. Every metric uses the same surface and geometry; each editable child control supplies exactly one thin underline and the metric wrapper supplies none. Total quantity remains derived/read-only on the same surface without an underline. Cost rows through `1벌 원가` share one divider-inset owner; the separately emphasized final total remains a distinct semantic surface.

Target, major category, season, and comparable staged Overview choices route through the single `WaflReelPickerSheet`. Its `reelAdaptive` initial geometry follows the actual single-choice reel rather than the general form-sheet medium floor; the reel still owns value scrolling and only the header owns sheet free drag. Date/calendar and live inline edits keep their separate canonical interaction owners.

## Image and Attachment

The owner-approved four action tiles (`사진`, `카메라`, `스케치`, `첨부`), representative-image review, attachment list, and factory-delivery memo remain the visual baseline. They use shared action layout, card, spacing, and type roles without reducing carousel/review usability.

## Size, Color, and Finished Spec

Size and Color share one default-expanded `색상·사이즈` matrix card. Compact ruler and palette header actions labeled `사이즈` and `색상` open the unchanged staged X/V selection flows and carry no counts. The real Color × Size quantity projection is visible immediately through `WaflFrozenAxisTable`: the Color label column stays fixed and every Size column remains available by horizontal scroll. Five or fewer Color rows have no `전체보기`; six or more show the first five plus `전체보기`. Size count does not trigger full view.

IA simplification review status: `OWNER_PHYSICAL_REVIEW_REQUIRED`. Finished Spec is also default-expanded and reuses the same frozen-axis table with a fixed POM label column and horizontally scrollable Size columns. The corner entry `스펙 항목 〉` opens the same-company reusable catalog with staged X/V selection; retained rows keep values, removed rows remove only the current editable snapshot rows/values, and newly selected items use the canonical empty-value semantics. Five or fewer POM rows have no `전체보기`; six or more show the first five plus `전체보기`. Full view freezes the corner, Size header, and left labels while synchronizing body axes. WorkOrder Size source-of-truth, template, cm/inch, cell mutation, and projection behavior remain unchanged.

Direct Size, Color, and Spec Item catalog creation uses a shared nested handoff. The child has a back route to the parent catalog and one `추가` commit; successful creation auto-stages the new reusable option, while the parent V remains the only WorkOrder batch apply. Saved Spec load and save/update prepare their async list projection before presentation, then use the shared current-generation `adaptiveExpandable` measurement so entrance is one continuous slide-up rather than a visible fallback followed by height correction; an already user-expanded sheet is never collapsed.

The three reusable-create children also share the draggable, free-settle, TextInput focus/reveal policy. Size and Spec begin compactly; Color may begin taller for its palette. Their handle, keyboard, mounted nested transition, explicit `추가`, parent return, and newly created option auto-selection remain one family rather than fixed Size/Spec exceptions.

Category-aware Spec Item review status: `OWNER_PHYSICAL_REVIEW_REQUIRED`. The current canonical major category filters the recommendation contents of the two staged sources, `WAFL 제공` and `우리 회사`, and both feed the same X-zero/V-one-batch WorkOrder snapshot flow. An editable draft exposes the same `스펙 항목 〉` chooser even when Finished Spec has zero rows or major category is absent. Without a major category the chooser shows no fabricated WAFL category, explains that category selection enables recommendations, retains only already-supported category-neutral company items, and keeps `직접 만들기` available through the existing nullable category scope. The first explicit V bootstraps the hidden measurement snapshot and Size-aligned rows through the canonical batch command; zero rows are a valid empty collection, not an error. Changing or unsetting category never rewrites rows; only a later explicit V changes the current draft selection. Category-mismatched current rows remain represented in a bounded `현재 사용 중` area. Saved Spec snapshot semantics stay unchanged, issued/locked WorkOrders expose no authoring entry, and the table has no direct row-rename affordance.

## Combined Materials presentation

Fabric and Accessory remain under one visible `원부자재` tab. A compact same-page category switch presents `원단` and `부자재` with real semantic count badges and one trailing plus; it is not a nested global tab bar. Only the selected category's normal list renders. The plus follows the selection, exposes `원단 추가` or `부자재 추가`, and opens the existing add flow. Switching categories is mutation-free, and successful add/edit returns to the same relevant category.

IA simplification review status: `OWNER_PHYSICAL_REVIEW_REQUIRED`. This switch is presentation-only. Fabric and Accessory retain separate DB/API/service/entity ownership, independent authoritative refresh, and unchanged add/edit/lock/order/delete behavior. Historical `fabric` and `accessory` navigation intents normalize to `원부자재` and select the matching category.

Material unit, required quantity, allowance, and partner selection reuse the same reel owner and semantic adaptive geometry. Labeled Material fields may reuse the canonical sheet field presentation only when their normalization and lifecycle remain equivalent; numeric domain validation, readiness, and order semantics remain in the Material owners.

## Production

`제작` restores the current v2 read-only process owner rather than importing the preserved `ProductionCardMock`. It consumes the existing tenant-scoped `/processes` read model and shows the six-step flow summary plus registered process rows. This restoration adds no process mutation, migration, schema, or mock Runtime path. The historical mock remains reference-only.

## Document

The Document tab is one workbench: production overview, quantity disclosure, factory memo, weak divider, selected attachments, document attachment action, and Quick Delivery action. The irreversible issue/generate action retains its primary hierarchy. Viewer, share, managed QR, and output behaviors remain unchanged.

Quick Delivery opens as a `WaflInputSheet` deep editor rather than inline expansion inside the workbench. Its staged local draft, WAFL partner picker, direct-input child sheet, native Juso child sheet, and read-only preview remain local-only; persistence, delivery PDF, and Event/Receipt remain outside this contract.

Quick Delivery nested routing preserves one parent local draft while presenting one native child sheet at a time. Partner picker → direct address, direct address → Juso, and direct address → picker transitions wait for the outgoing sheet's slide-down/unmount before opening the next sheet. X discards only the child draft, V updates only the selected origin or destination staging, and closing a child restores a touchable parent without an overlay or business mutation.

Quick nested presentation uses the same canonical handoff coordinator for open, cancel, and selection returns. Every outgoing close completes before a two-frame presentation gap and the next generation opens; Juso selection and cancellation differ only in staged data, not in modal sequencing. Origin/destination identity stays bound to the incoming generation, and post-search detail focus runs only after the matching endpoint, generation, and target are mounted. Repeated origin/destination search-select/cancel cycles must leave the returned parent touch, input, and drag paths active with no invisible overlay.

Quick endpoint entry is state-aware through one pure policy shared by origin and destination. A current direct endpoint opens its direct editor immediately with the exact local postal/basic/detail/contact staging; registered and unspecified endpoints open the WAFL picker, and `WAFL PICK으로 변경` is the explicit direct-to-picker route. X preserves the prior endpoint staging and V updates only the active endpoint. The request-preview child uses the same canonical nested handoff and current-generation adaptive measurement: each open starts with a safe usable target, reconciles only matching body measurement, and returns to the same immediately interactive parent. Whole-Quick persistence remains deferred.

Direct Size, Color, and Spec Item catalog creation follows the same close/reset/present/focus lifecycle. Each child uses one explicit `추가`, returns to its parent, and locally selects the new reusable company option; only the parent V may mutate the WorkOrder selection. Saved Spec load/save keeps its compact adaptive initial height, but once open it uses the same free-settle release physics as Size, Color, Quick, and Attachment.

Quick direct address is address-first: the child exposes native Juso search, actual address, optional detail address, and contact without a second ambiguous `장소` field. Compatibility state may retain the nullable legacy place member, but direct staging and preview present the actual staged address. Persistence remains deferred/local-only.

Quick direct-address postal code and basic address are read-only Juso-result value surfaces. They have no cursor, keyboard, or direct change handler and are replaced only by another address search. Detail address and contact remain visibly editable through the canonical thin-underline sheet field. Finished Spec cm and inch cells likewise share one geometry-preserving editable table-cell surface with Size/Color quantity cells. The earlier owner-approved Finished Spec inch underline is the canonical frozen-table numeric baseline: all three use the same short, bounded, centered value-surface length with clear separation from the side borders and the same nonzero vertical gap above the bottom grid border, hairline thickness, bottom geometry, and alignment. Unit switching changes formatting only, focus never alters row/grid geometry, underline length, or vertical position, text length never changes the line, and locked cells remain underline-free in both units.

## Tab rail and responsive behavior

The current labels/counts and horizontal rail remain. Counts are quiet and compact. The six-tab rail is at least 48 points high, uses the page shell inset, and may scroll horizontally on phone rather than shrinking touch targets. It is the only sticky element inside the WorkOrder detail scroller: back/list and product identity scroll away, while the global WAFL/company header remains outside this owner. On wide phones/tablets, cards may use available content width while action controls cap at their shared maximum. Every selected tab body begins at the same canonical top inset.
