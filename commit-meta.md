Version : 0.9.34 → 0.9.35

Summary : 관리자 화면 i18n 누락 전수 정리 1차

Description :
- 저장소 사용 현황의 상태 뱃지, 개수/일수 단위, 파일 유형 라벨이 언어 전환 기준을 따르도록 보강했습니다.
- 통계정보 화면을 클라이언트 i18n 기준으로 다시 표시하도록 전환하고, 서버에서 넘어온 주요 한국어 라벨을 현재 언어 라벨로 매핑했습니다.
- 통계정보의 기간 버튼, 요약 카드, 작업 흐름, 협력업체 분포, 파일 사용량, 생산 단계 라벨의 영어 전환 누락을 줄였습니다.
- 관리자 사이드바의 nav aria-label과 운영 대시보드 차트 aria-label도 i18n 토큰을 사용하도록 보강했습니다.
- 생산 단계 통계의 1차/2차/3차 이상 라벨을 statsUi i18n 자원 기준으로 표시하도록 정리했습니다.
- APP_VERSION 값을 0.9.35로 동기화했습니다.
- npm 빌드는 사용자 요청에 따라 실행하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts : APP_VERSION 값을 0.9.35로 갱신했습니다.
- lib/i18n/ko/admin.ts : 관리자 공통 메뉴 aria-label, 저장소 상태/단위, 통계 생산 단계 라벨의 한국어 i18n 키를 추가했습니다.
- lib/i18n/en/admin.ts : 관리자 공통 메뉴 aria-label, 저장소 상태/단위, 통계 생산 단계 라벨의 영어 i18n 키를 추가했습니다.
- components/admin/layout/AdminSidebar.tsx : 관리자 메뉴 nav aria-label을 i18n 기반으로 전환했습니다.
- components/admin/files/FileStorageSummary.tsx : 저장소 상태 뱃지와 개수/일수 단위를 현재 언어 기준으로 표시하도록 보강했습니다.
- components/admin/dashboard/AdminStatsDashboard.tsx : 통계정보 화면을 클라이언트 i18n 컴포넌트로 전환하고 주요 서버 라벨을 현재 언어 라벨로 매핑했습니다.
- components/admin/dashboard/AdminOperationsDashboard.tsx : 상태 흐름 차트 aria-label의 건 단위를 i18n 공통 단위로 전환했습니다.
- lib/admin/stats/selectors.ts : 생산 단계 fallback 라벨을 statsUi i18n 자원 기준으로 생성하도록 변경했습니다.
- commit-meta.md : 모바일 최소 응답 모드용 산출물 메타 문서를 0.9.35 기준으로 갱신했습니다.

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음

작업 상세 :
- 기존 0.9.34에는 i18n 자원이 일부 추가되어 있었지만, 통계정보 화면은 서버에서 기본 한국어 i18n 객체를 받아 렌더링하는 구조라 언어 변경 후에도 제목/요약/그래프 라벨이 많이 남을 수 있었습니다.
- AdminStatsDashboard를 클라이언트 컴포넌트로 전환해 useAdminTranslation을 직접 사용하고, 서버 snapshot에 포함된 주요 라벨을 화면 표시 시점에 현재 언어 기준으로 변환하도록 보완했습니다.
- 저장소 관리 화면의 statusLabel은 DB/adapter에서 한국어로 들어올 수 있어 statusTone 기준으로 정상/주의/위험 라벨을 다시 변환하도록 처리했습니다.
- 첨부파일 수와 보관 기간 값은 기존처럼 숫자 문자열을 유지하되, 뒤의 개/일 단위만 현재 언어 단위로 바꿔 표시하도록 보완했습니다.
- 통계 생산 단계 fallback은 더 이상 고정 문자열 1차/2차/3차를 직접 사용하지 않고 i18n 자원에서 가져오도록 정리했습니다.
- package.json 및 package-lock.json은 수정하지 않았습니다.

검증 :
- npm 빌드는 사용자 요청에 따라 실행하지 않았습니다.
- commit-meta.md 파일에 Version, Summary, Description, 수정 파일 목록, 추가 파일 목록, 삭제 파일 목록 항목과 콜론(:) 토큰이 포함된 것을 확인했습니다.
- APP_VERSION 값이 0.9.35로 반영된 것을 확인했습니다.
