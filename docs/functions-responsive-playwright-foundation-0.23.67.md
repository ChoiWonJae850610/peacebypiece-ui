# `/functions` 반응형·기기 Playwright 기반 — 0.23.67

## 목적

작업지시서와 자재 발주 workspace를 고정 viewport 행렬에서 검증하고, 공통 WAFL 레이아웃 계약이 화면별 구현에서 깨지는지를 자동으로 탐지한다.

## viewport 행렬

- Desktop 1440×900: 3패널
- Desktop 1280×800: 3패널
- iPad Mini 가로 1133×744: 2패널과 목록 drawer
- iPad Mini 세로 744×1133: 단일 workspace와 목록 drawer
- Galaxy Tab 가로 1280×800: 3패널
- Galaxy Tab 세로 800×1280: 2패널과 목록 drawer
- iPhone 세로 390×844: 단일 workspace와 목록 drawer
- Galaxy S 세로 360×800: 단일 workspace와 목록 drawer

## 자동 검증

- document 가로 overflow 없음
- 예상 3패널·2패널·단일 workspace 구조
- tablet frame 표시
- 표시 중인 workspace panel의 유효 높이와 scroll 속성
- 주요 버튼과 modal footer의 viewport 좌우 이탈 없음
- 목록 버튼이 있는 화면의 drawer 열기·닫기
- 실행 결과의 viewport·route 계약 JSON 첨부

## 안전 조건

`WAFL_FUNCTIONS_RESPONSIVE_E2E_ENABLED=1`인 경우에만 suite가 실행된다. 로그인 session secret과 dev/test fixture가 없으면 기존 helper가 명확한 사유로 skip한다. 생성·수정·삭제 mutation은 수행하지 않는다.

## 실행 명령

```bash
npm run test:e2e:functions-responsive
```

PowerShell 메뉴 제안: `Functions Responsive E2E Test`

- 안전 등급: 비파괴
- runtime 제한: development/dev/local/test/demo
- production: 실행 차단
- 전체 검사 포함: 환경이 준비된 경우에만 선택적 포함
