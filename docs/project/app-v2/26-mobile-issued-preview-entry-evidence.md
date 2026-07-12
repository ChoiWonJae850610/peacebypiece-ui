# WAFL v2 Mobile Issued Preview Entry Evidence

Version: `2.0.0-alpha.29`

## Problem and result

The Expo production-card mock exposed four Preview-looking controls without a real destination. Alpha.29 connects the top `작지 보기`, pre-order sheet `미리보기`, production-document row, and eye action to one platform-aware opener. Issued metadata opens Preview; draft or incomplete metadata stays disabled with an explicit reason.

## Architecture

- Mobile owns one dev/test `issuedDocumentNumber` metadata field and no raw WorkOrder/revision UUID literal.
- `buildIssuedPreviewUrl` creates `/workspace/documents/:documentNumber/preview` with URL encoding.
- The authenticated Next page calls the GET-only Preview target API. Its repository applies tenant claims in a fixed read-only transaction and limits lookup to issued/revised/completed WorkOrders with finalized/superseded revisions.
- The resolver then navigates to the existing alpha.28 `/workspace/workorders/:workOrderId/revisions/:revisionId/preview` screen. The document number remains a display/entry slug, not an internal identity.

## Platform and authentication boundary

- Expo Web uses `window.open` with `_blank` and `noopener,noreferrer`; blocked popup fallback uses the same tab.
- Native uses `Linking.canOpenURL` and `Linking.openURL` to open the system browser.
- `EXPO_PUBLIC_WAFL_WEB_BASE_URL` is required outside Expo Web development. Only localhost Expo Web development may derive `http://<current-host>:3000`; production never falls back to localhost.
- No access token, session claim, company ID, signed token, storage key, or UUID is added to the mobile URL. Existing Next authentication remains authoritative. Native users may see the normal web login because alpha.29 does not implement mobile-to-web SSO.

## Static and read-only runtime evidence

- Alpha.29 static contract PASS: common opener, four entry contracts, single document metadata source, URL encoding, web/native split, disabled UX, read-only tenant resolver, and no PDF/QR/R2/mutation path.
- Approved dev/test fingerprint `01e5dcc7fea3` runtime PASS with ledger `8/8`.
- Company A resolved the issued/finalized target and the resulting alpha.28 Preview returned the same display document number.
- Company B/H returned generic `NOT_FOUND`; Company C returned `FORBIDDEN`; invalid document format returned generic `NOT_FOUND`.
- Before/after WorkOrder, revision, receipt, event, document, and migration-ledger counts were identical. DB/schema/index/test-data/business/R2/Worker/PDF/production mutation: false.

## Expo Web evidence

- `localhost:8081` loaded without console warning/error.
- The top action, production-document row, and eye action opened the same document-number Preview route. In the test browser without a Next login session, the existing login boundary handled the destination as designed.
- Selecting a draft card preserved the pre-order sheet, disabled its Preview action, and displayed the issued-document requirement.
- Sharing, printing, and saving controls remain disabled mock actions.

## Manual QA and alpha.30 handoff

Native iPhone/iPad/Android system-browser opening, login, app return, popup policy differences, and tablet orientation remain user manual QA. Alpha.30 owns PDF generation, QR payload, R2 storage, regeneration, trash/restore, and orphan detection; alpha.29 adds none of those lifecycles.
