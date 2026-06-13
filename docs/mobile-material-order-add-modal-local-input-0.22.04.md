# 0.22.04 모바일 발주 품목 추가 모달 입력 구조 안정화

## 목적
모바일/아이패드 미니에서 발주 품목 추가 모달의 수량/단가 입력 후 추가 버튼이 동작하지 않는 문제를 줄이기 위해 입력값 구조를 단순화했다.

## 변경
- 발주 품목 추가 모달의 수량/단가 입력을 AppNumberInput 즉시 동기화 방식에서 local string state 기반 WaflInput으로 변경
- 콤마 포함 입력값을 모달 내부에서 직접 parse/normalize
- 버튼 활성 조건과 confirm 전달 값을 동일한 parsed value 기준으로 통일
- 터치 환경에서는 pointerdown 단계에서 confirm을 실행해 키보드 blur에 의한 click 소실을 줄임
- APP_VERSION을 0.22.04로 갱신

## 확인 필요
- 모바일 세로에서 수량/단가 입력 후 추가
- 모바일 가로 전환 후 세로 복귀 시 추가
- 아이패드 미니 가로/세로에서 수량/단가 입력 후 추가
- npm run build
