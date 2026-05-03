Version :
0.9.132

Summary :
첨부 카드 썸네일 표시 필드 호환 보완

Description :
작업지시서 첨부 카드 표시 URL 생성 시 camelCase 필드뿐 아니라 DB/API 응답에서 넘어올 수 있는 snake_case 필드도 읽도록 보완했다. thumbnail_key가 있으면 기존 file proxy API로 썸네일 표시 URL을 생성하고, 미리보기와 다운로드는 원본 경로를 유지한다. 대표 이미지 자동 지정과 삭제 후 승계 로직은 이번 버전에 적용하지 않았다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/permissions/attachments.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/attachment-thumbnail-display-0.9.132.md

삭제 파일 목록 :
없음
