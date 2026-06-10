# WAFL storage/file Foundation expansion 0.21.28

## 목적
저장소/첨부/파일 UI를 작업지시서 기준 WAFL Foundation으로 확장한다. 파일 목록, 휴지통 row, 작업지시서 저장소 요약, 첨부 preview/delete modal에서 직접 shape 조합을 줄이고 control/surface foundation을 명시한다.

## 적용 기준
- panel은 `surface` foundation을 유지한다.
- file row, trash row, empty box, preview box, summary card는 `control` foundation을 우선한다.
- file thumbnail/icon은 `icon` foundation을 쓴다.
- 선택/현재/위험 상태는 shape 변경이 아니라 tone/border/background로만 구분한다.

## 적용 대상
- 저장소 파일 목록 panel
- 작업지시서 저장소 panel, warning box, summary card
- 휴지통 compact empty/row 상태 표시
- 휴지통 작업지시서 단계 inline box
- 첨부 preview modal download/image/pdf wrapper
- 첨부 delete confirm modal file icon/pdf preview wrapper
- 공통 `WaflFileCard` shape 기준

## 예외
다음은 실제 원형/그래프 의미가 있어 직접 rounded를 유지한다.
- progress track
- chart segment/dot
- storage cylinder
- spinner

## 확인 포인트
- 저장소 목록 panel과 작업지시서 panel이 작업지시서/발주 panel과 같은 계열로 보이는지
- 휴지통 compact row와 empty box가 과하게 둥글지 않은지
- 첨부 preview modal의 이미지/PDF wrapper가 모달 내부 control/surface와 따로 놀지 않는지
- 파일 thumbnail/icon이 기존 rounded-xl 느낌보다 WAFL icon family로 보이는지
