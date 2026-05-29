# WAFL UI 제품화 0.18.20 — TanStack Table 적용 후보 분석

## 목적

0.18.20은 TanStack Table을 바로 대량 적용하지 않고, 기존 AdminTable 기반 화면 중 1차 전환 후보를 분류하는 준비 단계다. 작업지시서 내부 입력표와 원단·부자재 입력표처럼 저장 흐름이 강하게 결합된 표는 이번 범위에서 제외한다.

## 현재 전제

- `@tanstack/react-table` 의존성은 이미 package.json에 포함되어 있다.
- 기존 운영 화면은 `AdminTable`과 화면별 column factory를 이미 사용하고 있다.
- 따라서 1차 목표는 라이브러리 직접 사용이 아니라, 향후 `AppTable` 또는 `AdminDataTable` 래퍼로 감쌀 수 있는 화면을 고르는 것이다.
- 화면 파일에서 TanStack API를 직접 호출하지 않는다.
- 정렬/필터/선택/페이지네이션은 화면별 임의 구현을 줄이고 공통 래퍼로 흡수한다.

## 1차 전환 후보

### 1순위: 저장소 휴지통 목록

대상 파일 후보:
- `components/admin/files/FileTrashSection.tsx`
- `components/admin/files/fileTrashSectionColumns.tsx`
- `components/admin/files/fileTrashSectionRows.ts`
- `lib/admin/files/trashTablePresentation.ts`

판단:
- 정렬, 선택, 상세 확인, 복원/삭제 액션이 이미 표 중심으로 구성되어 있다.
- row 타입이 작업지시서 묶음과 개별 파일로 섞여 있어 공통 row model 검증에 적합하다.
- 다만 restore/purge 흐름과 연결되어 있으므로 1차 실제 적용 시에는 UI row 렌더링만 분리하고 API action 로직은 유지해야 한다.

위험:
- 휴지통/purge 흐름은 안정성이 중요하다.
- 전체 선택, 묶음 row, 개별 row, 비활성 row의 선택 규칙을 TanStack selection 상태와 섞으면 회귀 위험이 있다.

권장:
- 0.18.21에서 바로 전체 전환하지 말고 `AppDataTable` 설계 후 read-only render path부터 적용한다.

### 2순위: 멤버 목록

대상 파일 후보:
- `components/admin/members/AdminMemberDirectorySection.tsx`
- `components/admin/members/AdminMemberDirectoryTableColumns.tsx`
- `components/admin/members/AdminMemberInvitationSection.tsx`
- `components/admin/members/AdminMemberInvitationTableColumns.tsx`

판단:
- 필터, 검색, 상태 badge, row click 구조가 명확하다.
- DB/R2와 직접 연결된 위험 액션이 저장소보다 적다.
- 멤버 상세/승인/초대 흐름은 모달 액션으로 분리되어 있어 table 래퍼 테스트에 적합하다.

위험:
- 권한/역할 표시는 도메인 문구와 i18n이 엮여 있다.
- row click과 버튼 click event bubbling을 분리해야 한다.

권장:
- TanStack Table 1차 실제 적용 후보로 가장 무난하다.
- 0.18.21에서 멤버 목록 read-only table shell부터 적용하는 안이 안전하다.

### 3순위: 시스템 감사 로그

대상 파일 후보:
- `components/system/audit/SystemAuditLogsDesignPage.tsx`
- `lib/system/audit/types.ts`
- `lib/system/audit/selectors.ts`

판단:
- 감사 로그는 정렬/필터/검색/페이지네이션 요구가 강하다.
- 향후 시스템관리자 운영 화면에서 재사용 가능성이 높다.

위험:
- 현재 일부는 design page 성격이 섞여 있다.
- 실제 DB audit log 연결 전이면 table 래퍼를 먼저 넣어도 사용자 가치는 제한적이다.

권장:
- AppTable 설계 검증에는 좋지만 1차 실제 전환 대상은 멤버 목록 이후가 적절하다.

### 4순위: 시스템 저장소 purge 후보 목록

대상 파일 후보:
- `components/system/storage/SystemStoragePurgeCandidatesClient.tsx`
- `lib/system/storagePurgeCandidates.ts`
- `lib/system/storagePurgePresentation.ts`

판단:
- 정렬/선택/일괄 삭제 액션이 있어 TanStack Table과 잘 맞는다.
- 시스템관리자 화면의 장기 운영성 측면에서 적합하다.

위험:
- purge는 파괴적 액션이다.
- selection 상태 회귀가 발생하면 위험도가 높다.

권장:
- 저장소 휴지통보다도 더 나중에 전환한다.
- AppTable selection 패턴이 안정화된 뒤 적용한다.

## 적용 제외

### 작업지시서 내부 입력표

대상 예:
- 원단/부자재/외주/제품구성 입력표
- 인라인 저장, blur 저장, Enter/Escape, 상태 전환과 연결된 표

제외 이유:
- 업무 저장 흐름과 강하게 결합되어 있다.
- TanStack Table 전환은 UI 표준화보다 회귀 위험이 크다.
- 현 단계에서는 공통 입력 editor, validation, 저장 action flow 정리가 먼저다.

### 원단·부자재 발주 상세 입력표

제외 이유:
- 수량/단가/업체/발주서 상태가 저장 로직과 연결된다.
- 먼저 발주서 저장/배분/발주 PDF 흐름 안정화가 필요하다.

## AppTable 래퍼 설계 방향

권장 파일 후보:
- `components/common/ui/AppDataTable.tsx`
- 또는 관리자 전용이면 `components/admin/common/AdminDataTable.tsx`

초기 props 후보:
- `columns`
- `rows`
- `getRowId`
- `emptyMessage`
- `isLoading`
- `sortState`
- `onSortChange`
- `selectedRowIds`
- `onSelectedRowIdsChange`
- `onRowClick`
- `rowClassName`
- `headerClassName`
- `density`
- `variant`

설계 원칙:
- TanStack Table API는 App/Admin 래퍼 내부에만 둔다.
- 화면별 column factory는 유지하되 렌더러 타입만 공통화한다.
- destructive action이 있는 화면은 selection 상태를 기존 상태와 단계적으로 연결한다.
- 초기 버전은 pagination 없이 정렬/렌더링만 다룬다.

## 0.18.21 권장 작업

가장 안전한 다음 작업은 `AdminDataTable` 또는 `AppDataTable`의 얇은 shell을 추가하고, 멤버 목록을 read-only table render path로 일부 전환하는 것이다.

권장 범위:
- `AdminDataTable` 추가
- 멤버 목록 column/row 렌더링만 연결
- 기존 검색/필터/상세 모달/초대/승인 action 유지
- 선택/페이지네이션은 넣지 않음
- build 후 row click과 버튼 click 충돌 확인

## 테스트 체크

- 멤버 목록 검색/상태 필터/역할 필터가 기존처럼 동작하는지 확인
- 멤버 row 클릭 시 상세 모달이 열리는지 확인
- row 내부 버튼이 생길 경우 row click과 중복 실행되지 않는지 확인
- 저장소/휴지통/purge 화면은 0.18.20에서 동작 변경이 없어야 한다.
