Version :
0.12.70

Summary :
관리자 파일과 협력업체 테이블 데이터 정렬 보정

Description :
저장소 관리 휴지통 테이블에서 삭제 대상을 제외한 삭제 일시, 작업지시서, 유형, 크기 데이터 셀을 중앙 정렬 기준으로 보정했다. 협력업체 관리 테이블에서도 업체명을 제외한 담당자명, 연락처, 이메일, 유형, 상태 데이터 셀과 헤더를 중앙 정렬 기준으로 정리했다. 테이블 정렬, 필터, 협력업체 CRUD, 휴지통 복원/삭제 흐름은 변경하지 않았다.

수정 파일 목록 :
- lib/constants/app.ts
- components/admin/files/fileTrashSectionColumns.tsx
- components/admin/partnerMaster/PartnerMasterList.tsx

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
