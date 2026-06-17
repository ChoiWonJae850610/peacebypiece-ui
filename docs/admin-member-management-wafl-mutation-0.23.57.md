# 0.23.57 관리자 멤버 관리 WAFL API·mutation 전환

## 목적
관리자 멤버 관리 화면에 분산된 직접 fetch와 개별 저장 상태를 WAFL API client 및 공통 mutation lifecycle로 정리한다.

## 적용
- 멤버·가입 신청·초대 목록 조회를 `waflLegacyApiRequest`로 전환
- 멤버 빠른 상태 변경과 상세 저장을 `useWaflMutation`으로 전환
- 가입 신청 승인·거절을 요청별 lock과 sequence/revision으로 전환
- 멤버 초대 생성·취소를 공통 loading/success/error lifecycle로 전환
- API 응답의 `ok` 및 필수 엔터티를 검증한 뒤 로컬 상태 반영

## 유지
- 기존 역할·권한 검증과 오류 코드별 사용자 문구
- 멤버 목록·가입 신청·초대 화면 구조
- 탈퇴 완료의 기존 확인창은 이번 범위에서 유지

## 위험
실제 API 응답 계약과 초대/멤버 권한 흐름은 통합 테스트에서 확인해야 한다.
