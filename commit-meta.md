Version :
0.9.22374

Summary :
저장소 삭제 요청 요약 검증 기준 보강

Description :
관리자 저장소 snapshot API의 삭제 요청 요약을 attachment_trash_items의 purge_requested 첨부파일 기준으로 중복 제거해 개수와 용량을 합산하도록 보강했다. 작업지시서 삭제 요청 1건 안에 첨부파일 2개가 있으면 고객관리자 파일 운영 요약에는 삭제 요청 2개로 표시되는 검증 문서를 추가했다.

수정 파일 목록 :
- app/api/admin/files/snapshot/route.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-delete-request-summary-verification-0.9.22374.md

삭제 파일 목록 :
없음
