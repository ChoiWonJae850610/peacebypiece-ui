# 0.23.58 관리자 회사 파일·회사 설정 WAFL 전환

## 목적

관리자 회사 파일 및 환경설정 화면에 남아 있던 직접 API 호출과 화면별 저장 상태를 WAFL API client 및 mutation lifecycle로 통일한다.

## 적용 내용

- 회사 파일 목록 조회를 `waflLegacyApiRequest`로 전환
- 업로드 준비와 DB 메타데이터 저장 API를 공통 client로 전환
- 외부 R2 PUT은 presigned URL 직접 업로드 경계로 유지
- 파일 유형별 resource lock과 sequence/revision 적용
- 서비스 문의 조회·접수를 공통 API client와 mutation lifecycle로 전환
- 회사 계정 변경·탈퇴 요청을 공통 mutation lifecycle로 전환
- 회사 정보·구독·계정 요청 조회를 async/await 기반 공통 API client로 전환
- 조회 실패 시 mock/fallback 데이터로 대체하지 않고 각 영역 오류 상태 유지

## 위험 요소

R2 PUT 성공 후 DB 메타데이터 저장이 실패하면 저장소 객체가 남을 수 있다. 현재 API 계약에 보상 삭제 endpoint가 없으므로 진단 로그와 사용자 오류를 유지하고, 후속 저장소 정리 정책에서 orphan object 처리를 검토한다.

## 자동 검사

- WAFL UI Source Audit 성공
- WAFL Mutation Async Audit strict 성공
- 고위험 전체 엔터티 캐스팅 0건
- 관리자 직접 fetch 참고 지표 33건에서 24건으로 감소

## 미실행 검사

- npm run build
- TypeScript 전체 검사
- DB/API Smoke
- DB/API Permissions
- DB/API E2E
