Version
- 0.9.5 → 0.9.6

Summary
- 관리자 히스토리 상세 문구의 내부 코드값 표시를 운영 화면 표현으로 정리

Description
- 히스토리 카드와 상세 영역에서 action/status/target/detail label 코드값이 그대로 보이지 않도록 presentation 변환 범위를 확장했다.
- draft, pending, active, inactive, system, workorder 같은 내부 값은 화면 표시 시 i18n 라벨로 치환되도록 정리했다.
- 히스토리 상세 라인의 label/value 변환을 lib/admin/history/presentation.ts에 모아 tsx 화면 컴포넌트에는 판단 로직을 추가하지 않았다.
- APP_VERSION을 0.9.6으로 동기화했다.

수정 파일 목록
- lib/constants/app.ts: APP_VERSION을 0.9.6으로 갱신.
- lib/i18n/ko/admin.ts: 히스토리 action/status/detail label/target type/system actor 표시 문구를 추가.
- lib/i18n/en/admin.ts: 동일 i18n 키의 영문 문구를 동기화.
- lib/admin/history/presentation.ts: 히스토리 상세 카드의 내부 코드값을 화면 표시용 라벨로 변환하는 presentation 함수를 확장.

작업 상세 내용
- 기능 변경 없음.
- UI 구조 변경 없음.
- package.json / package-lock.json 수정 없음.
- 히스토리 상세 영역과 작은 카드에서 내부 코드값이 고객사 관리자 화면에 직접 노출될 가능성을 줄였다.
- 남은 작업은 관리자 상수/presentation/util 중복 정리와 mock 데이터 제거 가능 범위 판정이다.
