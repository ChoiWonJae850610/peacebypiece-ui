# 시스템관리자 데이터·mutation 1차 정리 — 0.23.54

## 범위
- 회사 계정 요청 검토
- 회사 파일 검토
- legacy API 응답 공통 요청 함수

## 변경
- 시스템관리자 화면의 직접 fetch를 `waflLegacyApiRequest`로 전환했다.
- 승인·반려 mutation을 `useWaflMutation`의 lock, sequence/revision, 오류 정규화, toast lifecycle로 통합했다.
- 동일 요청과 동일 파일의 중복 처리를 차단했다.
- 성공 응답이 최신 요청일 때만 목록 상태를 교체한다.
- API가 `ok` 또는 필수 엔터티를 반환하지 않으면 실패로 처리한다.
- 조회 실패 시 mock 또는 fallback 데이터로 대체하지 않고 오류 상태를 유지한다.

## 감사 결과
- system 직접 fetch 참고 지표: 28건 → 24건
- 고위험 전체 엔터티 캐스팅: 0건
- legacy UI 위반: 0건

## 남은 시스템관리자 1차 대상
- `SystemCompanyApprovalConsole`의 초대·가입 승인·반려·재입력 mutation
- 시스템 초대 화면
- 시스템 기준정보 저장 화면
- native confirm의 WAFL ConfirmModal 전환은 0.23.55 UI 단계에서 처리

## 위험 및 회귀 확인
- 기존 API envelope가 legacy `{ ok, ... }` 구조이므로 공통 legacy reader를 사용한다.
- 서버 성공 후 응답 엔터티가 없으면 로컬 상태를 변경하지 않는다.
- 승인/반려 버튼의 기존 확인창은 UI 전환 전까지 유지한다.
