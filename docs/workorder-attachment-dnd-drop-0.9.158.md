# 0.9.158 작업지시서 드래그 업로드 drop 이벤트 보완

## 목표

0.9.157에서 `onUploadAttachmentFiles is not a function` 런타임 에러는 막았지만, 실제 파일 drop 시 업로드 반응이 없는 문제를 보완한다.

## 적용 범위

- 디자인/첨부 패널 전체에서 파일 dragOver/drop 이벤트를 받을 수 있도록 보완
- 점선 업로드 안내 영역을 `button` 대신 `role=button` div로 변경
- drag/drop 이벤트에서 `preventDefault`, `stopPropagation`, 파일 추출을 명확히 처리
- 기존 파일 선택 업로드 흐름은 유지

## 유지한 사항

- R2 Worker 업로드 방식 유지
- 썸네일 생성 흐름 유지
- 첨부 삭제/복구 흐름 유지
- 메모 저장 흐름 유지
- DB schema 변경 없음
- package.json / package-lock.json 변경 없음

## 테스트 기준

1. 디자인 패널에 이미지 파일을 드래그하면 점선 안내 영역 또는 패널에 drag 상태가 표시된다.
2. drop 후 디자인 첨부로 업로드된다.
3. 첨부 패널에 PDF/이미지 파일을 drop하면 첨부 파일로 업로드된다.
4. 기존 `... > 파일 추가` 업로드도 정상 동작한다.
