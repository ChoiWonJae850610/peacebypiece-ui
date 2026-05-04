Version :
0.9.163

Summary :
작업지시서 삭제 시 연결 파일과 메모를 함께 휴지통 처리

Description :
작업지시서 삭제 성공 후 해당 작업지시서에 연결된 디자인/첨부 파일을 함께 soft delete하고 attachment_trash_items에 등록하도록 보완했다. 연결 메모도 작업지시서 삭제 상태에 맞춰 숨김 처리했다. R2 원본과 썸네일은 즉시 삭제하지 않고 기존 30일 휴지통 및 시스템관리자 purge 후보 흐름을 유지한다.

수정 파일 목록 :
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/workorder-delete-cascade-trash-0.9.163.md

삭제 파일 목록 :
없음
