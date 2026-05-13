Version :
0.11.54

Summary :
협력업체 외주 공정 저장 오류 수정

Description :
협력업체 수정 모달에서 시스템 기준정보 외주 공정을 선택한 뒤 저장할 때 partner_items의 고객사 외주 공정 FK와 맞지 않아 저장 실패가 발생할 수 있는 문제를 보정했다. 저장 시 시스템 외주 공정 기준을 고객사 외주 공정으로 해석하거나 생성한 뒤 연결하고, 다시 조회할 때 화면 선택 상태가 유지되도록 매핑을 보완했다.

수정 파일 목록 :
- lib/partners/dbPartnerRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/qa-partner-outsourcing-process-save-0.11.54.md

삭제 파일 목록 :
없음
