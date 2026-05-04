# 0.9.160 작업지시서 직접 그리기 placeholder 및 drag upload build 보완

## 목적

0.9.159 기준에서 확인된 drag-and-drop 업로드 TypeScript build 오류를 수정하고, 디자인 영역의 `직접 그리기` 메뉴를 준비 안내 모달로 연결한다.

## build 오류 보완

- `AttachmentScope`에는 `memo`가 포함되어 있지만 작업지시서 첨부 업로드 action flow는 `design | attachment`만 허용한다.
- `useWorkOrderAttachments` 내부 업로드 helper와 drop handler의 scope 타입을 `design | attachment`로 좁혔다.
- 메모 scope가 첨부 업로드 action flow로 들어가지 않도록 타입 경계를 명확히 했다.

## 직접 그리기 placeholder

- 디자인 panel의 `...` 메뉴에서 `직접 그리기` 항목을 클릭할 수 있게 했다.
- 클릭 시 준비 안내 모달이 열린다.
- 현재 버전에서는 실제 canvas/drawing 라이브러리를 연결하지 않는다.
- 그린 이미지를 디자인 첨부로 저장하는 흐름도 아직 연결하지 않는다.

## 유지한 것

- 기존 파일 선택 업로드 유지
- drag-and-drop 업로드 유지
- R2 Worker 업로드 유지
- 썸네일 생성 흐름 유지
- 첨부 삭제/복구 흐름 유지
- 메모 저장 흐름 유지
- DB schema 변경 없음
