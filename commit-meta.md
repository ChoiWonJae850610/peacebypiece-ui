Version :
0.13.83

Summary :
작업지시서 조회 범위와 멤버 권한 guard 보정

Description :
작업지시서 조회 scope에 고객사 전체 조회와 멤버 담당 범위를 분리하는 visibility 기준을 추가했다. 고객사 관리자는 같은 회사의 모든 작업지시서를 조회할 수 있고, 일반 멤버는 본인 사용자 또는 멤버 식별자에 연결된 작업지시서만 조회하도록 DB query layer를 보정했다. 작업지시서 조회, 생성, 수정, 삭제 API에도 멤버 권한 guard와 접근 불가 항목의 404 응답을 추가했다.

수정 파일 목록 :
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
