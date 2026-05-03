# 관리자 거래처/공장관리 안정화 기준 0.9.135

## 목적

`0.9.77` 복구 라인 기준에서 `/admin/partners` 화면을 본 기능 화면으로 유지하고, 거래처/공장/원단/부자재/외주처 관리 흐름을 read-only 또는 skeleton 화면으로 대체하지 않도록 고정한다.

## 현재 기능 범위

- `/admin/partners`는 `PartnerMasterSection`을 통해 본 기능 화면을 렌더링한다.
- 목록 조회는 `/api/admin/partners` GET을 사용한다.
- 생성은 `/api/admin/partners` POST를 사용한다.
- 수정은 `/api/admin/partners` PATCH를 사용한다.
- 외주 공정 정의 저장은 `/api/admin/partners` PUT을 사용한다.
- repository는 `createPartnerRepository()`를 통해 현재 설정된 DB repository 경계를 따른다.

## 0.9.135 보완 사항

- 거래처 저장 중 저장 버튼을 중복 클릭해 POST/PATCH가 반복 호출되지 않도록 저장 진행 상태를 추가했다.
- 저장 중에는 모달 닫기/취소/저장 버튼을 비활성화해 저장 요청 중간에 draft 상태가 초기화되는 위험을 줄였다.
- 거래처 목록, 필터, 생성/수정 modal UI 구조는 변경하지 않았다.
- 외주 공정 관리, 관리자 파일관리, 작업지시서 첨부/메모 흐름은 수정하지 않았다.

## 확인 대상 파일

- `app/admin/partners/page.tsx`
- `components/admin/PartnerMasterSection.tsx`
- `components/admin/partnerMaster/usePartnerMasterController.ts`
- `components/admin/partnerMaster/PartnerMasterFormModal.tsx`
- `components/admin/partnerMaster/PartnerMasterList.tsx`
- `app/api/admin/partners/route.ts`
- `lib/admin/partner/apiClient.ts`
- `lib/admin/partner/dbMapper.ts`
- `lib/partners/*`

## 테스트 체크리스트

### 화면 진입

1. `/admin/partners`로 진입한다.
2. runtime error 없이 목록이 표시되는지 확인한다.
3. 필터, 검색, 사용/미사용 상태 필터가 화면에서 정상 반응하는지 확인한다.

### 생성

1. `협력업체 추가` 버튼을 누른다.
2. 이름, 분류, 연락처, 이메일, 메모를 입력한다.
3. 외주 유형을 선택한 경우 외주 공정을 추가한다.
4. 저장 버튼을 빠르게 여러 번 눌러도 항목이 중복 생성되지 않는지 확인한다.
5. 저장 후 목록에 새 항목이 표시되는지 확인한다.
6. DB의 `partners` 및 관련 `partner_items` 데이터가 예상 범위로 생성되는지 확인한다.

### 수정

1. 기존 거래처의 `수정` 버튼을 누른다.
2. 이름, 연락처, 사용 여부, 분류, 외주 공정을 수정한다.
3. 저장 버튼을 빠르게 여러 번 눌러도 PATCH 요청이 중복 반영되지 않는지 확인한다.
4. 새로고침 후 수정 내용이 유지되는지 확인한다.

### 회귀 확인

1. `/` 작업지시서 화면에서 공장/원단/부자재/외주처 선택 옵션이 깨지지 않는지 확인한다.
2. `/admin/settings`에서 외주 공정 관리 modal이 기존처럼 열리는지 확인한다.
3. 작업지시서 첨부 업로드/삭제/메모 저장 흐름이 영향받지 않았는지 확인한다.

## 금지 기준

- `/admin/partners`를 read-only/skeleton 화면으로 대체하지 않는다.
- DB schema를 변경하지 않는다.
- `package.json`, `package-lock.json`, `.env.local`을 수정하지 않는다.
- UI에서 직접 DB를 호출하지 않는다.
- 정상 동작 중인 R2/첨부/메모 흐름을 변경하지 않는다.
