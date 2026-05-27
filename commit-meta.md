Version : 0.17.38
Summary : 원단·부자재 상태 라벨 런타임 오류 보정
Description : 원단·부자재 주문 패널에서 상태 라벨 포맷 함수를 누락 없이 import하도록 수정하고 APP_VERSION을 0.17.38로 갱신했습니다. formatMaterialOrderStatusLabel 미정의로 발생하던 런타임 오류와 빌드 타입 오류를 보정했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- features/material-orders/MaterialOrderDetailPanel.tsx
추가 파일 목록 :
삭제 파일 목록 :
