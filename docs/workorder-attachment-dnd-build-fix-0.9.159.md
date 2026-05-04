# 작업지시서 디자인/첨부 드래그 업로드 빌드 보완 (0.9.159)

## 목적

0.9.158 적용 후 `WorkOrderWorkspace`에서 `attachments.handleAttachmentFileDrop`을 참조하지만, `useWorkOrder`가 외부로 노출하는 `attachments` 객체에는 해당 handler가 포함되지 않아 TypeScript build가 실패했다.

## 수정 내용

- `useWorkOrder`의 `attachments` 반환 객체에 `handleAttachmentFileDrop`을 추가했다.
- `WorkOrderWorkspace`에서 기존처럼 `attachments.handleAttachmentFileDrop`을 사용할 수 있도록 prop 전달 경로를 복구했다.
- 드래그 업로드 디버깅을 위해 개발 환경에서만 콘솔 로그가 출력되도록 했다.

## 로그 정책

개발 환경에서 파일을 drop하면 아래 형식의 로그가 출력된다.

```text
[attachment-dnd:design] drop on panel { fileCount, fileNames }
[attachment-dnd:attachment] drop on hint { fileCount, fileNames }
```

운영 build에서는 `process.env.NODE_ENV === "production"` 조건으로 로그가 출력되지 않는다.

## 변경하지 않은 항목

- R2 Worker 업로드 로직
- 썸네일 생성 로직
- 첨부 삭제/복구 로직
- 메모 저장 로직
- DB schema
- package.json / package-lock.json
