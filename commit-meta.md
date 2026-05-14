Version : 0.11.76
Summary : 생산구성 상위 선택 변경 시 거래처 초기화
Description : 작업지시서 생산구성에서 원단/부자재 구분 변경 시 기존 거래처와 거래처 참조값을 초기화하고, 외주공정 변경 시 기존 외주처를 초기화하도록 보정했습니다. 상위 선택값에 종속되는 하위 업체 선택값이 잘못 유지되는 문제를 방지했습니다. 기본 단위 자동 설정과 runtimeMode 플래그 정리는 후속 버전에서 별도 처리합니다.
수정 파일 목록 :
- lib/hooks/workorder/detailEditor/materialMutations.ts
- lib/hooks/workorder/detailEditor/itemMutations.ts
- lib/constants/app.ts
추가 파일 목록 :
- docs/qa-workorder-production-composition-dependent-reset-0.11.76.md
삭제 파일 목록 :
