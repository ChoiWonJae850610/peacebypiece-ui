# 0.11.25 관리자 날짜 입력 공통화 점검 및 빌드 오류 수정

## 목적

0.11.24에서 분리한 `AdminDateRangePicker` 적용 이후 빌드 중 발견된 `AdminStatusBadge` tooltip 타입 오류를 수정하고, 다음 날짜 입력 공통화 작업의 실제 후보를 점검한다.

## 빌드 오류 수정

로컬 빌드 로그에서 `AdminStatsDashboard.tsx`의 업체 성과 라벨이 `AdminStatusBadge`에 `title` prop을 전달하면서 타입 오류가 발생했다.

수정 내용:

- `components/admin/common/AdminStatusBadge.tsx`의 props에 `title?: string` 추가
- 실제 `<span>`에 `title={title}` 전달
- 기존 badge tone/size/className 동작 유지

이 수정으로 기존 업체 성과 tooltip 사용 의도는 유지하면서 타입 정의가 실제 사용과 일치한다.

## 날짜 입력 공통화 점검

현재 확인된 날짜/기간 UI 흐름은 아래와 같다.

### 이미 공통화된 영역

- `/admin/dashboard`
  - `components/admin/common/AdminDateRangePicker.tsx` 사용
  - `startDate` / `endDate` query string 유지
  - 통계 기간 선택 달력, Escape 닫기, 외부 클릭 닫기, 초기화/완료 동작 유지

### 직접 날짜 입력 공통화 후보

- 작업지시서 상세의 `EditableValue`
  - `components/workorder/detail/shared/detailEditorShared.tsx`
  - `inputType === "date"` 분기 존재
  - 작업지시서 업무 핵심 영역이므로 지금 바로 공통 DatePicker로 치환하지 않는다.
  - 추후 작업지시서 모바일 점검 단계에서 별도 검토가 적합하다.

### 기간/날짜 query 기반 영역

- 관리자 통계 selector
  - `lib/admin/stats/selectors.ts`
  - `startDate` / `endDate` 검증과 query 생성 유지 필요
  - 현재는 `AdminDateRangePicker`와 맞물려 있으므로 추가 변경하지 않는다.

- 관리자 운영 대시보드 기간 선택
  - today/week/month 같은 preset period 중심
  - 날짜 입력 UI가 아니라 기간 preset이므로 `AdminDateRangePicker` 적용 대상이 아니다.

### 이번 버전에서 보류한 영역

- 작업지시서 상세 날짜 편집
- 작업지시서 발주/납기 관련 날짜 입력
- 시스템 감사/저장소 화면의 시간 표시

보류 이유:

- 작업지시서 상세 날짜 입력은 저장 정책과 직접 연결되어 있어 단순 UI 치환 위험이 있다.
- 저장소/감사 화면은 날짜를 직접 입력하는 UI라기보다 표시/정렬/필터 흐름이므로 DateRangePicker 확대 적용의 우선순위가 낮다.

## 다음 권장 작업

0.11.26에서는 날짜 입력 공통화보다, 현재 완료한 UI 공통화 라인의 안정화를 위해 아래 중 하나를 우선하는 것이 적합하다.

1. 작업지시서 상세 날짜 입력을 건드리기 전 별도 설계 문서 작성
2. 남은 직접 table/list 구현 조사
3. AdminCard/AdminSection 공통 컴포넌트 설계

작업지시서 날짜 입력은 0.12.x의 작업지시서 기능 확장 라인 또는 모바일 점검 라인에서 다루는 것이 안전하다.
