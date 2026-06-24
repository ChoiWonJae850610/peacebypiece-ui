# Pre-Codex Policy Reconciliation Audit

Version: 0.24.21.16  
Status: Completed document comparison and cleanup register  
Scope: repository policy/spec comparison against the final confirmed decisions before Codex Sprint A

## 1. Result

The repository contained several provisional decisions that no longer matched the final owner decisions. This version updates the canonical documents and directly resolves the highest-risk contradictions instead of relying only on a generic precedence notice.

## 2. Resolved contradictions

| Area | Earlier provisional language | Final canonical policy | Updated document |
| --- | --- | --- | --- |
| Trial/card | Card could be registered during Trial | Card registration is mandatory at signup before approval | 20, 26 |
| Trial start | Payment/Trial boundary remained flexible | Trial starts at system-admin approval | 20, 26 |
| Billing notice | Only immediate notice was explicit | Immediate, 3-day, and 1-day notices | 20, 26 |
| PDF retention | Final regeneration created auditable versions/superseded lifecycle | Latest file only; no historical PDF metadata | 09, 26 |
| Underwear/accessory | Inclusion/default activation unresolved | Included, disabled by default, customer may enable | 19, 23, 26 |
| Auto delete | Default OFF/manual-first | Default ON from launch; hourly retry; first failure critical alert | 23, 26 |
| Export | Generic limited export | Company-wide backup only; normal PDF unlimited; CSV/JSON/files/PDF ZIP; 7-day link; 500MB parts | 21, 23, 26 |
| Storage 100% | Mostly upload block | Existing view/text edit/delete allowed; creation/stage/file/PDF mutations blocked | 21, 23, 26 |
| Certificate access | Broad system-admin file access wording | Approval-viewer-only certificate view; no download; no general customer content | 20, 23, 26 |
| Inquiry/incident | General email/support wording | One-business-day target; 3 visible statuses; serious incident email + app notice | 21, 26 |

## 3. Remaining intentional deferred items

- PG/provider selection after business registration.
- External analytics and cookie banner/consent.
- Instagram content strategy and final public screenshots.
- Exact production vendor/processor disclosures and legal wording.

These are `DEFERRED` or `LEGAL_REVIEW`, not undefined implementation values for Sprint A.

## 4. Documents that remain historical

Many `docs/*.md` files describe completed version-specific work. They are not rewritten wholesale. Codex must prioritize:

1. `docs/project/26-final-policy-decisions-and-master-todo.md`
2. `docs/project/30-pre-codex-policy-reconciliation.md`
3. topic-specific current project specs such as 09, 19, 20, 21, 23, 27, 28, 29
4. `docs/codex-current-state.md`
5. historical root/version documents only when investigating regressions

## 5. Implementation mismatches still requiring code work

- Public signup/card/Trial/approval flow is not complete.
- Payment, webhook, proration, refund, retry, and billing queue are not complete.
- Company-wide Export job and signed download lifecycle are not complete.
- Latest-only PDF lifecycle and incomplete-PDF presentation are not complete.
- Automatic termination/deletion scheduler and legal-record separation are not complete.
- Underwear/accessory catalog seed/default-disable provisioning is not complete.
- Storage-100% mutation matrix is not fully enforced across all routes.
- Central incident monitoring, structured logging, CI, and recovery exercises remain incomplete.

## 6. Superseded implementation boundary

The earlier UI-first Sprint A boundary has been superseded. The active order begins with DB Foundation in 0.24.22, followed by Source Architecture Cleanup and then UI Foundation. See `docs/project/31-pre-codex-integrated-master-plan.md`.

## 7. Verification

- No DB/R2/PG execution in this version.
- No schema migration.
- Documentation and roadmap only.
- Build/TypeScript and document contracts must pass locally before commit/push.
