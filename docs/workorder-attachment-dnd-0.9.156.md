# 0.9.156 작업지시서 디자인/첨부 드래그 업로드 연결

## 목적

0.9.155에서 디자인/첨부 패널에 점선 업로드 안내 영역을 추가했지만 실제 drag-and-drop 업로드는 연결하지 않았다. 0.9.156에서는 기존 파일 선택 업로드 로직을 재사용해 PC 화면에서 파일을 직접 놓아 업로드할 수 있도록 연결한다.

## 적용 범위

- 디자인 패널 점선 영역에 파일을 drop하면 `design` scope로 업로드한다.
- 첨부 패널 점선 영역에 파일을 drop하면 `attachment` scope로 업로드한다.
- 기존 파일 선택 버튼과 `...` 메뉴의 파일 추가 동작은 그대로 유지한다.
- 업로드 API, R2 Worker, thumbnail 생성, 삭제/복구 로직은 변경하지 않는다.

## 구현 기준

- `useWorkOrderAttachments` 내부 업로드 처리 흐름을 `uploadAttachmentFileList`로 분리했다.
- input change와 drop upload가 같은 업로드 처리 함수를 사용한다.
- side panel props에는 `onUploadAttachmentFiles(scope, files)`를 추가했다.
- `WorkOrderAttachmentPanel`은 drag active 상태를 표시하고, drop 시 전달받은 file list를 업로드한다.

## 보류 항목

- 직접 그리기 라이브러리 연결
- 그린 이미지를 디자인 첨부로 저장
- drop 중 파일 타입/용량 사전 검증 UI
- 모바일/태블릿 drag-and-drop UX 세부 최적화

## 테스트 기준

1. 디자인 패널 점선 영역에 이미지 파일을 drop한다.
2. design scope로 R2/DB 저장되는지 확인한다.
3. 첨부 패널 점선 영역에 PDF 또는 이미지 파일을 drop한다.
4. attachment scope로 R2/DB 저장되는지 확인한다.
5. 기존 `... > 파일 추가` 업로드가 계속 동작하는지 확인한다.
6. 썸네일 생성/표시, 삭제/복구, 메모 저장 기능이 기존처럼 유지되는지 확인한다.
