Version : 0.15.89.1
Summary : 작업지시서 사용자 표시명 패치 오류 보정
Description : 0.15.89에서 사이드패널 view model에 users 전달이 누락되어 발생한 타입 체크 오류와 메모 패널 users undefined 런타임 오류를 함께 보정했습니다. 사이드패널 props에 최신 users 배열을 전달하고, 메모 작성자/담당자 표시명 resolve 로직이 users 미전달 상황에서도 안전하게 동작하도록 방어 처리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/workspace/builders/detailBuilders.ts
- components/workorder/sidepanel/WorkOrderMemoPanel.tsx
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
