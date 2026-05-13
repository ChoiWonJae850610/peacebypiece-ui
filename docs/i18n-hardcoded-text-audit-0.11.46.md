# i18n 잔여 하드코딩 조사 — 0.11.46

## 목적

관리자, 시스템관리자, 작업지시서 화면에 남아 있는 사용자 노출 한국어 하드코딩 문구를 조사하고, 후속 i18n 정리 작업의 우선순위를 정한다.

이번 버전은 조사 문서화 단계이며 화면 동작, API, DB schema, R2 흐름은 변경하지 않는다.

## 조사 범위

- `app/admin/**`
- `app/system/**`
- `components/admin/**`
- `components/system/**`
- `components/workorder/**`
- `lib/admin/**`
- `lib/system/**`
- `lib/workorder/**`

## 조사 기준

다음 조건에 해당하는 문자열을 우선 대상으로 분류한다.

1. 고객관리자 또는 시스템관리자에게 직접 보이는 한국어 문구
2. button, badge, empty state, loading, error, success, modal title/description 문구
3. 저장소/휴지통/작업지시서 결과 메시지
4. API 실패 문구가 화면에 직접 노출될 가능성이 있는 문구
5. 이미 `t(key, fallback)` 형태이지만 fallback이 장기적으로 dictionary로 이동되어야 하는 문구

다음은 이번 조사에서 낮은 우선순위로 분류한다.

1. 개발용 문서
2. 내부 타입명 또는 코드 주석
3. 사용자에게 노출되지 않는 로그성 문자열
4. DB seed 또는 schema 설명성 문구

## 주요 발견 사항

### 1. 시스템관리자 통계/홈 화면

대표 파일:

- `components/system/SystemStatsOverview.tsx`
- `components/system/SystemConsoleShell.tsx`

남은 직접 문구 예:

- `시스템 관리자 통계 1차`
- `고객사별 사용 현황`
- `요금제 분포`
- `운영 위험 신호`
- `통계 운영 기준`
- `고객 화면 비노출`
- `R2 purge 상태`
- `저장소 용량 구분`

판단:

시스템관리자 전용 화면이라 고객 노출 위험은 낮지만, 시스템 콘솔 전체를 영문 전환하거나 관리자 언어 설정과 연결하려면 i18n 이동이 필요하다.

권장 후속 작업:

- 0.11.48에서 `/system/*` 하드코딩 정리 대상에 포함
- 우선 `system.stats.*`, `system.console.*`, `system.storage.*` key namespace로 분리

### 2. 시스템 저장소 실제 삭제 후보 화면

대표 파일:

- `app/system/storage-usage/page.tsx`
- `components/system/storage/SystemStoragePurgeButton.tsx`
- `components/system/storage/SystemStoragePurgeCandidatesClient.tsx`

남은 직접 문구 예:

- `개`
- `곳`
- `없음`
- `기준 정렬`
- `일`
- `R2 실제 삭제 후보 확인`
- `삭제 후보 목록 열기`

판단:

시스템관리자 화면이지만 삭제/purge 관련 문구는 운영상 중요하므로 i18n key로 이동하는 편이 안전하다. 특히 `개`, `곳`, `일` 같은 단위 suffix는 나중에 영어 전환 시 문장 조립 문제가 생길 수 있다.

권장 후속 작업:

- suffix 조립을 화면에서 직접 하지 말고 presentation helper 또는 i18n format 함수로 이동
- `SYSTEM_STORAGE_PURGE_COPY`에 이미 들어간 문구와 직접 JSX 문구를 통합

### 3. 관리자 기준정보 화면

대표 파일:

- `components/admin/standards/AdminStandardsSection.tsx`
- `components/admin/standards/AdminUnitManagementModal.tsx`
- `components/admin/standards/StandardManagementModalFrame.tsx`

남은 직접 문구 예:

- `기준정보 관리`
- `시스템 표준 선택형 기준정보`
- `작업지시서 생성 기준값`
- `DB 기준정보 seed가 비어 있거나 일부 부족합니다...`
- `단위명과 영문 코드/약어는 시스템 표준값을 사용합니다...`

판단:

일부는 이미 `t(key, fallback)` 형태로 감싸져 있으나 fallback 자체가 화면 정책 문구로 길다. 기준정보는 고객관리자가 보는 화면이므로 0.11.47 정리 우선순위에 포함한다.

