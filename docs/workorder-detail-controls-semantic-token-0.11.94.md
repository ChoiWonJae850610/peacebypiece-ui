# 0.11.94 작업지시서 상세/검색/필터 semantic token 적용

## 목적

작업지시서 화면에서 색상 class를 직접 쓰는 영역을 줄이고, 입력 가능/선택 가능/계산/검색/필터/액션의 의미를 semantic class로 분리한다.

## 적용 범위

- 작업지시서 좌측 검색 input
- 작업지시서 상태 필터 / 정렬 select
- 검색/필터/정렬 초기화 버튼
- 모바일 drawer 검색/필터/정렬
- 발주정보 table 입력/선택/계산 field tone
- 발주정보 추가 버튼
- 작업 메모 입력창 / 등록 버튼 / 수정·삭제 버튼 / empty state

## 의미 기준

- `field.search`: 검색어처럼 사용자가 직접 입력하는 탐색 필드
- `field.selectable`: 상태 필터, 정렬, 발주 상태, 공장처럼 후보를 선택하는 필드
- `field.editable`: 수량, 공임비, 로스비, 메모처럼 직접 입력하는 필드
- `field.calculated`: 합계, 금액처럼 사용자가 직접 입력하지 않는 계산 필드
- `action.primary`: 생성, 등록처럼 주요 동작
- `action.secondary`: 닫기, 보조 버튼
- `action.add`: 행 추가
- `action.dangerSoft`: 삭제/제거
- `filter.active`: 기본값이 아닌 검색/필터/정렬 조건이 적용된 상태

## 제외

- 실제 테마 선택 UI 변경 없음
- 테마 파일 분리 없음
- DB schema 변경 없음
- 모바일 모달 검색 포커스 이탈 버그 수정은 후속 버전에서 별도 진행
