# WAFL Material Order Foundation 0.21.27

## 목적

0.21.27은 작업지시서에서 고정한 WAFL Foundation primitive 기준을 원단·부자재 발주 화면으로 확장한다.
발주 화면의 목록 카드, 검색필드, 필터 셀렉트, 품목 입력, 품목 단위 셀렉트, 자재 선택 row가 서로 다른 곡률과 높이로 보이지 않게 하는 것이 목표다.

## 적용 기준

- 목록 카드: `WaflSurfaceButton shape="control"`
- 검색필드: `WaflInput fieldSize="sm"`
- 목록/상세 필터 셀렉트: `AppSelect size="sm"`
- table 내부 입력: `WaflInput fieldSize="xs"`
- table 내부 셀렉트: `AppSelect size="xs"`
- 자재 선택 카드/row: `WaflSurface shape="control"`
- empty/loading/error state: WAFL state component + `wafl-shape-control`

## density 확장

발주 품목 table은 기본 control보다 작은 셀 입력이 필요하므로 `micro` density를 추가했다.

- `micro`: table cell input/select, 작은 관리 cell
- `compact`: 검색/필터/작은 버튼
- `default`: 기본 버튼/입력
- `spacious`: 강조 입력/큰 터치 영역

## 확인 포인트

1. 발주서 목록 카드와 검색필드/필터 셀렉트가 같은 control 계열로 보이는지 확인한다.
2. 발주 품목 table의 input과 단위 select가 같은 높이/곡률로 보이는지 확인한다.
3. 작업지시서 자재 선택 카드와 내부 자재 row가 작업지시서 목록 카드보다 과하게 둥글지 않은지 확인한다.
4. mobile 카드 입력과 PC table 입력이 서로 다른 컴포넌트처럼 튀지 않는지 확인한다.

## 아직 남은 범위

- 발주 화면의 전체 색상 tone 정리는 0.21.28 이후 추가로 진행한다.
- 저장소/첨부/파일 UI는 0.21.28에서 별도 확장한다.
