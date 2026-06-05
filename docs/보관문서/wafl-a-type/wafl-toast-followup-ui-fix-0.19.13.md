# 0.19.13 WAFL Toast 실제 검수 보정 및 주변 UI 회귀 보정

## 목적

0.19.12 적용 후 실제 화면 테스트에서 확인된 toast tone, 통계정보 새로고침, 멤버 초대 목록 action button 문제를 좁은 범위에서 보정한다.

## 반영 범위

- WAFL Toast tone 색상을 theme/semantic token 기반으로 정리한다.
- 통계정보 화면에 데이터 새로고침 action을 추가하고, 새로고침 시작/완료 toast를 표시한다.
- 멤버관리 초대 목록의 링크 복사/초대 취소 버튼을 저장소관리의 icon action button 흐름과 맞춘다.
- 취소/만료/사용 완료된 초대는 링크 복사 버튼을 비활성화한다.

## Toast tone 기준

- `success`: 저장, 변경, 복원, 초대 취소 등 완료 결과
- `danger`: 실패, 오류, 위험 결과
- `warning`: 주의가 필요한 상태
- `info`: 일반 안내
- `loading`: DB/API/화면 전환 처리 중

화면별로 직접 색상 class를 지정하지 않고, toast type과 semantic token으로 색상을 결정한다.

## 통계정보 새로고침 기준

통계정보 화면의 새로고침은 브라우저 전체 reload가 아니라 통계 데이터 refresh 성격으로 처리한다.

- 새로고침 시작: `통계 데이터를 불러오는 중입니다.` loading toast
- 새로고침 완료: `통계 데이터를 새로고침했습니다.` success toast
- 현재 탭/필터/기간 UI 상태는 가능한 유지한다.

## 멤버 초대 목록 버튼 기준

- 가입 대기/사용 가능 상태: 링크 복사 가능, 초대 취소 가능
- 취소됨/만료됨/사용됨: 링크 복사 불가
- 취소 처리 중: 취소 버튼 pending 표시
- 버튼은 compact icon action button 형태로 맞춘다.

## 변경 금지

- 초대 생성/취소 API 흐름 변경 금지
- 멤버 승인/권한 저장 로직 변경 금지
- 통계 계산식 변경 금지
- DB schema 변경 금지
- R2/첨부/메모/휴지통/purge 흐름 변경 금지
