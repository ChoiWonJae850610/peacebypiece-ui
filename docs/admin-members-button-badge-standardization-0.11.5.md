# 0.11.5 관리자 멤버관리 버튼·상태 라벨 표준화

## 목적

`/admin/members` 화면에 남아 있던 개별 버튼 className, 상태 라벨 className, 로컬 empty state 구현을 관리자 공통 UI 컴포넌트 기준으로 정리한다.

## 적용 내용

- `AdminButton` 적용
  - 초대 링크 생성 화면 이동
  - 조직 설정 보기
  - 초대 링크 복사
  - 초대 생성
  - 승인 처리 액션 preview 버튼
  - 멤버 권한 저장
  - 가입 신청 승인/거절
- `AdminStatusBadge` 적용
  - 초대 설정 카드 상태
  - 승인 단계/액션 상태
  - 멤버 상태
  - 가입 신청 이메일 비교 상태
  - 가입 신청 상태
  - 권한 카드 노출/숨김 상태
  - 권한 그룹 권한 수
- `AdminEmptyState` 적용
  - 멤버 목록 loading/empty
  - 가입 신청 목록 loading/empty
  - 초대 대기 empty

## 제외 범위

- 멤버관리 API, DB, 권한 저장 로직 변경 없음
- 멤버관리 테이블/목록 레이아웃 변경 없음
- 모달 구조 변경 없음
- i18n key 변경 없음

## 다음 단계 후보

- `/admin/members`의 테이블/목록 패턴 표준화
- `/system/*` 개별 페이지의 버튼/상태 라벨 표준화
- 공통 table/list empty/loading/error 패턴 확대
