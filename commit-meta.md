Version: 0.9.22

Summary: 관리자 히스토리 표시 구조 정리

Description:
- 관리자 히스토리 화면에서 시스템/설정/디버그 성격의 로그와 허용되지 않은 raw action 표시를 제외했습니다.
- history filter 라벨을 workorder presentation 의존에서 admin i18n 기준으로 분리했습니다.
- companyId, partnerId, targetId, actionType, rawAction, updatedSection 등 내부 식별자/개발자용 상세 라벨은 상세 표시에서 숨기도록 보강했습니다.
- 히스토리 요약 문구는 raw message fallback 대신 action summary / 상태 전환 / 대상 유형 중심으로 표시되도록 정리했습니다.
- 히스토리 목록 영역 높이를 고정하고 내부 스크롤 구조로 정리했습니다.
- 히스토리 목록 key를 index 조합 대신 item.id 기반으로 안정화했습니다.
- lib/constants/app.ts는 APP_VERSION만 0.9.22로 변경했고 나머지 export는 보존했습니다.

수정 파일 목록:
- lib/admin/history/selectors.ts: 히스토리 표시 허용 action 필터, 시스템 로그 제외, admin i18n 필터 라벨 연결, 검색 대상 내부 필드 제외
- lib/admin/history/presentation.ts: 내부 상세 라벨 숨김 보강, raw message fallback 제거, section view model i18n 주입 구조 적용
- components/admin/history/AdminWorkOrderHistoryPage.tsx: 현재 locale의 admin i18n을 히스토리 view model에 전달
- components/admin/history/AdminHistoryList.tsx: 목록 높이 고정, 내부 스크롤, 안정적인 item.id key 적용
- lib/i18n/ko/admin.ts: 히스토리 필터 라벨 i18n 추가
- lib/i18n/en/admin.ts: 히스토리 필터 라벨 i18n 추가
- lib/constants/app.ts: APP_VERSION만 0.9.22로 변경

작업 상세 내용:
- 요청사항 중 히스토리 화면의 관리자용 표시 정리, 내부 코드값 숨김, i18n 필터 라벨 보강, 목록 스크롤 구조를 우선 처리했습니다.
- DB에 이미 저장된 metadata 자체는 삭제하지 않고 presentation 단계에서 숨기는 방식으로 처리했습니다.
- 로그 이벤트 생성 정책 자체를 환경설정 모달 기준으로 완전히 제한하는 작업은 다음 버전에서 별도 actionFlow/repository 단위로 진행해야 합니다.

검증:
- package.json / package-lock.json은 수정하지 않았습니다.
- 현재 실행 환경에서 node_modules 설치가 완료되지 않아 npm run build는 완료 검증하지 못했습니다.
