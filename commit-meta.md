Version: 0.9.20

Summary: 첨부/스토리지 안정화 점검 및 썸네일 실패 복구 처리

Description:
- 첨부 원본 업로드가 성공한 뒤 썸네일 생성 또는 업로드만 실패하는 경우 전체 첨부 등록이 실패하지 않도록 처리했습니다.
- 썸네일 업로드 실패 시 DB에는 thumbnail_key를 저장하지 않고 원본 previewUrl 흐름으로 fallback되도록 정리했습니다.
- 업로드 완료 처리 시 원본 key와 썸네일 key의 URL 캐시를 함께 무효화했습니다.
- 삭제 히스토리 metadata에 thumbnailKey를 포함해 원본/썸네일 추적이 가능하도록 보완했습니다.
- 대표 디자인 이미지 변경 시 DB 조회/반환 컬럼에 thumbnail_key를 포함해 썸네일 매핑 누락 가능성을 줄였습니다.
- lib/constants/app.ts는 APP_VERSION만 0.9.20으로 변경했고 나머지 export는 유지했습니다.

수정 파일 목록:
- lib/constants/app.ts: APP_VERSION 0.9.20 반영, 나머지 export 유지
- lib/workorder/attachments/attachmentUploadApiClient.ts: 썸네일 실패 시 원본 업로드 유지 및 thumbnail_key 저장 제외 처리
- app/api/workorders/attachments/upload/complete/route.ts: 업로드 완료 시 thumbnailStorageKey 캐시 무효화 추가
- app/api/workorders/attachments/delete/route.ts: 삭제 로그 metadata에 thumbnailKey 추가
- lib/workorder/persistence/dbAttachmentMemoRepository.ts: 대표 디자인 조회/반환 컬럼에 thumbnail_key 포함
- commit-meta.md: 이번 작업 메타데이터 갱신

추가 파일 목록:
- 없음

삭제 파일 목록:
- 없음

작업 상세 내용:
- 0.9.19 썸네일 구조에서 남은 안정화 포인트를 보완했습니다.
- 원본 파일 업로드 성공 후 썸네일 처리만 실패하면 console.warn으로 기록하고 thumbnailStorageKey를 null 처리합니다.
- upload complete API에는 실제 성공한 썸네일 key만 전달됩니다.
- 빌드 검증은 현재 작업 환경에 node_modules가 없어 실행하지 못했습니다. package.json/package-lock.json은 수정하지 않았습니다.
