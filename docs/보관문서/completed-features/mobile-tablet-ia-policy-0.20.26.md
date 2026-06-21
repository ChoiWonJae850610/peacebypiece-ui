# 0.20.26 모바일·태블릿 IA 설계

## 목적

WAFL의 PC 3패널 업무 화면을 모바일에 그대로 축소하지 않고, 디바이스별 정보구조를 분리한다. 이번 버전은 실제 화면 대수정 전 공통 규칙과 상수 기준을 먼저 고정하는 설계 단계다.

## 확인한 기존 공통 기반

- `lib/responsive/useResponsiveDeviceType.ts`
- `components/common/ui/AppResponsiveFrame.tsx`
- `components/common/ui/AppSheet.tsx`
- `components/layout/MobileDrawer.tsx`
- `components/workorder/layout/MobileSectionStack.tsx`
- `components/workorder/layout/TabletSplitLayout.tsx`
- `components/workorder/layout/DesktopWorkspaceLayout.tsx`

이미 모바일/태블릿/데스크톱 분기와 sheet/drawer 기반이 있으므로, 화면별로 별도 breakpoint를 흩뿌리지 않고 공통 상수로 기준을 모은다.

## 추가한 공통 정책 모듈

- `lib/responsive/responsiveLayoutPolicy.ts`

포함 기준:

- 모바일/태블릿/데스크톱 breakpoint
- 공통 media query
- 모바일: stack + bottom sheet/full-screen modal
- 태블릿: split + drawer/bottom sheet
- 데스크톱: workspace + inline panel/drawer
- 작업지시서/원단·부자재/환경설정 화면별 권장 IA 패턴

## 디바이스별 IA 기준

### 모바일

모바일은 3패널을 금지하고 단계형 구조로 본다.

- 목록 → 상세 → 세부 탭
- 주요 액션은 하단 고정 액션바 우선
- 보조 정보는 bottom sheet
- 파일 미리보기/권한/복잡한 입력은 full-screen modal 우선
- 테이블은 카드 리스트로 전환 후보

### 태블릿

태블릿은 PC 3패널을 그대로 유지하지 않는다.

- 기본은 2패널
- 좌측 목록 + 우측 상세
- 첨부/메모/할당 같은 보조 패널은 drawer 또는 bottom sheet
- 가로/세로 전환 시 layout jump 최소화

### 데스크톱

데스크톱은 현재 3패널 workspace 구조를 유지한다.

- 작업지시서: 좌측 목록 + 중앙 상세 + 우측 첨부/디자인/메모
- 원단·부자재: 좌측 발주 목록 + 중앙 상세 + 우측 할당/문서
- 환경설정: 기존 탭 기반 workspace 유지

## 화면별 적용 방향

### 작업지시서

모바일:

1. 작업지시서 목록
2. 작업지시서 상세
3. 상세 하위 탭: 기본 / 생산 / 첨부 / 디자인 / 메모

태블릿:

1. 좌측 목록
2. 우측 상세
3. 첨부/메모는 drawer 또는 하위 탭

### 원단·부자재 발주

모바일:

1. 발주서 목록
2. 발주 상세
3. 상세 하위 탭: 기본정보 / 주문내역 / 자재할당 / 첨부

태블릿:

1. 좌측 발주서 목록
2. 우측 발주 상세
3. 자재할당은 drawer 후보

### 환경설정

모바일:

- 상단 탭 과밀을 피하고 drawer/list navigation 후보로 전환
- 회사 정보, 기준정보, 요금제, 약관, 서비스 건의는 단일 화면 단위로 분리

태블릿:

- 좌측 설정 메뉴 + 우측 설정 상세 2패널 후보

### 멤버관리

모바일:

- 테이블보다 카드 리스트 우선
- 권한/역할 편집은 full-screen modal 후보
- 승인/초대/멤버 목록은 상단 segmented control 또는 drawer 후보

태블릿:

- 목록 중심 2패널 후보
- 상세 편집은 drawer 우선

## 다음 작업 기준

0.20.27에서는 모바일 공통 Shell을 바로 화면별로 흩어 만들지 않고 다음 순서로 확인한다.

1. `AppResponsiveFrame`, `AppSheet`, `MobileDrawer` 재사용 가능성 확인
2. 공통 모바일 page shell 필요 여부 판단
3. 하단 액션바, 모바일 탭, drawer trigger를 공통 컴포넌트로 뺄지 결정
4. 작업지시서 모바일 구조 적용 전, 공통 UI 단위부터 분리

## 이번 버전에서 하지 않은 것

- DB/API 변경 없음
- R2/첨부/메모/휴지통/purge 변경 없음
- 작업지시서 상태 전환 로직 변경 없음
- 실제 모바일 화면 구조 대수정 없음
- build 실행 없음
