Version :
0.9.131

Summary :
첨부 카드 표시에서 썸네일 키 기반 URL 우선 사용

Description :
첨부 목록과 카드 표시에서 thumbnail_url이 비어 있어도 thumbnail_key가 있으면 기존 첨부 file proxy API로 썸네일 표시 URL을 생성하도록 보완했다. 원본 미리보기와 다운로드는 기존 원본 storage_key 기준을 유지했다. 대표 이미지 자동 지정과 삭제 후 승계 로직은 다음 버전 이후로 분리하고, 관련 기준 문서를 추가했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/permissions/attachments.ts
- docs/restore-baseline-0.9.121.md
- docs/attachment-primary-thumbnail-rules-0.9.130.md

추가 파일 목록 :
- docs/attachment-thumbnail-display-0.9.131.md

삭제 파일 목록 :
없음
