# PeaceByPiece Neon / Repository 연결 점검 0.9.128

## 기준

- 기준 버전: `0.9.127`
- 결과 버전: `0.9.128`
- 목적: `0.9.77` 복구 라인을 유지하면서 workorder, attachment, memo, partner, admin/system repository 연결 상태를 점검한다.
- 작업 범위: 기능 코드 변경 없음. APP_VERSION 갱신과 repository 점검 문서 추가/갱신만 수행한다.

## 이번 버전에서 지킨 제한

1. `0.9.108` 이후 read-only/skeleton route 변경은 가져오지 않았다.
2. DB schema는 변경하지 않았다.
3. `package.json`, `package-lock.json`, `.env.local`은 변경하지 않았다.
4. 기존 정상 UI, API, repository 동작은 변경하지 않았다.
5. R2 직접 SDK 업로드/삭제 방식으로 되돌리지 않았다.
6. Worker 기반 R2 처리 흐름은 유지한다.

## repository mode 기준

현재 `lib/constants/app.ts`의 repository mode는 다음 전제를 갖는다.

- `WORKORDER_REPOSITORY_MODE = "db"`
- `PARTNER_REPOSITORY_MODE = "db"`
- `ATTACHMENT_MEMO_REPOSITORY_MODE = "db"`

즉, 복구 라인은 mock UI를 기준으로 보이는 화면을 유지하더라도 저장/조회 경로는 DB repository를 우선 사용한다. DB 연결이 없거나 repository가 실패할 수 있는 영역은 fallback 여부와 사용자 화면 반응을 분리해서 점검해야 한다.

## workorder repository 흐름

### 주요 파일

- `lib/repositories/workorderRepositoryFactory.ts`
- `lib/repositories/workorderRepositoryMode.ts`
- `lib/repositories/dbWorkorderHttpAdapter.ts`
- `lib/repositories/dbWorkorderRepository.ts`
- `lib/repositories/mockWorkorderRepository.ts`
- `lib/workorder/api/workOrderRouteHandlers.ts`
- `app/api/workorders/route.ts`
- `app/api/workorders/status/route.ts`

### 현재 판단

- `app/api/workorders/route.ts`는 `lib/workorder/api/workOrderRouteHandlers.ts`로 위임되어 있어 route가 비교적 얇다.
- browser side repository는 `createWorkorderRepository`에서 mode에 따라 DB HTTP adapter 또는 mock repository를 조립한다.
- `WORKORDER_REPOSITORY_MODE`가 `db`이면 DB HTTP adapter를 우선 사용하고, 내부 repository 구조에서 mock fallback을 함께 가진다.
- 0.9.125에서 상태 변경 PATCH가 memoThreads 전체 replace를 수행하지 않도록 보완했으므로, workorder 상태 변경과 memo persistence는 분리 유지해야 한다.

### 유지 원칙

1. 작업지시서 상태 변경은 workorder repository/actionFlow를 통해 처리한다.
2. 메모/첨부 저장은 attachment/memo repository를 통해 처리한다.
3. workorder PATCH에서 memoThreads를 다시 replace하는 방식은 재도입하지 않는다.
4. UI 컴포넌트에서 DB client를 직접 import하지 않는다.

## attachment / memo repository 흐름

### 주요 파일

- `lib/workorder/persistence/attachmentMemoAdapter.ts`
- `lib/workorder/persistence/attachmentMemoRepository.ts`
- `lib/workorder/persistence/dbAttachmentMemoRepository.ts`
- `lib/workorder/persistence/mockAttachmentMemoRepository.ts`
- `app/api/workorders/memos/route.ts`
- `app/api/workorders/attachments/upload/route.ts`
- `app/api/workorders/attachments/upload/complete/route.ts`
- `app/api/workorders/attachments/delete/route.ts`
- `app/api/workorders/attachments/primary/route.ts`
- `app/api/workorders/attachments/file/route.ts`

### 현재 판단

- `ATTACHMENT_MEMO_REPOSITORY_MODE`가 `db`이면 DB attachment/memo repository를 동적으로 import한다.
- 메모 API는 별도 route로 분리되어 있고, thread/reply 생성·수정·삭제는 repository writable 계약을 확인한 뒤 실행한다.
- 첨부 업로드는 prepare → Worker PUT → complete metadata 저장 흐름을 기준으로 유지한다.
- 0.9.126에서 `/api/workorders/attachments/upload/direct` 서버 fallback은 비활성화했으므로, handshake 문제를 유발하는 서버 직접 R2 업로드 경로를 다시 사용하면 안 된다.

### 유지 원칙

1. R2 원본 파일 처리는 Worker 경로를 우선한다.
2. DB에는 attachment/memo metadata만 저장한다.
3. 작업지시서 일반 삭제와 관리자 파일관리 영구삭제/R2 물리 삭제는 분리한다.
4. 대표 이미지 로직은 0.9.130~0.9.131에서 별도 규칙화 후 수정한다.
5. 메모 저장은 상태 변경과 분리하고, 상태 변경으로 memo row를 삭제하거나 재삽입하지 않는다.

## partner repository 흐름

