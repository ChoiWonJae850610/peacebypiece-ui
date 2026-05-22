Version :
0.15.73

Summary :
생산구성 partner 조인 전환 기반 정리

Description :
원단·부자재와 외주공정 현재값 테이블에 거래처 조인용 vendor_partner_id 기반을 추가하고, 기존 vendor 문자열은 표시 snapshot으로 유지하도록 schema, repository, 타입, 문서를 정리했다. 작업지시서 상세 hydration과 저장 repository가 vendorPartnerId를 보존할 수 있게 보정했다.

수정 파일 목록 :
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- docs/wafl-a-type/90_wafl-a-type-production-join-audit.md
- lib/constants/app.ts
- lib/workorder/material/materialDefaults.ts
- lib/workorder/repository/dbSpecSheetMaterialRepository.ts
- lib/workorder/repository/dbSpecSheetOutsourcingRepository.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- types/material.ts
- types/workorder.ts

추가 파일 목록 :
- docs/wafl-a-type/91_wafl-a-type-production-partner-join-transition.md

삭제 파일 목록 :
없음
