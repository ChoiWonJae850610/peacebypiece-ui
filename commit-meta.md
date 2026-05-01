Version : 0.9.41

Summary : 관리자 i18n 잔여 정리

Description :
- 관리자 환경설정 화면의 샘플 고객사명 fallback을 i18n 키로 분리했습니다.
- 파일 정책 모달의 용량 상태 라벨과 설명을 i18n 키 기반으로 표시하도록 정리했습니다.
- 용량 상태 preview selector에서 한글 문구를 직접 반환하지 않도록 정리했습니다.
- APP_VERSION을 0.9.41로 동기화했습니다.

수정 파일 목록 :
- lib/constants/app.ts : APP_VERSION을 0.9.41로 변경
- components/admin/settings/AdminCompanySettingsForm.tsx : 샘플 고객사 fallback을 i18n 텍스트로 변경
- components/admin/standards/AdminFilePolicySettingsModal.tsx : 용량 상태 라벨/설명을 i18n 경로로 출력
- lib/admin/settings/presentation.ts : 용량 상태 preview가 tone/임계값 중심 데이터를 반환하도록 변경
- lib/i18n/ko/admin.ts : 샘플 고객사명 및 용량 상태 i18n 키 추가
- lib/i18n/en/admin.ts : 샘플 고객사명 및 용량 상태 i18n 키 추가
- commit-meta.md : 0.9.41 작업 메타데이터 갱신

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음

작업 상세 :
- 환경설정 영어 전환 시 샘플 고객사명이 한글 fallback으로 남는 문제를 줄였습니다.
- 파일 정책 모달에서 정상/주의/위험 및 임계값 설명이 언어별 문구로 표시되도록 정리했습니다.
- 모바일 최소 응답 규칙에 맞춰 상세 작업 내용은 commit-meta.md에 포함했습니다.
- npm build는 요청되지 않아 실행하지 않았습니다.
