# 0.20.64 작업지시서 select 닫힘 및 외주공정 업체 옵션 보정

## 목적

작업지시서 생성 모달, 구성 편집 모달, 공정 편집 모달에서 AppSelect 드롭다운이 열린 뒤 trigger 재클릭 또는 모달 내부 다른 영역 클릭으로 닫히지 않는 문제를 보정했다.

## 변경

- AppSelect에 document capture 단계의 pointerdown 감지를 추가해 모달 panel의 stopPropagation 영향을 받지 않고 바깥 클릭을 감지한다.
- AppSelect trigger/content 내부 클릭은 유지하고, 외부 클릭은 드롭다운을 닫는다.
- 열린 상태에서 trigger/화살표를 다시 누르면 드롭다운을 닫는다.
- Select portal content의 기본 z-index를 모달 위에서도 안정적으로 보이도록 상향했다.
- 외주공정 업체 선택은 기존 row id별 옵션만 사용하지 않고 API에서 내려온 전체 외주 업체 옵션을 함께 사용한다.

## 비변경

- 작업지시서 저장/API/DB/R2/권한/상태전환 흐름은 변경하지 않았다.
- 파트너 옵션 API 구조는 변경하지 않았다.
