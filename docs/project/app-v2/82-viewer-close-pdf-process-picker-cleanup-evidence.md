# Alpha.67 Viewer Close / PDF Process / Picker Cleanup Evidence

- Checkpoint: `ALPHA67_VIEWER_CLOSE_PDF_PROCESS_PICKER_CLEANUP_IPHONE_REQA_REQUIRED`
- APP_VERSION: `2.0.0-alpha.66`
- Canonical Verify: `173/173 PASS`
- Production / owner fixture mutation: `0 / 0`
- Physical result: `PHYSICAL_RESULT_NOT_INFERRED`

## Root cause and remediation

1. 시즌·세부 품목 sheet는 `WaflInputSheet`의 vertical `ScrollView` 안에 `WaflOptionReel`의 virtualized `FlatList`를 중첩했다. 소규모 선택군을 non-virtualized `WaflStaticOptionList`로 옮겨 sheet body만 vertical scroll owner가 되게 했다.
2. Maker 추천 스펙 query는 persisted `system` template을 전부 반환하여 legacy QA template도 정상 추천에 노출했다. `filterMakerVisibleMeasurementTemplates`가 현재 category의 canonical WAFL 기본 template 한 건과 company template만 반환하며 legacy/system record 자체는 보존한다.
3. native PDF viewer는 상단 복귀와 하단 페이지 이동이 PDF gesture surface와 경쟁했다. renderer·vertical scroll·zoom·passive page indicator는 유지하고, PDF surface의 sibling footer가 공통 `WaflPrimaryActionButton`의 `닫기`를 소유한다.
4. issued PDF는 `data.processes` 전체를 하나의 제작/추가 공정 표로 렌더했고 cover에는 immutable basic-process partner가 없었다. `resolveIssuedPdfProcessPresentation`이 basic partner와 additional rows를 role로 분리한다. cover는 `기본 공정 업체`의 human name을 표시하고, detail은 additional row가 있을 때만 `추가 공정`을 렌더한다. user-visible `개정차수` row는 제거하되 document number와 internal revision truth는 유지한다.

## PDF evidence

| Scenario | PDF | Bytes | SHA-256 | Pages | Visual result |
| --- | --- | ---: | --- | ---: | --- |
| Basic + 0 Additional | `.tmp/a67-viewer-close-pdf-process-evidence/basic-only.pdf` | 205196 | `765D582A54F3FDB438D3AD240339FCE186ABA9EA7D130E1E9AEF55BF8EB799FD` | 3 | cover basic vendor visible; Additional section absent; all pages rendered and inspected |
| Basic + 1 Additional | `.tmp/a67-viewer-close-pdf-process-evidence/basic-additional.pdf` | 213120 | `834866381EBD8975568F6AA33E6DD23C776121E82FA7BA1E05332E5F58000C1F` | 3 | cover basic vendor visible; Additional section contains only the additional row; all pages rendered and inspected |

Both PDFs preserve meaningful decimal quantity display (`1.5`, `0.125`, `1`, `0`) without fixed `.000`, omit user-visible `개정차수`, and retain the landscape cover plus portrait detail structure.

## Verification

- Next production build: PASS
- root/mobile TypeScript: PASS
- targeted ESLint: PASS with 0 errors
- Expo config: PASS; no dependency/native/EAS change
- mutation audit: 0 high-risk
- migration ledger: `20/20`; migration 021: 0
- Canonical Verify result log: `verify-safe-automation-infrastructure-20260821-183700.txt`

Owner physical iPhone validation remains required.
