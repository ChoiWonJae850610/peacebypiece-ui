# Alpha.67 Identity/PICK/Basic Spec/Readiness/Public Viewer Evidence

Status: candidate implementation evidence; owner physical result is not inferred.

## Verified source causes

- `work_order.set_sample` previously guarded Reorder/Sample semantics but omitted WorkOrder/revision lifecycle predicates, so an issued identity mutation was not rejected by its own update owner.
- Overview `시즌` and `세부 품목` were raw inline text fields rather than canonical WAFL PICK consumers.
- Measurement templates were tenant DB-only. Existing apply semantics already rebuilt selected WorkOrder size rows, so the bounded extension adds one source-backed product template owner rather than a second editor or persistence catalog.
- The canonical readiness evaluator emitted missing Fabric and Accessory as hard blockers in both detail and issue paths.
- Public `/v` downloaded valid bytes but mounted them through browser-native `<object type="application/pdf">`, which leaves a blank body in Kakao iOS even though Download succeeds.
- The native PDF viewer's return action was an unlabeled chevron, while page controls were already explicit.

## Candidate truth

- Draft-only identity uses both WorkOrder and current-revision draft predicates; read-only presentation is fixed and Reorder remains 본생산.
- Nearby-year `SS/FW/상시` season and exact category detail lists share draggable WAFL INPUT/PICK ownership; direct values remain WorkOrder-local.
- `WAFL_BASIC_SPEC_V1` preserves the provided JSON. Four deterministic reference templates use cm SOT, twelve seed sizes, exact core/addon POMs, selected-size-only projection, no custom-size invention, and company-template separation. Newly catalogued POM keys without stable authored diagram anchors are grid-only.
- Material absence/optional gaps remain in readiness warnings and no longer block issue; Basic Process and all other hard rules remain.
- `/v` uses a bundled/self-hosted PDF.js worker and one canvas per PDF page. Chromium and WebKit-class QA require an actual nonzero rendered canvas. Public token/session security, Download, internal workspace-file protection, and raw-R2 exclusion remain.
- Native View shows `‹ 문서` separately from PDF `이전 / 다음`.

## Safety

No migration `021`, production mutation, owner fixture mutation, version bump, commit, push, release, or physical PASS inference is authorized by this evidence.
