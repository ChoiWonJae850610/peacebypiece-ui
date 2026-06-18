# 0.23.59 관리자 온보딩·테마·정책·기준정보 WAFL 전환

## 목적
관리자 온보딩, 회사 테마, 파일·알림 정책, 기준정보 옵션과 추가 요청에 남아 있던 직접 `fetch`와 `.then()` 체인을 공통 WAFL API 계약 및 `async/await` 경계로 통일한다.

## 적용 내용
- 회사 온보딩 조회·주소 검색·FormData 저장을 `waflLegacyApiRequest`로 전환했다.
- 온보딩 조회의 401/404 비차단 정책은 `WaflApiError.status` 기준으로 유지했다.
- 회사 테마 조회를 공통 API client와 async effect 함수로 전환했다.
- 파일 정책·알림 정책 모달 조회를 공통 API client로 전환했다.
- 회사 설정 저장 action flow의 직접 fetch를 공통 API client로 전환했다.
- 회사 기준 단위 옵션 조회의 `.then()` 체인을 제거했다.
- 관리자 기준정보 초기 조회, 생산품 유형 저장, 기준정보 추가 요청을 async/await로 통일했다.

## 유지한 경계
- React effect 자체는 Promise를 반환하지 않도록 내부 async 함수를 `void` 호출한다.
- 온보딩의 파일 선택·미리보기·필수값 검증과 기존 UI 구조는 변경하지 않았다.
- 외부 저장소 presigned URL 업로드와 저수준 API client 내부 fetch는 이번 화면 단위 감사 대상에서 제외한다.

## 감사 결과
- 관리자 영역 직접 fetch 참고 지표: 24건 → 15건
- 고위험 전체 엔터티 캐스팅: 0건 유지
- WAFL UI Source Audit 성공
- WAFL Mutation Async Audit strict 성공

## DB Migration
없음