### 주요 파일

- `lib/partners/partnerAdapter.ts`
- `lib/partners/dbPartnerRepository.ts`
- `lib/partners/mockPartnerRepository.ts`
- `lib/partners/partnerRepository.ts`
- `app/api/admin/partners/route.ts`
- `components/admin/PartnerMasterSection.tsx`
- `components/admin/partnerMaster/*`
- `lib/admin/partner/*`

### 현재 판단

- `/api/admin/partners/route.ts`는 `createPartnerRepository`를 통해 repository를 조립한다.
- API 응답에는 `partners`, `processDefinitions`, `repository` 정보가 포함된다.
- 외주공정 정의와 partner item mapping이 함께 사용되므로, 단순 UI 수정 중 mapper와 repository 계약을 흔들면 위험하다.
- 0.9.108 이후 read-only 거래처 화면은 복구 라인에 자동 병합하지 않는다.

### 유지 원칙

1. 거래처/공장관리 본 기능 UI를 read-only 화면으로 대체하지 않는다.
2. 생성/수정/외주공정 저장 action은 기존 API/repository 계약을 유지한다.
3. partner type, partner item, outsourcing process mapping은 한 패치에서 대규모 변경하지 않는다.

## admin files / settings / stats repository 흐름

### 주요 파일

- `lib/admin/files/*`
- `app/api/admin/files/snapshot/route.ts`
- `app/api/admin/files/trash/restore/route.ts`
- `app/api/admin/files/trash/purge/route.ts`
- `app/api/admin/files/trash/purge-candidates/route.ts`
- `app/api/admin/files/trash/purge-worker/route.ts`
- `lib/admin/settings/*`
- `app/api/admin/settings/users/route.ts`
- `app/api/admin/standards/route.ts`
- `lib/admin/stats/*`
- `app/api/admin/stats/route.ts`

### 현재 판단

- 관리자 파일관리의 soft-delete/restore/purge 흐름은 작업지시서 첨부 일반 삭제와 분리되어 있다.
- 설정/기준정보/통계는 admin 하위 repository와 route가 나뉘어 있으나, 각 화면의 실제 action 연결 수준은 별도 점검이 필요하다.
- 이 영역은 0.9.134 이후 관리자 콘솔 점검에서 route별 상태를 재분류한다.

### 유지 원칙

1. 정상 동작 중인 삭제/복구/Worker purge 흐름은 변경 목표 없이 수정하지 않는다.
2. 설정 저장과 권한 변경은 분리한다.
3. 통계 계산식과 API 응답 포맷은 별도 검증 전 변경하지 않는다.

## system / billing / company / invitation repository 흐름

### 주요 파일

- `lib/company/companyRepository.ts`
- `lib/company/api/companyRouteHandlers.ts`
- `app/api/system/companies/route.ts`
- `lib/billing/storageUsageRepository.ts`
- `lib/billing/api/storageUsageRouteHandlers.ts`
- `app/api/system/storage-usage/route.ts`
- `lib/invitations/invitationRepository.ts`
- `lib/invitations/api/invitationRouteHandlers.ts`
- `app/api/invitations/route.ts`

### 현재 판단

- system 계열은 고객사, 용량/요금제, 초대 흐름이 나뉘어 있다.
- 결제 자동화, 이메일 발송, 실제 인증/회원가입 고도화는 아직 제외 대상이다.
- 초대 수락 후 user/company_user 생성은 별도 설계가 필요하며, 현재 복구 라인에서는 바로 연결하지 않는다.

### 유지 원칙

1. 결제 자동화는 하지 않는다.
2. 이메일 발송은 하지 않는다.
3. 고객사 생성/수정 action은 system console 점검 후 별도 버전에서 다룬다.
4. invitation token 정책과 user/company_user 연결은 별도 설계 후 수정한다.

## 직접 DB/API 접근 금지 기준

다음 패턴은 이후 리팩토링에서 발견 시 정리 대상이다.

- TSX 컴포넌트에서 `lib/db/client` 직접 import
- TSX 컴포넌트에서 SQL row shape를 직접 판단
- route handler 내부에 긴 비즈니스 로직을 직접 추가
- DB 응답 row를 presentation mapper 없이 화면에 직접 연결
- workorder 상태 변경 중 attachment/memo persistence를 함께 replace
- R2 SDK 직접 upload/delete fallback 재도입

## 다음 버전 권장 작업

### 0.9.129

작업지시서 핵심 flow 회귀 테스트 문서를 추가한다. 작성중, 검토요청, 검토완료, 발주요청, 생산/검수, 완료 상태 변경 후 제목, 담당자, 발주정보, 생산구성, 첨부, 메모가 유지되는지 확인한다.

### 0.9.130

대표 이미지와 첨부 미세 로직을 문서로 정리한다. 최초 디자인 첨부 자동 대표 지정, 대표 삭제 후 승계, 대표 이미지 1개 유지, PDF/메모 첨부 제외 기준을 확정한다.

### 0.9.131

0.9.130에서 확정한 규칙 중 안전한 대표 이미지 자동 지정/승계 로직만 적용한다.
