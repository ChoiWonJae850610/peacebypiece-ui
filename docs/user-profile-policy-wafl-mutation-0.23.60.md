# 0.23.60 일반 사용자 프로필·정책 WAFL API·mutation 전환

## 목적
개인 프로필과 정책 동의 화면에 남아 있던 직접 fetch와 화면별 저장 상태 처리를 공통 WAFL API 및 mutation lifecycle로 전환한다.

## 적용 내용
- 개인 프로필 조회를 `waflLegacyApiRequest`로 전환
- 프로필 저장·탈퇴 요청에 `useWaflMutation` lock, sequence/revision, 오류 정규화 적용
- 필수 정책 동의·재동의 조회를 공통 API client로 전환
- 필수 정책 동의·재동의 저장을 공통 mutation lifecycle로 전환
- 정책 재동의 접근 게이트 조회를 공통 API client로 전환
- 조회 실패 시 mock/fallback 데이터로 대체하지 않음

## 유지 사항
- 프로필 필수값 검증과 현재 사용자 갱신
- 탈퇴 요청 전 확인창
- 정책 동의·재동의 전 확인창
- 재동의 상태 조회 실패 시 업무 화면을 강제로 차단하지 않는 기존 정책

## 후속 작업
- native `window.confirm`을 WAFL ConfirmModal로 전환
- 관리자 영역 잔여 직접 fetch와 native UI 재감사
