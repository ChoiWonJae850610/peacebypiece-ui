# PeaceByPiece 첨부 대표 이미지 / 썸네일 규칙 0.9.130

## 기준

- 기준 버전: `0.9.129`
- 결과 버전: `0.9.130`
- 목적: 원본 첨부 업로드 성공 흐름을 유지하면서 썸네일 Worker 업로드 실패를 안전하게 처리하고, 대표 이미지/첨부 미세 로직 적용 기준을 문서화한다.

## 이번 버전의 코드 적용 범위

1. 원본 첨부 업로드, DB metadata 저장, 삭제 흐름은 변경하지 않는다.
2. 썸네일 업로드 실패는 전체 업로드 실패로 취급하지 않는다.
3. 썸네일 실패 로그는 Error 객체 stack을 그대로 출력하지 않고, 원인 메시지와 thumbnail key만 기록한다.
4. Worker 파일은 썸네일 key를 명시적으로 허용하는 형태로 정리한다.
5. 대표 이미지 자동 지정/삭제 후 승계는 이번 버전에서 문서화만 하고 코드 적용은 0.9.131 이후로 분리한다.

## 썸네일 Worker 업로드 판단

현재 원본 첨부 업로드는 정상이며, `upload/complete`도 200으로 완료된다. 다만 썸네일 업로드에서 `INVALID_WORKER_FILE_REQUEST`가 발생할 수 있다. 이 경우 업무 데이터는 다음 상태가 정상 기준이다.

- 원본 파일은 R2에 존재한다.
- attachment metadata는 DB에 저장된다.
- 화면 미리보기와 다운로드는 원본 key 기준으로 동작한다.
- thumbnail key는 저장하지 않거나 null로 처리한다.
- 전체 첨부 업로드를 실패로 되돌리지 않는다.

## Worker 배포 확인 필요 항목

`cloudflare/r2-upload-worker.js`는 다음 key를 허용해야 한다.

- `workorders/{workOrderId}/design/{fileId}.{ext}`
- `workorders/{workOrderId}/attachments/{fileId}.{ext}`
- `workorders/{workOrderId}/memos/{fileId}.{ext}`
- `workorders/{workOrderId}/thumbnails/design/{fileId}.webp`
- `workorders/{workOrderId}/thumbnails/attachments/{fileId}.webp`
- `workorders/{workOrderId}/thumbnails/memos/{fileId}.webp`

Worker가 예전 코드로 배포되어 있으면 앱 코드가 맞아도 썸네일 업로드는 `INVALID_WORKER_FILE_REQUEST`를 반환할 수 있다. 이 경우 Worker를 최신 파일로 배포해야 한다.

## 대표 이미지 미세 로직 적용 기준

0.9.131 이후 코드 적용 후보는 아래 순서로 처리한다.

1. 디자인 첨부가 없는 상태에서 이미지가 처음 업로드되면 자동으로 대표 이미지가 된다.
2. 디자인 첨부가 여러 개이면 대표 이미지는 항상 1개만 유지한다.
3. 대표 이미지가 삭제되면 남은 활성 디자인 첨부 중 가장 오래된 항목을 대표로 승계한다.
4. PDF, 일반 첨부, 메모 첨부는 대표 이미지 후보에서 제외한다.
5. 삭제된 첨부는 대표 이미지 후보에서 제외한다.
6. 모든 디자인 첨부가 삭제되면 대표 이미지 없음 상태를 허용한다.
7. 새로고침 후에도 대표 상태가 DB 기준으로 유지되어야 한다.

## 0.9.130 적용 후 테스트

1. 이미지 첨부 업로드
   - 원본 첨부가 R2에 저장되는지 확인한다.
   - `/api/workorders/attachments/upload/complete`가 200인지 확인한다.
   - 썸네일 실패가 발생해도 화면에 원본 첨부가 남는지 확인한다.

2. Worker 최신 배포 확인
   - Cloudflare Worker를 최신 `cloudflare/r2-upload-worker.js`로 배포한다.
   - 다시 이미지 첨부를 업로드한다.
   - 썸네일 업로드에서 `INVALID_WORKER_FILE_REQUEST`가 사라지는지 확인한다.

3. 회귀 확인
   - 첨부 다운로드가 정상인지 확인한다.
   - 첨부 삭제가 정상인지 확인한다.
   - 메모 저장과 상태전환 후 유지가 정상인지 확인한다.


## 0.9.131 표시 URL 보완

0.9.131에서는 `thumbnail_url` 컬럼이 비어 있어도 `thumbnail_key`가 있으면 기존 첨부 file proxy API로 썸네일 표시 URL을 생성하도록 보완한다.

- 카드/목록 표시: 썸네일 우선
- 확대 미리보기: 원본 유지
- 다운로드: 원본 유지
- 대표 이미지 자동 지정/승계: 0.9.132 이후 분리
