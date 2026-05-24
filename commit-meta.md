Version : 0.16.33
Summary : 작업지시서 목록 분류 경로 표시 보강
Description : 작업지시서 목록/상세 요약 조회에서 category*_id가 있을 때 item_categories 이름을 우선 사용하도록 보강했습니다. 카드 컴포넌트는 그대로 두고 repository select 단계에서 1차/2차/3차 분류명을 완성해 상의 > 티셔츠 > 반팔 형태가 목록 카드에 표시될 수 있게 정리했습니다. 기존 spec_sheets category 문자열은 fallback으로 유지했습니다.
수정 파일 목록 :
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/constants/app.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
