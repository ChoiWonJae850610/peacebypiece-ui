# 0.11.30 시스템관리자 화면 잔여 공통 UI 정리

## 목적

시스템관리자 화면에서 관리자 공통 UI 컴포넌트 적용 상태를 점검하고, 동작 위험이 낮은 영역만 작은 범위로 정리한다.

## 기준

- `AdminButton`, `AdminTable`, `AdminStatusBadge`, `AdminEmptyState` 우선 사용
- 삭제, 복원, purge, 승인, 권한 저장 action flow는 변경하지 않음
- `app/system/**` route는 thin page 유지
- 실제 처리 로직은 `lib/system/**` 또는 `components/system/**`에 유지

## 확인 결과

### 이미 공통화된 영역

- `/system/billing` 고객사 요금제 skeleton 표: `AdminTable` 사용
- `/system/audit-logs` 감사 로그/스키마 표: `AdminTable` 사용
- `/system/companies` 고객사 승인 콘솔: `AdminTable` 사용
- `/system/storage-usage` 실제 삭제 후보 목록: `AdminTable`, `AdminButton`, `AdminStatusBadge` 사용
- `/system/category-rules` 기준 규칙 편집 일부: `AdminButton`, `AdminEmptyState`, `AdminStatusBadge` 사용

### 남은 직접 list 패턴

다음 영역은 데이터 테이블보다 안내/정책/설계 노트 성격이 강하므로 이번 버전에서 `AdminTable`로 바꾸지 않았다.

- `components/system/audit/SystemAuditLogsDesignPage.tsx`의 정책 결정 목록
- `components/system/billing/SystemCompanyPlanSkeleton.tsx`의 설계 노트 목록
- `components/system/invitations/SystemCustomerInviteSkeleton.tsx`의 안내 목록
- `components/system/standards/*`의 기준정보 안내/점검 목록

### 남은 직접 button 패턴

다음 버튼은 일반 CTA가 아니라 list row 선택, overlay 닫기, sort header, status badge toggle 성격이므로 `AdminButton`으로 치환하지 않았다.

- category rule row 선택 버튼
- mobile drawer backdrop 닫기 버튼
- storage purge table sort header 버튼
- 기준정보 active status badge toggle 버튼

## 실제 반영

### 시스템 저장소 실제 삭제 후보 empty 설명 보강

`AdminTable`의 `emptyDescription` 슬롯을 사용해 `/system/storage-usage` 실제 삭제 후보 목록의 empty 상태 설명을 보강했다.

- title: 기존 `SYSTEM_STORAGE_PURGE_COPY.list.empty` 유지
- description: `SYSTEM_STORAGE_PURGE_COPY.list.emptyDescription` 추가
- purge API, 선택 삭제, 전체삭제, 새로고침 동작 변경 없음

## 후속 권장

0.11.31에서는 카드/섹션/헤더 패턴 조사를 먼저 진행하는 것이 안전하다. 시스템관리자 화면은 `rounded-3xl border bg-white p-* shadow-sm` 패턴이 많이 남아 있으므로, 다음 단계는 `AdminCard`, `AdminSection`, `AdminSectionHeader` 설계가 더 효과적이다.
