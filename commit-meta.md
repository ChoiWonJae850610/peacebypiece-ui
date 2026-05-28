Version : 0.17.66
Summary : 원단·부자재 발주서 상태 전환 흐름 정리
Description : 원단·부자재 발주서 진행단계 액션 정의를 공통 유틸로 분리하고, 서버 상태 전환 검증과 상태 변경 후 잔여 수량 재조회 흐름을 보강했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- features/material-orders/components/MaterialOrderStatusFlow.tsx
- features/material-orders/hooks/useMaterialOrderDraftEditor.ts
- lib/material-orders/repository.ts
- pending-tests.md
추가 파일 목록 :
- lib/material-orders/statusFlow.ts
삭제 파일 목록 :
- 없음
