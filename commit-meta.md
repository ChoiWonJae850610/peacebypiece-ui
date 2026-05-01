Version : 0.9.46

Summary : 관리자 i18n 하드코딩 잔여 제거

Description :
- 협력업체 검색 후보에 현재 언어의 유형 라벨을 함께 반영했습니다.
- DB 연결 점검 패널의 저장소 모드, 상태, 데이터 소스 라벨을 i18n 키로 출력하도록 정리했습니다.
- 한국어/영어 관리자 번역 키에 DB 연결 점검용 모드/상태/소스 타입 문구를 추가했습니다.
- APP_VERSION을 0.9.46으로 동기화했습니다.

수정 파일 목록 :
- lib/constants/app.ts : APP_VERSION을 0.9.46으로 변경
- lib/admin/partner/filters.ts : 협력업체 검색 후보에 번역된 유형 라벨 반영
- lib/admin/partner/presentation.ts : 협력업체 필터 검색에 typeLabels 전달
- components/admin/dashboard/AdminDbConnectionAuditPanel.tsx : DB 점검 라벨 i18n 연결
- lib/i18n/ko/admin.ts : DB 연결 점검 번역 키 추가
- lib/i18n/en/admin.ts : DB 연결 점검 번역 키 추가

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음

작업 상세 :
- 기존 화면에서 실제 데이터/샘플 데이터, 데이터 소스 상태, 점검 상태가 한국어 presentation 함수 결과에 의존하던 부분을 i18n 키 기반으로 바꿨습니다.
- 협력업체 관리의 유형 검색은 내부 한글 상수만 보지 않고 현재 언어의 유형 라벨도 같이 검색되도록 보완했습니다.
- package.json 및 package-lock.json은 수정하지 않았습니다.
