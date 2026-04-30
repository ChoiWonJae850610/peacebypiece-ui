Version: 0.9.13

Summary: 관리자 히스토리 표시 구조를 운영용 문구 중심으로 정리

Description:
- 히스토리 목록에서 companyId, partnerId, action_type, target_id 등 내부 식별자/코드성 상세값을 표시하지 않도록 정리했습니다.
- 주요 이벤트 요약을 작업지시서 생성됨, 협력업체 수정됨, 첨부파일 삭제됨처럼 관리자용 문구로 변환했습니다.
- 시스템 설정성 로그는 관리자 히스토리 목록과 사용자 필터 후보에서 제외되도록 중앙 selector에 표시 정책을 추가했습니다.
- 히스토리 안내 문구를 운영용 기준으로 조정했습니다.
- lib/constants/app.ts는 APP_VERSION만 0.9.13으로 변경하고 나머지 export는 유지했습니다.

수정 파일 목록:
- lib/constants/app.ts: APP_VERSION을 0.9.13으로 갱신하고 기존 저장소/레포지토리 mode export 유지
- lib/admin/history/presentation.ts: 히스토리 상세 숨김 필드 처리, 관리자용 요약 문구 변환, 상세 라인 view model 정리
- lib/admin/history/selectors.ts: 시스템 설정성 로그 제외 정책과 사용자 필터 후보 정리 적용
- lib/i18n/ko/admin.ts: 히스토리 운영용 요약 문구 및 이벤트 요약 번역 추가
- lib/i18n/en/admin.ts: 히스토리 운영용 요약 문구 및 이벤트 요약 번역 추가

작업 상세 내용:
- 내부 DB 필드와 raw action 값이 화면 상세 라인에 노출되지 않도록 presentation 계층에서 필터링했습니다.
- action code가 그대로 보이는 경우를 줄이기 위해 historyPage.summaries를 추가하고 action별 운영 문구를 우선 표시하도록 했습니다.
- 시스템 actor가 settings 로그를 만든 경우 표시 대상에서 제외했습니다.
- 히스토리 사용자 필터도 표시 대상 로그 기준으로만 생성되도록 조정했습니다.

빌드 확인:
- npm run build 시도했으나 현재 압축파일에 node_modules가 포함되어 있지 않아 next 명령을 찾지 못해 실행 불가했습니다.
- package.json / package-lock.json은 수정하지 않았습니다.
