Version :
0.10.96

Summary :
작업지시서 하위 정규 테이블 저장 보정

Description :
작업지시서 정규화 이후 spec_sheet_materials와 spec_sheet_outsourcing_lines 동기화 코드에 남아 있던 payload 호환 분기를 제거했다. orders, spec_sheet_materials, spec_sheet_outsourcing_lines schema 조회도 모듈 단위 캐시로 보정해 저장 시 반복되는 information_schema 조회 비용을 줄였다.

수정 파일 목록 :
- lib/workorder/repository/dbFactoryOrderRepository.ts
- lib/workorder/repository/dbSpecSheetMaterialRepository.ts
- lib/workorder/repository/dbSpecSheetOutsourcingRepository.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-normalized-detail-schema-cleanup-0.10.96.md

삭제 파일 목록 :
없음
