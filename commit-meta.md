Version : 0.9.38

Summary : 환경설정 정책 마감 및 빌드 타입 오류 수정

Description :
- 히스토리 표시 로직에서 null 라벨을 index key로 사용하던 TypeScript 오류 수정
- 삭제 방식이 즉시삭제일 때 삭제 파일 보관 기간 선택 영역이 보이지 않도록 정리
- 삭제 파일 보관 기간 명칭과 안내 문구를 한글/영문 i18n에 반영
- 용량 상태 기준을 정상/주의/위험 단계로 보여주도록 표시 정책 보강
- APP_VERSION 값을 0.9.38로 동기화
- npm 빌드는 의존성 설치 단계가 제한 시간 내 완료되지 않아 최종 실행 완료는 못함

수정 파일 목록 :
- lib/admin/history/presentation.ts : detail label이 null일 때 index 접근이 발생하지 않도록 normalized label 처리 보강
- lib/admin/settings/presentation.ts : 용량 상태 기준 preview를 정상/주의/위험 단계로 계산하는 표시 정책 추가
- components/admin/standards/AdminFilePolicySettingsModal.tsx : 즉시삭제 선택 시 삭제 파일 보관 기간 선택 버튼 숨김 처리 및 용량 위험 기준 안내 추가
- lib/i18n/ko/admin.ts : 파일 정책 문구를 삭제 파일 보관 기간/용량 주의 기준 중심으로 보완
- lib/i18n/en/admin.ts : 파일 정책 영문 문구를 삭제 파일 보관 기간/용량 주의 기준 중심으로 보완
- lib/constants/app.ts : APP_VERSION 0.9.38 반영
- commit-meta.md : 이번 작업 메타 정보 갱신

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음

작업 상세 :
- 빌드 로그의 ./lib/admin/history/presentation.ts:121 오류를 기준으로 label 값이 null 또는 undefined인 경우를 먼저 차단하도록 수정
- isDisplayableHistoryDetailLabel 통과 이후에도 TypeScript가 label을 string으로 좁히지 못하는 문제를 명시 조건으로 해결
- 저장 정책 모달에서 삭제 방식이 즉시삭제이면 보관기간 버튼을 disabled로 남기지 않고 별도 안내 문구만 표시하도록 변경
- 휴지통 삭제 방식으로 전환할 때 기본 보관기간 fallback을 5일로 맞춤
- 용량 상태 preview를 warningThresholdPercent 기준의 정상/주의/위험 구간 설명으로 정리
- 위험 기준은 현재 DB 스키마 변경 없이 주의 기준보다 10% 높은 표시 기준으로 계산
- npm ci가 제한 시간 내 완료되지 않아 node_modules 생성과 npm run build 최종 확인은 완료하지 못함
