Version : 0.9.42

Summary : 히스토리 로그 정책 고정

Description :
- 관리자 히스토리에 노출할 로그 액션과 대상 타입을 중앙 상수로 분리했습니다.
- 히스토리 목록 조회 단계에서 허용된 이벤트 타입과 대상 타입만 가져오도록 제한했습니다.
- 화면 selector에서도 동일한 중앙 정책을 사용해 DB 조회 결과와 화면 필터 기준이 어긋나지 않도록 정리했습니다.
- 환경설정/시스템/디버그성 로그가 운영자용 히스토리에 섞이지 않도록 표시 정책을 강화했습니다.

수정 파일 목록 :
- lib/constants/app.ts : APP_VERSION을 0.9.42로 갱신했습니다.
- lib/constants/history.ts : 관리자 히스토리 노출 허용 액션/대상 타입과 판별 함수를 추가했습니다.
- lib/admin/history/selectors.ts : 히스토리 화면 표시 여부 판단을 중앙 history 정책 함수 기준으로 변경했습니다.
- lib/admin/history/repository.ts : DB 조회 단계에서 허용 로그 액션/대상 타입만 조회하고, 결과 매핑도 중앙 정책으로 재검증하도록 변경했습니다.

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음

작업 상세 :
- 0.9.41 기준 압축파일을 실제로 해제한 뒤 히스토리 관련 계층을 확인했습니다.
- 기존 selector 내부에 흩어져 있던 히스토리 허용 액션 목록을 lib/constants/history.ts로 이동했습니다.
- HISTORY_LOG_ACTION_TYPES에는 PARTNER_CREATED, PARTNER_DELETED를 포함해 DB 타입과 화면 i18n의 이벤트 목록을 맞췄습니다.
- ADMIN_VISIBLE_HISTORY_LOG_ACTION_TYPES와 ADMIN_VISIBLE_HISTORY_LOG_TARGET_TYPES를 별도로 두어 운영자 히스토리에 보여줄 범위를 명확히 했습니다.
- repository 조회 SQL에서 settings/system 제외 조건 대신 중앙 허용 목록 기반 조건을 사용하도록 변경했습니다.
- 화면 selector도 같은 허용 정책을 사용하므로 DB 결과와 mock/historyLogs 결과가 같은 기준으로 필터링됩니다.
- npm 빌드는 별도 요청이 없고 현재 작업 흐름이 모바일 최소 응답이므로 수행하지 않았습니다.
