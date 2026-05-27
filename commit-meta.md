Version : 0.17.30
Summary : 작업지시서 납기일 전환 조건과 빌드 오류 보정
Description : 검토요청/검토완료/발주요청 단계에서 납기일 필수 검증을 제거하고, 자재 발주 완료 이후 납기일 입력 흐름으로 분리할 수 있도록 전환 조건을 정리했습니다. Material 타입에 없는 lossCost 매핑으로 발생한 빌드 타입 오류를 제거했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderDetailRows.ts
- lib/workorder/orderSubmission.ts
- lib/workorder/workflow.ts
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
추가 파일 목록 :
삭제 파일 목록 :
