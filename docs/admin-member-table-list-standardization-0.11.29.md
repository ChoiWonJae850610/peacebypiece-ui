# 0.11.29 관리자 멤버/초대 화면 Table/List 잔여 정리

## 목적

관리자 멤버관리 화면에서 직접 grid/list로 남아 있는 목록 패턴을 점검하고, 동작 위험이 낮은 초대 대기 목록부터 `AdminTable` 기준으로 정리했다.

## 확인 범위

- `components/admin/members/AdminMemberManagementDashboard.tsx`
- 멤버 목록
- 초대 대기 목록
- 가입 신청/승인 대기 목록
- 권한 체크박스 영역
- loading / empty / error 메시지 영역

## 적용 내용

### 초대 대기 목록

기존에는 직접 header grid와 empty state를 별도로 구성했다.
이번 버전에서는 초대 대기 목록을 `AdminTable`로 전환했다.

- `AdminTable`의 `emptyLabel`, `emptyDescription` 사용
- 초대 대상, 초대 유형, 상태, 만료일 컬럼 정의
- 향후 실제 invitation 데이터가 연결되어도 동일 테이블 구조로 표시 가능
- i18n key fallback 유지

### AdminTable 입력 타입 보완

`AdminTable`의 `items` 타입을 `TItem[]`에서 `readonly TItem[]`로 넓혔다.

이유:

- presentation 계층에서 `readonly` 배열을 반환하는 함수가 많음
- 데이터를 복사하지 않고 공통 테이블에 전달 가능
- 기존 mutable array 사용처와 호환됨

## 즉시 변경하지 않은 영역

### 멤버 목록

멤버 목록은 한 row 아래에 권한 체크박스 edit grid가 붙어 있다.
단순 table 치환 시 아래 위험이 있다.

- 권한 저장 버튼 위치 변경
- 권한 체크박스 접근성 변경
- `memberPermissionDrafts`와 row 확장 UI 결합 구조 변경
- 저장 중/disabled 조건 회귀 가능성

따라서 이번 버전에서는 변경하지 않았다.

### 가입 신청/승인 대기 목록

가입 신청 목록은 승인/거절 버튼과 join request review action flow가 직접 연결되어 있다.
단순 table 치환 시 아래 위험이 있다.

- 승인/거절 버튼 disabled 조건 변경
- 처리 중 표시 변경
- 승인/거절 API 호출 회귀 가능성
- 권한 부여 흐름과의 연결 변경

따라서 이번 버전에서는 변경하지 않았다.

## 후속 후보

0.11.30 이후 시스템관리자 잔여 공통 UI 정리 전후로 아래 중 하나를 선택한다.

1. 멤버 목록을 row renderer 지원형 공통 컴포넌트로 분리
2. `AdminTable`에 expanded row slot을 추가
3. 가입 신청 목록만 먼저 `AdminTable`로 치환하되 action column을 별도 함수로 분리
4. 권한 체크박스 grid는 별도 `MemberPermissionDraftGrid`로 분리 후 table 전환

## 회귀 확인 항목

- `/admin/members` 진입
- 초대 대기 목록 empty 상태 표시
- 초대 링크 생성 버튼 동작
- 멤버 목록 로딩/empty/error 표시
- 멤버 권한 체크박스 토글
- 권한 저장 버튼 disabled 조건
- 가입 신청 승인/거절 버튼 표시

## 변경하지 않은 것

- join_requests 승인/거절 API
- member_permissions 저장 API
- 초대 생성 API
- 권한 코드 구조
- DB schema
