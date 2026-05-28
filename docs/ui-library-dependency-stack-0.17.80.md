# UI 라이브러리 의존성 도입 기준 - 0.17.80

## 목적

WAFL 화면의 제품화 단계에서 반복되는 UI/UX 문제를 줄이기 위해 UI 기반 라이브러리를 한 번에 추가한다.

이번 버전은 화면 구조를 직접 바꾸지 않고, 다음 단계의 공통 UI 래퍼와 반응형 레이아웃 정리를 위한 의존성 기반만 추가한다.

## 추가 의존성 묶음

### 1. shadcn/ui 기반 유틸리티

- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-react`

사용 목적:

- `AppButton`
- `AppBadge`
- `AppCard`
- `AppSection`
- `AppListRow`
- `AppIconButton`

같은 WAFL 내부 공통 UI 래퍼를 만들기 위한 기반이다.

주의:

- 화면 파일에서 외부 UI 컴포넌트를 직접 남발하지 않는다.
- 먼저 WAFL 내부 래퍼를 만든 뒤 화면에서는 내부 래퍼를 사용한다.

### 2. Radix UI 계열

- `@radix-ui/react-accordion`
- `@radix-ui/react-dialog`
- `@radix-ui/react-popover`
- `@radix-ui/react-select`
- `@radix-ui/react-separator`
- `@radix-ui/react-slot`
- `@radix-ui/react-tabs`
- `@radix-ui/react-tooltip`

사용 목적:

- 모달
- 탭
- 시트/드로어 기반
- 셀렉트
- 툴팁
- 아코디언
- 구분선

태블릿/모바일에서 3분할 화면을 그대로 줄이지 않고, 목록/상세/보조패널 전환 구조로 바꾸기 위한 기반이다.

### 3. 알림

- `sonner`

사용 목적:

- 저장 완료
- 상태 변경 완료
- 업로드 완료
- 삭제/복원 완료
- 오류 메시지

각 화면에 흩어진 message state를 장기적으로 공통 toast 흐름으로 통합한다.

### 4. 폼/검증

- `react-hook-form`
- `zod`
- `@hookform/resolvers`

사용 목적:

- 회사 정보
- 멤버 초대/승인
- 발주서 입력
- 설정 화면
- 복잡한 검증이 필요한 신규 폼

기존 안정화된 저장 흐름을 한 번에 갈아엎지 않는다. 신규 폼 또는 복잡한 폼부터 순차 적용한다.

### 5. 테이블

- `@tanstack/react-table`

사용 목적:

- 저장소 목록
- 멤버 목록
- 업체 목록
- 시스템 관리자 목록
- 통계 상세 테이블

작업지시서 상세 내부의 작은 입력 영역에는 바로 적용하지 않는다. 먼저 관리자/목록형 테이블부터 검토한다.

### 6. 빠른 검색/명령 팔레트

- `cmdk`

사용 목적:

- 작업지시서 빠른 검색
- 발주서 빠른 검색
- 업체 빠른 검색
- 메뉴 빠른 이동

즉시 화면에 노출하지 않고, 검색/이동 UX 정리 단계에서 사용한다.

### 7. 드래그 앤 드롭

- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

사용 목적:

- 첨부 이미지 순서 변경
- 공정 순서 변경
- 파일 순서 정렬
- 향후 보드형 업무 흐름

현재 화면에는 즉시 적용하지 않는다. 기능 요구가 생길 때 적용한다.

## 적용 순서

### 0.17.81

- `AppButton`
- `AppBadge`
- `AppCard`
- `AppSection`
- `AppListRow`
- `AppSeparator`

내부 UI 래퍼 1차 생성.

### 0.17.82

- 작업지시서 화면의 PC/tablet/mobile 영향 범위 확인
- 공통 섹션과 화면 전용 레이아웃 분리 기준 확정

### 0.17.83

- 작업지시서 PC 화면에 공통 UI 래퍼 적용

### 0.17.84

- 원단·부자재 PC 화면에 공통 UI 래퍼 적용

### 0.17.85

- 태블릿/모바일용 Sheet/Tabs 구조 적용 시작

## 주의 사항

- 라이브러리 도입 자체로 화면을 직접 고치지 않는다.
- WAFL 내부 공통 컴포넌트 계층을 먼저 만든다.
- PC 화면 수정이 태블릿/모바일에 새지 않도록 화면 전용 wrapper를 분리한다.
- 데이터 저장, 상태 전환, R2, 첨부, 메모, 휴지통, purge 흐름은 이번 작업 범위에서 건드리지 않는다.
- 기존 정상 동작하는 폼을 React Hook Form으로 즉시 재작성하지 않는다.
