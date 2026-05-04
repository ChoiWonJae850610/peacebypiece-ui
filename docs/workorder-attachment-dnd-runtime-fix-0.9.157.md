# 0.9.157 작업지시서 디자인/첨부 드래그 업로드 런타임 에러 보완

## 목적

0.9.156에서 디자인/첨부 패널의 점선 안내 영역에 drag-and-drop 업로드를 연결했으나, 실제 drop 시 일부 렌더링 경로에서 `onUploadAttachmentFiles is not a function` 런타임 에러가 발생했다.

이번 버전은 업로드 로직 자체를 바꾸지 않고, side panel 계층 사이의 handler 전달 누락을 보완한다.

## 변경 기준

- desktop 공통 section에서 `onUploadAttachmentFiles`를 attachment section까지 전달한다.
- tablet 전용 side panel view에서도 같은 handler를 전달한다.
- mobile accordion attachment section에서도 같은 handler를 전달한다.
- handler가 없는 경로에서도 drop 시 화면이 중단되지 않도록 runtime guard를 둔다.
- 기존 파일 선택 업로드는 그대로 유지한다.

## 변경하지 않는 것

- R2 Worker 업로드 방식
- 썸네일 생성 방식
- 첨부 삭제/복구 방식
- 메모 저장/상태전환 유지 방식
- 직접 그리기 기능
- DB schema
- package.json / package-lock.json

## 테스트 기준

1. 작업지시서 우측 디자인 영역에 이미지 파일을 drop한다.
2. 런타임 에러 없이 업로드가 진행되는지 확인한다.
3. 디자인 scope로 저장되고 R2의 `design/`, `thumbnails/design/` key가 생성되는지 확인한다.
4. 첨부 영역에 PDF 또는 이미지 파일을 drop한다.
5. attachment scope로 저장되는지 확인한다.
6. 기존 `... > 파일 추가` 업로드도 그대로 동작하는지 확인한다.
