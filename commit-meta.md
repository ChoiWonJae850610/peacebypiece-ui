Version : 0.15.73.9
Summary : 작업지시서 목록 요약 조회 company scope 컬럼 누락 보정
Description : 작업지시서 목록 요약 CTE에서 company_id/company_name을 선택하지 않아 summary count 조인에서 s.company_id 오류가 발생하던 문제를 수정했습니다. 상세/목록 select base에 company scope 컬럼을 명시하고 앱 버전을 0.15.73.9로 갱신했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
삭제 파일 목록 :
