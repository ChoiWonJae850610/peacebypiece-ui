# Alpha.67 Portrait PDF Mock Exact Fidelity Evidence

Document type: **Immutable Evidence**

Checkpoint: `ALPHA67_PORTRAIT_PDF_MOCK_EXACT_FIDELITY_IPHONE_REQA_REQUIRED`

## Exact cover truth

- The owner primary portrait mock and latest explicit ten-card decision are the visual/product source of truth.
- Cover cards are exactly: `기본 공정 업체 / 납기일 / 총 수량 / 공임비 / 시즌 / 대상 / 대분류 / 세부품목 / 문서 번호 / 총 예상금액`.
- `공임비` reads the persisted Basic Process `amount`; `총 예상금액` reads revision `estimatedTotal`. The renderer does not recreate either calculation.
- The cover palette is centralized as deep navy, muted brick, warm page/card neutrals, warm peach memo, and warm neutral summary. Cool blue fact-card fills are absent.
- Detail section bars remain navy. Table header and total fills are warm neutrals; short and numeric values remain centered while long memo/name cells remain left aligned.
- QR, workflow status, visible revision metadata, internal IDs, and raw classification codes remain absent.

## Visual rejection gates

The initial render was followed by three source-backed visual tuning passes. Final `normal`, `rich`, and `sparse` PDFs were generated and every page was rasterized at 170 dpi. Cover and detail pages were compared side-by-side with the owner mock. The rendered evidence rejects missing/reordered cards, cool blue surfaces, clipped values, false continuation, unstable pagination, and raw/internal leaks. Automated evidence does not infer owner physical-iPhone acceptance.

## Safety boundary

- APP_VERSION remains `2.0.0-alpha.66`.
- Migration ledger remains `20/20`; no migration is added.
- Production and owner-fixture mutation are zero.
- Commit, push, and release are zero.
- Prior non-PDF physical acceptance is preserved. `PHYSICAL_RESULT_NOT_INFERRED` applies only to this PDF delta.
