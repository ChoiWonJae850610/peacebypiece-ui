# Mobile ProductionCard Core Overview Evidence

Version: `2.0.0-alpha.45`

Status: `ALPHA45_MOBILE_PRODUCTION_CARD_CORE_OVERVIEW_COMPLETE`

## Baseline and selected product direction

- Baseline is the clean, pushed alpha.44 completion at `e4576ad2368ffcf349bf26005883ee08a84a7e98`.
- The owner selected option A: retain the real WorkOrder list and rebuild only the selected detail with the established ProductionCard UX grammar.
- `ProductionCardMock` and its constants remain historical UI evidence. The live entry/detail imports neither and displays no mock product, quantity, due date, amount, supplier, image, or action.

## Live core-detail mapping

- The actual `WorkOrderDetailCore` response remains the source for product name/type, season, item code, status, total quantity, due date, Revision number, readiness blockers/warnings, amounts, and tab counts. The final overview deliberately does not render developer-only entity version, Revision lifecycle timestamps, document metadata, or history metadata.
- Decimal amount strings are grouped without converting through an imprecise floating-point value. Zero retains its API meaning.
- Missing product metadata and due date use explicit neutral Korean fallbacks. Internal WorkOrder UUIDs are not rendered.
- A neutral representative-image placeholder displays only the actual image count. No React Native `Image`, remote thumbnail, object URL, file route, or R2 GET is used.

## ProductionCard read-only shell

- The conformity rework uses one outer `ProductionCard` paper sheet rather than a stack of independent rounded dashboard cards. Its integrated hero prioritizes one status badge, product name, Korean-resolved product metadata, Revision, and a neutral media placeholder.
- The four priority metrics move below the hero into a full-width two-by-two phone summary. The media placeholder becomes narrower on phone, the title column explicitly grows and shrinks with zero minimum width, narrow phones use bounded typography, and the title is not ellipsized or hard-coded for a sample name.
- The final overview body contains only bounded readiness and the compact actual amount summary. The second owner screenshot review rejected the prior lower `기본 정보`, `문서 요약`, and `구성 요약` sections as duplicated system-oriented information, so all three and their rows/grids are removed.
- Only `개요` is active. `이미지·첨부`, `사이즈·색상`, `원단`, `부자재`, `제작 플로우`, and `출력·공유` are visible and disabled with actual count badges and the notice `다른 탭은 다음 단계에서 연결 예정입니다.`
- Disabled tabs have no press handler or selection state. Lazy-detail API calls, WorkOrder commands, save/edit/order/delete/share/output/Preview actions, remote files, automatic retry, and polling remain absent.

## Deferred information placement

- Revision finalization, final update, and change history belong to a future history surface; alpha.45 adds no history tab or lazy request.
- Document status, display number, and generation time belong to the future `출력·공유` tab.
- Fabric, accessory, color/size, process, image/attachment, and document counts remain only in the matching disabled tab badges. History count is not repeated in the overview and awaits a separate exposure policy.
- This is presentation-only information placement. API response fields and retained dev/test data are not deleted or changed.

## Responsive and regression boundary

- Phone retains list-to-detail navigation and an explicit accessible list-back action.
- Tablet retains the alpha.44 split list/detail layout. Phone and tablet share the compact single-sheet content order without a duplicated lower metadata grid.
- Alpha.44 detail-error upper-left back, primary `목록으로`, secondary manual `다시 시도`, one in-flight detail guard, preserved list state, and zero automatic list refetch remain intact.
- The exact external PostgreSQL hexadecimal `8-4-4-4-12` UUID path and existing session/tenant/permission guards are unchanged.

## Verification and runtime checkpoint

- New alpha.45 contract covers identity/native/EAS/ATS preservation, live/mock separation, actual core mappings, disabled tabs, no lazy/object/mutation path, phone/tablet structure, and alpha.44 regressions.
- The first physical iPhone functional/data run passed connection, list, recent and legacy detail, actual values, disabled future tabs, list return, background/re-entry, and disconnect with no crash, red screen, or infinite loading.
- The owner did not accept that first screen visually: the large navy metrics, repeated rounded cards, separated tab widget, raw codes, and developer-oriented labels felt unlike the established ProductionCard. That run is preserved as functional evidence only, not visual acceptance.
- The first bounded conformity implementation removed those mismatches and added a dedicated UI-conformity contract. A second owner screenshot review then classified the remaining lower metadata as an information-architecture failure rather than a data defect.
- The final bounded rework removes the three lower sections, preserves tab count badges, separates the summary from the hero to widen the product-title column, and adds a dedicated information-architecture contract. The owner explicitly reported `디자인 최종 판정: PASS`, approved this screen as the pre-feature-expansion ProductionCard overview shell, and found no issue that blocks feature use or information understanding.
- The owner intentionally defers fine typography, spacing, representative-media, tab-density, and color polish until actual tabs and inputs are connected. This is not an alpha.45 completion defect and does not authorize those later features.
- The clean-run physical-iPhone flow retained development connection, actual list, recent and legacy detail, actual overview values, disabled future tabs, list return, background/re-entry, and disconnect without crash, red screen, or infinite loading.
- The preserved Next log has no request-level access ledger. Exact exchange/auth/list/detail/disconnect counts are therefore unavailable rather than reconstructed; source/contracts and the runtime error audit show no lazy-tab, representative file, R2, PDF/token, WorkOrder command, automatic retry, or polling path.
- Canonical stop ended only runner-owned cloudflared, Next, and Metro processes; ports 3100/8081 were released with ownership skip zero, the separate localhost:3000 login server remained running, and Tailscale remained running.
- iPad mini actual: not run. iPad Pro actual: not run. Galaxy Tab actual: not run.
- DB/schema/business mutation, R2 operation, PDF/token operation, production access/mutation, native dependency change, EAS Build, and EAS Update are zero.
- The final canonical Verify, Git commit/push, Source ZIP, and matching repo-state are produced by the approved completion workflow; their exact identities are recorded in the generated repo-state so the tracked source fingerprint is not changed after verification.

Alpha.45 is complete only when the matching final repo-state confirms the canonical Verify, synchronized Git state, and handoff artifacts for this source.
