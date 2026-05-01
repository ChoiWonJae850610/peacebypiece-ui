Version : 0.9.43

Summary : 통계 이벤트 보존 구조 추가

Description :
- 관리자 통계가 현재 활성 데이터만 보지 않도록 누적 이벤트 테이블 패치를 추가했습니다.
- 삭제된 작업지시서의 제작 차수와 공장별 불량/입고지연 통계를 보존할 수 있는 DB 구조를 추가했습니다.
- 통계 이벤트 타입과 제작 차수 메타데이터 키를 중앙 상수로 분리했습니다.
- APP_VERSION을 0.9.43으로 갱신했습니다.

수정 파일 목록 :
- lib/constants/app.ts : APP_VERSION을 0.9.43으로 갱신했습니다.
- lib/constants/adminStats.ts : 관리자 통계 이벤트 타입과 제작 차수 보존 메타데이터 키 상수를 추가했습니다.

추가 파일 목록 :
- db/schema/patch_0_9_43_admin_stats_events.sql : 관리자 통계 누적 이벤트 테이블과 인덱스 생성 패치를 추가했습니다.

삭제 파일 목록 :
- 없음

작업 상세 :
- 0.9.42 압축파일을 실제로 해제한 뒤 통계 관련 파일과 DB 스키마 파일을 확인했습니다.
- 기존 통계 화면은 현재 spec_sheets, orders, attachments 중심으로 계산되어 삭제된 1차/2차/3차 작업지시서의 통계 보존에 한계가 있었습니다.
- admin_stats_events 테이블을 추가해 작업지시서 생성, 상태 변경, 검수 완료, 불량, 입고지연 이벤트를 누적 저장할 수 있게 했습니다.
- production_round, production_round_label, factory_partner_id, factory_name, due_date, inspected_at, is_defect, is_inbound_delayed 컬럼을 두어 이후 공장별/차수별 통계 조회 확장에 사용할 수 있게 했습니다.
- 이번 버전은 DB 구조 보강 중심이며, 화면 조회 로직을 admin_stats_events 기준으로 전환하는 작업은 다음 버전에서 진행하는 것이 안전합니다.
