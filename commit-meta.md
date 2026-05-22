Version : 0.15.73.5
Summary : 작업지시서 생성 권한 세션 프로필 직접 반영
Description : 작업지시서 화면에서 /api/auth/me 기준 세션 프로필을 별도 hook으로 다시 확인하고, currentUser와 생성 권한 판정에 직접 병합했습니다. users 목록 또는 기존 derived state 전달 경로가 비어도 workorder.create 권한이 생성 버튼과 생성 액션 조건에 반영되도록 보정했습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/useWorkOrder.ts

추가 파일 목록 :
- lib/hooks/workorder/useWorkOrderSessionProfile.ts

삭제 파일 목록 :
