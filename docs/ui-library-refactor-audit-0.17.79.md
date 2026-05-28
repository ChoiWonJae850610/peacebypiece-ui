# WAFL UI 라이브러리·리팩토링 0순위 점검 — 0.17.79

## 1. 점검 기준

- 기준 버전: 0.17.78
- 목표 버전: 0.17.79
- 목적: 기능 추가가 아니라, UI 제품화 단계로 넘어가기 전 라이브러리 도입 후보와 리팩토링 우선순위를 정리한다.
- 이번 버전의 원칙: 실제 화면 구조를 크게 바꾸지 않고 분석 문서와 버전만 반영한다.
- npm run build: 미실행. 사용자가 로컬에서 확인한다.

## 2. 현재 package.json 기준 라이브러리 상태

### dependencies

```json
{
  "@aws-sdk/client-s3": "^3.1036.0",
  "@smithy/node-http-handler": "^4.4.5",
  "next": "16.2.1",
  "pdfjs-dist": "^5.6.205",
  "pg": "^8.20.0",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "react-day-picker": "^9.14.0",
  "recharts": "^3.8.1",
  "tldraw": "^5.0.0"
}
```

### devDependencies

```json
{
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "16.2.1",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

## 3. 현재 소스 상태에서 확인되는 UI 구조 신호

- TS/TSX 파일 수: 909개
- `className=` 사용량: 3642회
- `rounded-` 사용량: 904회
- `border` 사용량: 1942회
- `shadow` 사용량: 264회
- `bg-` 사용량: 961회
- 직접 `<button` 사용량: 147회
- `setMessage` 사용량: 81회

해석:

- Tailwind class가 화면 파일과 섹션 파일에 넓게 분산되어 있다.
- 카드, 배지, 버튼, 섹션, 입력 필드의 시각 규칙이 공통 컴포넌트에 완전히 모이지 않았다.
- 작업지시서 화면은 PC/태블릿/모바일 view 파일이 이미 분리되어 있다.
- 원단·부자재 화면은 아직 `MaterialOrderDraftEditor`의 3분할 grid 중심 구조가 강하며, tablet/mobile 전용 view 분리가 부족하다.
- 기존 `AdminCard`, `AdminButton`, `AdminTable`, `SectionCountBadge`, `SummaryCard`, `WorkOrderPanelCard`, `ModalShell` 등 공통 컴포넌트는 존재하지만 WAFL 전체 디자인 시스템으로 묶이기 전 단계다.

## 4. 라이브러리 도입 후보

### A. 1순위 — shadcn/ui

추천도: 매우 높음

역할:

- WAFL 전용 디자인 시스템의 기반
- Button, Badge, Card, Separator, Tabs, Dialog, Sheet, Select, Tooltip, Popover 같은 기본 UI 품질 개선
- Tailwind 기반이므로 현재 구조와 연결하기 쉬움
- Tailwind v4/React 19 환경과도 방향이 맞음

도입 방식:

- 화면 파일에서 shadcn 컴포넌트를 직접 사용하지 않는다.
- `components/common/app-ui/*` 같은 내부 래퍼를 먼저 만든다.
- 화면에서는 `AppButton`, `AppCard`, `AppBadge`, `AppSection`, `AppSheet`, `AppTabs`만 사용한다.

우선 컴포넌트:

```text
Button
Badge
Card
Separator
Dialog
Sheet
Tabs
Select
Tooltip
Popover
```

주의:

- shadcn/ui 자체가 화면을 예쁘게 자동 변환해주지는 않는다.
- 현재 문제의 핵심은 정보 과노출과 화면 분할 구조이므로, 공통 래퍼와 반응형 구조 정리와 함께 도입해야 한다.

### B. 1순위 — Radix UI 계열

추천도: 높음

역할:

- Dialog, Select, Tabs, Accordion, Tooltip, Popover, Sheet 계열의 접근성 기반
- shadcn/ui를 도입하면 Radix 기반 컴포넌트가 함께 들어올 가능성이 높다.

WAFL 적용 후보:

```text
모달
드롭다운
상태 선택
탭
접힘 영역
툴팁
모바일/태블릿 보조 패널
```

주의:

- 기존 `ModalShell`, `BaseModal`, `AdminModal`과 충돌하지 않게 한 번에 교체하지 않는다.
- 신규 `AppDialog`/`AppSheet` 래퍼를 만든 뒤 점진 적용한다.

### C. 1순위 — Sonner

추천도: 높음

역할:

- 저장 완료, 상태 변경, 업로드 완료, 삭제/복원, 오류 메시지 등 피드백 통일
- 현재 화면마다 `statusMessage`, `setMessage`, inline message가 흩어져 있으므로 통합 효과가 크다.

적용 후보:

```text
작업지시서 저장 완료
발주서 생성 완료
발주서 상태 변경 완료
첨부파일 업로드/삭제/복원
멤버 초대/승인
설정 저장
DB/R2 오류
```

주의:

- 중요한 차단성 오류는 Toast만으로 끝내지 않고 화면 내 ErrorState 또는 Dialog로 유지한다.
- 성공/가벼운 실패/재시도 안내를 Sonner로 통일한다.

### D. 1순위 후보 — React Hook Form + Zod

추천도: 높음, 단 즉시 전체 교체는 비추천

역할:

- 고객사 정보 입력, 멤버 초대, 설정, 기준정보, 발주서 입력 등 복잡한 폼 안정화
- 클라이언트/서버 검증 스키마 공유 가능
- 필수값, 숫자 범위, 날짜 정책, 이메일/전화번호 형식 등을 구조화

적용 후보:

```text
회사 정보/승인 요청
멤버 초대/프로필
환경설정
기준정보 관리
원단·부자재 발주 기본정보
납기일 입력 플로우
```

주의:

- 작업지시서 상세의 기존 EditableValue 기반 편집 흐름은 안정화 후 별도 판단한다.
- 기존 저장 흐름을 한 번에 갈아엎지 않는다.

### E. 2순위 — TanStack Table

추천도: 중간~높음

역할:

- 관리자/시스템/저장소/멤버/통계 목록의 정렬·필터·컬럼 제어 구조화
- headless table 방식이라 WAFL 스타일을 유지하면서 테이블 기능만 가져올 수 있다.

우선 적용 후보:

```text
멤버관리 목록
저장소 파일 목록
휴지통 목록
시스템 고객사 목록
감사로그 목록
통계 상세 테이블
업체관리 목록
```

보류 후보:

```text
작업지시서 상세 내부의 작은 제품 구성 입력
원단·부자재 발주 품목 입력표
```

이유:

- 제품 구성/발주 품목 입력표는 일반 조회 테이블이 아니라 입력 UX가 핵심이다.
- 먼저 카드형/섹션형 UI를 정리한 뒤 필요 시 일부만 table engine을 적용한다.

### F. 2순위 — cmdk

추천도: 중간

역할:

- 빠른 검색/이동(Command Palette)
- 작업지시서, 발주서, 업체, 메뉴 빠른 이동

적용 시점:

- 홈/업무홈이 안정화된 뒤.
- 당장 촌스러움 해결보다 생산성 기능에 가깝다.

### G. 2~3순위 — dnd-kit

추천도: 낮음~중간

역할:

- 첨부 이미지 순서 변경
- 공정 순서 변경
- 파일 정렬
- 향후 보드형 업무 흐름

지금은 보류한다. 현재 최우선 문제는 drag & drop이 아니라 정보 구조와 반응형이다.

### H. 아이콘 — lucide-react

추천도: 높음

역할:

- WAFL의 촌스러운 텍스트 밀도를 줄이고 의미 단서를 강화
- 첨부, 메모, 자재, 발주, 납기, 담당자, 검색, 필터, 설정, 사용자 아이콘 정리

주의:

- 아이콘만 많이 넣으면 더 산만해진다.
- `AppIconLabel`, `AppMetaItem` 같은 래퍼로 제한적으로 사용한다.

## 5. 이번 소스 기준 리팩토링 우선순위

### 0순위 — 화면별 영향 범위 분리

해야 할 일:

```text
작업지시서 PC view / tablet view / mobile view의 실제 분리 상태 점검
원단·부자재 PC / tablet / mobile view 분리 상태 점검
공통 섹션 컴포넌트가 PC 수정을 모바일에 전파하는지 확인
```

현재 관찰:

- 작업지시서 상세는 `WorkOrderDetailViewSwitch`, `WorkOrderDetailDesktopView`, `WorkOrderDetailTabletView`, `WorkOrderDetailMobileView` 구조가 있다.
- 하지만 `OrderInfoSection`, `MaterialSection` 같은 내부 섹션은 공통 사용될 수 있으므로 PC UI 수정이 모바일에도 영향을 줄 수 있다.
- 원단·부자재는 `MaterialOrderDraftEditor`의 3분할 grid가 중심이고, 아직 device view switch가 보이지 않는다.

### 1순위 — App UI 래퍼 생성

추천 파일 구조:

```text
components/common/app-ui/AppButton.tsx
components/common/app-ui/AppBadge.tsx
components/common/app-ui/AppCard.tsx
components/common/app-ui/AppSection.tsx
components/common/app-ui/AppListRow.tsx
components/common/app-ui/AppField.tsx
components/common/app-ui/AppTabs.tsx
components/common/app-ui/AppSheet.tsx
components/common/app-ui/AppDialog.tsx
components/common/app-ui/AppToastProvider.tsx
```

원칙:

- shadcn/ui를 직접 화면에 넣지 않는다.
- App UI 래퍼를 먼저 만들고 내부 구현으로 shadcn/ui를 사용한다.
- 기존 Admin 공통 컴포넌트와 중복되는 범위를 정리한다.

### 2순위 — 카드/섹션/배지 스타일 통일

대상:

```text
AdminCard
AdminPanelSection
AdminSection
WorkOrderPanelCard
SummaryCard
SectionCountBadge
MaterialOrder workspace style constants
```

목표:

- 화면별로 다른 rounded/border/shadow 규칙을 줄인다.
- 목록 카드와 상세 카드의 시각 무게를 분리한다.
- 상태 배지, 수량 배지, 카운트 배지를 역할별로 정리한다.

### 3순위 — Modal/Dialog/Sheet 체계 정리

현재 후보:

```text
ModalShell
BaseModal
AdminModal
각종 ConfirmModal
AttachmentPreviewModal
CreateWorkOrderModal
PermissionModal
```

목표:

- PC 모달과 모바일 Sheet를 같은 action/model로 열 수 있게 만든다.
- 모바일에서 3분할을 억지로 줄이지 않고 Sheet/Tabs로 보조 패널을 이동시킨다.

### 4순위 — Toast/Message 통합

대상:

```text
statusMessage
setMessage
inline success/error block
ToastMessage
```

목표:

- 성공/저장/상태변경은 Sonner toast.
- 오류/차단/재시도는 화면 내 ErrorState 또는 Dialog.
- 중복 메시지 상태 제거.

### 5순위 — Form 검증 구조화

대상:

```text
회사 정보
멤버 초대
환경설정
기준정보
원단·부자재 발주 기본정보
납기일 입력
```

목표:

- React Hook Form + Zod 도입 후보.
- 서버/클라이언트 정책을 분리하지 않고 공유 가능한 스키마 설계.

### 6순위 — 관리자/목록 테이블 정리

대상:

```text
AdminTable
FileListSection
FileTrashSection
MemberDirectory
InvitationTable
SystemAuditLogs
PartnerMasterList
```

목표:

- TanStack Table 도입 여부 판단.
- 먼저 조회형 목록부터 적용하고, 입력형 테이블은 보류.

## 6. 권장 버전 계획

```text
0.17.79
- 라이브러리/리팩토링 0순위 점검 문서 추가
- 실제 화면 구조 변경 없음

0.17.80
- PC/tablet/mobile 영향 범위 점검 패치
- 원단·부자재 device view switch 설계 또는 분리 준비

0.17.81
- App UI 래퍼 1차 추가
- AppButton / AppBadge / AppCard / AppSection / AppListRow

0.17.82
- shadcn/ui 최소 도입
- Button / Badge / Card / Separator / Dialog / Sheet / Tabs / Select

0.17.83
- Sonner 도입
- 저장/상태변경/오류 피드백 통일 시작

0.17.84
- 작업지시서 화면에 App UI 래퍼 적용

0.17.85
- 원단·부자재 화면에 App UI 래퍼 적용

0.17.86
- 태블릿/모바일 레이아웃 1차 정리
- PC 3분할과 모바일 단계형 구조 분리

0.17.87
- React Hook Form + Zod 도입 여부 결정 및 신규/복잡 폼부터 적용

0.17.88
- TanStack Table 도입 여부 결정 및 관리자 조회형 목록부터 적용
```

## 7. 최종 판단

- 라이브러리 도입은 필요하다.
- 단, 화면 파일에 외부 라이브러리를 직접 흩뿌리면 장기적으로 더 지저분해진다.
- WAFL에는 `App UI 래퍼 → shadcn/Radix/Sonner 도입 → 화면별 점진 적용` 순서가 맞다.
- 지금 가장 위험한 부분은 PC 화면 수정이 tablet/mobile 공통 섹션을 통해 새는 구조다.
- 따라서 다음 우선순위는 `PC/tablet/mobile 영향 범위 분리`다.
