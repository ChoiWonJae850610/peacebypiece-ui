Version : 0.17.73
Summary : 원단·부자재 발주 할당 source_material_key 저장 보정
Description : 원단·부자재 발주서 상세 저장 API에서 allocation.sourceMaterialKey가 누락되어 DB source_material_key가 null로 저장될 수 있던 문제를 보정했습니다. 저장된 source_material_key 기준으로 같은 작업지시서 자재의 부분 발주/잔여 수량 계산이 이어지도록 했습니다.
수정 파일 목록 :
- app/api/material-orders/route.ts
- lib/constants/app.ts
추가 파일 목록 :
없음
삭제 파일 목록 :
없음
