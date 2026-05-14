# 작업지시서 우측 패널 semantic token 적용 — 0.11.95

## 목적

작업지시서 우측 패널의 디자인, 첨부 파일, 작업 메모 영역에 직접 색상 class를 반복 적용하지 않고 semantic class 기준으로 톤을 맞춘다.

이번 버전은 실제 테마 선택 UI를 변경하지 않고, 향후 테마 파일 분리를 위한 의미 체계만 확장한다.

## 적용 범위

- 디자인 카드
- 첨부 파일 카드
- 파일 추가/drop 영역
- 디자인/첨부 empty state
- 메모 카드
- 메모 개수 뱃지
- 모바일 우측 패널 accordion wrapper

## 의미 기준

- `sidePanel.item`: 등록된 디자인/첨부/메모 항목 카드
- `sidePanel.preview`: 이미지 썸네일 또는 PDF 라벨이 들어가는 미리보기 면
- `sidePanel.upload`: 파일 추가 및 drag-and-drop 입력 영역
- `sidePanel.uploadActive`: 파일 drag 중인 상태
- `sidePanel.count`: 메모 개수 등 보조 카운트 뱃지
- `sidePanel.empty`: 디자인 없음, 첨부 없음, 메모 없음 상태
- `action.dangerSoft`: 디자인/첨부/메모 삭제 액션

## 유지한 사항

- 첨부 preview / 삭제 / 대표 디자인 지정 동작은 변경하지 않았다.
- 업로드/drag-and-drop 처리 로직은 변경하지 않았다.
- 메모 생성/수정/삭제 로직은 변경하지 않았다.
- 모바일 accordion 구조는 유지했다.

## 확인 항목

- 디자인/첨부 카드 배경과 테두리 톤이 작업지시서 전체 톤과 어울리는지 확인한다.
- 파일 추가 영역이 입력 가능한 영역으로 보이는지 확인한다.
- empty state가 다른 화면의 empty state와 같은 기준으로 보이는지 확인한다.
- 메모 카드와 메모 입력 영역의 시각적 위계가 과하지 않은지 확인한다.
