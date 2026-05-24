Version : 0.16.35
Summary : 작업지시서 기본값 순환 참조 오류 보정
Description : 작업지시서 기본값 상수에서 workorderOptions를 다시 import하던 구조를 제거하여 SEASON_OPTIONS 초기화 전 접근 Runtime ReferenceError를 방지했습니다. 기본 시즌과 우선순위 값은 workorderDefaults 내부의 단순 상수로 유지하고 APP_VERSION을 0.16.35로 갱신했습니다.
수정 파일 목록 :
- lib/constants/workorderDefaults.ts
- lib/constants/app.ts
추가 파일 목록 :
없음
삭제 파일 목록 :
없음
