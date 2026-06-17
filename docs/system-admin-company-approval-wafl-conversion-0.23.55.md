# 시스템관리자 고객사 승인·초대 WAFL 전환 — 0.23.55

## 목적

시스템관리자 고객사 관리 화면에 남아 있던 직접 fetch, 화면별 개별 mutation 상태, native input/button, 임의 모달 구조를 WAFL 공통 계약으로 정리합니다.

## 적용 내용

- 초대 목록과 고객사 가입 신청 목록 조회를 `waflLegacyApiRequest`로 통일
- 초대 링크 생성·취소를 `useWaflMutation`의 resource lock과 sequence/revision lifecycle로 전환
- 고객사 승인·거절·재입력 요청을 공통 `runCompanyReviewMutation`으로 통합
- 처리 완료 후 고객사 목록과 초대 목록을 병렬 재조회
- 전달 대상 native input을 `WaflInput`으로 전환
- 상태 필터 native button을 `WaflButton`으로 전환
- 고객사 상세 overlay를 WAFL Modal header/body/footer와 section 구조로 전환
- 조회 실패 시 mock 또는 fallback 데이터로 자동 대체하지 않음

## 유지한 동작

- 초대 링크 복사
- 이메일·휴대폰 전달 안내
- 고객사 필터와 목록 선택
- 승인·거절·재입력 요청 정책
- 회사 파일 미리보기와 다운로드
- 기존 API endpoint 및 응답 계약

## 위험 요소

- 현재 API는 legacy `{ ok, ... }` 응답을 사용하므로 payload의 `ok`와 필수 목록 필드를 계속 검증합니다.
- 승인 처리 후 두 목록을 함께 다시 읽으므로 한쪽 조회가 실패할 경우 화면별 오류 상태를 수동 확인해야 합니다.
- 상세 모달의 반응형 높이와 footer 고정 상태는 실제 브라우저 테스트가 필요합니다.

## DB Migration

없음