권장 후속 작업:

- 긴 안내 문구를 dictionary key로 이동
- 기준정보 공통 설명은 `standards.common.*`로 정리
- 단위/품목/공정별 문구는 `standards.units.*`, `standards.items.*`, `standards.processes.*`로 분리

### 4. 관리자 멤버/초대 화면

대표 파일:

- `components/admin/members/AdminMemberManagementDashboard.tsx`

상태:

대부분 `t(key, fallback)` 형태가 적용되어 있다. 다만 fallback 문구가 길고, 일부 preview/sample 문구는 실제 고객 노출 여부를 다시 판단해야 한다.

주의 대상:

- `DB 연결 예정`
- `권한 충족 · DB 연결 예정`
- preview applicant 이름/설명
- 초대 생성 안내 문구

판단:

이미 i18n 구조가 상당 부분 들어가 있으므로 0.11.47에서 대규모 수정 대상으로 삼기보다는, 고객에게 실제 노출되는 안내 문구와 preview 문구만 우선 정리한다.

### 5. 작업지시서 사이드패널 메모/첨부 영역

대표 파일:

- `components/workorder/sidepanel/WorkOrderMemoPanel.tsx`
- `components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx`

남은 직접 문구 예:

- `대표`
- `이름 없음`

판단:

짧은 fallback이지만 고객 노출 가능성이 높다. 작업지시서 화면은 실제 업무 화면이므로 0.11.49에서 우선 처리한다.

권장 후속 작업:

- author role label을 presentation helper 또는 i18n key로 이동
- `대표`, `이름 없음`은 `workorder.memo.author.admin`, `workorder.memo.author.unknown` 등으로 분리

### 6. 관리자 설정/페이지 title

대표 파일:

- `app/admin/page.tsx`
- `app/admin/settings/page.tsx`

남은 직접 문구 예:

- `고객관리자 메인`
- `환경설정`
- `회사 운영 기준과 계정 관련 설정을 관리합니다.`

판단:

page metadata 또는 shell title로 노출되는 문구다. 관리자 홈/설정은 고객관리자가 자주 보는 화면이므로 0.11.47에서 우선 처리한다.

## 우선순위

### 0.11.47 — 고객관리자 하드코딩 정리 1차

대상:

- `/admin/files`
- `/admin/settings`
- `/admin/dashboard`
- `/admin/standards`
- `/admin/members` 중 고객 노출 안내 문구

원칙:

- 고객이 직접 보는 문구부터 이동
- 저장소/휴지통 결과 메시지 우선
- `연결 첨부` 같은 기술 표현 사용 금지
- `문서 n개, 디자인 n개, 메모 n개` 같은 role 기반 표현 유지

### 0.11.48 — 시스템관리자 하드코딩 정리 2차

대상:

- `/system`
- `/system/storage-usage`
- `/system/companies`
- `/system/standards/*`
- `/system/category-rules`
- `/system/audit-logs`

원칙:

- 시스템 전용이라도 운영 문구는 i18n key로 이동
- 단위 suffix 조립을 화면 JSX에서 줄이기
- `SYSTEM_STORAGE_PURGE_COPY`와 직접 문자열을 통합

### 0.11.49 — 작업지시서 하드코딩 정리

대상:

- 작업지시서 목록
- 작업지시서 상세
- 발주정보
- 생산구성
- 디자인/첨부/메모
- workflow action 안내 문구

원칙:

- 기능 변경 금지
- 상태 enum/string 비교 구조 변경 금지
- 화면 문구 이동 중심
- 작업지시서 저장 정책 변경 금지

## 리스크 메모

- 단순히 모든 한국어 문자열을 일괄 이동하면 scope가 커지고 build/runtime 회귀 위험이 커진다.
- 이미 `t(key, fallback)`이 적용된 곳은 dictionary 존재 여부를 확인한 뒤 이동해야 한다.
- 결과 메시지처럼 count가 들어가는 문구는 i18n key만 이동하면 부족할 수 있으므로 formatter 함수가 필요할 수 있다.
- 작업지시서 화면은 domain logic과 UI가 얽힌 부분이 있으므로 0.11.49에서 작은 파일 단위로 나누어 정리한다.

## 이번 버전 결론

0.11.46에서는 조사와 우선순위 확정만 수행했다. 실제 문자열 이동은 0.11.47부터 고객관리자 화면 우선으로 진행한다.
