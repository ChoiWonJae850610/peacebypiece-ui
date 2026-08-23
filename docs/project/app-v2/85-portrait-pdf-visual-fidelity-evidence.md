# Alpha.67 Portrait PDF Visual Fidelity Evidence

Document type: **Immutable Evidence**

Checkpoint: `ALPHA67_PORTRAIT_PDF_VISUAL_FIDELITY_IPHONE_REQA_REQUIRED`

## Scope truth

- The owner primary portrait screenshot is the visual source of truth; the style mock is secondary.
- Every generated page is A4 portrait. The former landscape cover is retired.
- The cover is a fixed document surface: strong WAFL/document header, canonical identity badge, large bounded product title, classification, document-number title metadata, representative image, seven facts, full-width factory-delivery memo, five-cell count strip with secondary context, and quiet footer.
- `문서번호` is absent from the information-card grid by permanent contract. The seven facts are `납기 / 총수량 / 대상 / 시즌 / 대분류 / 세부 품목 / 기본 공정 업체`.
- Identity displays only `본생산`, `샘플`, or `N차 리오더` as applicable. QR, workflow status, visible revision metadata, raw codes, and internal IDs remain absent.
- Detail pages use numbered navy section bars, warm numeric chips, pale blue-gray headers, centered numeric/short categorical cells, left-aligned long text, and a shared document footer.
- Row pagination is deterministic, never splits a logical row, repeats headers for true continuations, and bounds dense Material pages to seven logical rows. Attachment pages contain at most two images.
- Existing quantity formatting, human product/process labels, Basic Process partner and memo truth, Finished Spec behavior, Additional-only process detail, R2 generation, public viewer, native viewer, Share, and Save are unchanged.

## Rendered rejection gates

Three generated artifacts cover normal, rich, and sparse datasets. Every page was rasterized with Poppler at 170 dpi and visually inspected. The normal first page was also placed side-by-side with the approved portrait mock through multiple adjustment rounds. These checks reject clipped content, mixed orientation, missing headers/footers, unreadable contrast, false continuation, cold/weak cover hierarchy, an information-card document number, and unstable cover density. They do not infer owner physical-iPhone acceptance.

## Safety boundary

- APP_VERSION remains `2.0.0-alpha.66`.
- Migration ledger remains `20/20`; no new migration exists.
- Production and owner-fixture mutation are zero.
- Commit, push, and release are zero.
- `PHYSICAL_RESULT_NOT_INFERRED` applies only to this PDF delta; prior non-PDF physical acceptance is preserved.
