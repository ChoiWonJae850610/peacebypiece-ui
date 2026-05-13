# 0.11.28 관리자 저장소/첨부 목록 Table/List 잔여 정리

## 목적

0.11.27 조사 결과를 기준으로 `/admin/files` 저장소 관리 화면의 목록 표현을 작은 범위에서 정리한다.

이번 버전은 UI wrapper와 empty 표현 정리 중심이다. 삭제, 복원, 삭제 요청, 작업지시서 묶음 처리, R2 purge 흐름은 변경하지 않았다.

## 변경 범위

- `components/admin/common/AdminTable.tsx`
- `components/admin/files/FileListSection.tsx`
- `components/admin/files/FileTrashSection.tsx`
- `components/admin/files/WorkOrderStorageSection.tsx`

## 변경 내용

### 1. AdminTable empty 상태 확장

`AdminTable`에 아래 선택 prop을 추가했다.

- `emptyDescription`
- `emptyAction`

기존 `emptyLabel`만 사용하는 화면은 그대로 동작한다. 설명이나 액션이 필요한 화면만 추가 prop을 전달할 수 있다.

### 2. 저장소 파일 목록 empty 설명 추가

문서/디자인 목록이 비어 있을 때 단순히 없다는 문구만 표시하지 않고, 작업지시서에 업로드된 문서와 디자인 파일이 표시되는 영역임을 설명한다.

### 3. 휴지통 empty 설명 추가

휴지통 목록이 비어 있을 때 삭제한 작업지시서, 문서, 디자인, 메모가 복원 또는 삭제 요청 대상으로 표시된다는 설명을 추가했다.

### 4. 작업지시서 저장소 empty 설명 추가

삭제된 작업지시서와 함께 이동한 문서, 디자인, 메모 묶음이 표시되는 영역이라는 설명을 추가했다.

## 유지한 것

- `AdminTable` column 구조 유지
- `FileTrashSection` row sort 유지
- 선택/복원/삭제 요청 버튼 동작 유지
- 작업지시서 묶음 preview modal 동작 유지
- R2 purge 관련 action flow 변경 없음
- API 호출 조건 변경 없음
- DB schema 변경 없음

## 확인 포인트

로컬에서 0.11.28 적용 후 아래를 확인한다.

1. `/admin/files` 진입
2. 휴지통 목록이 비어 있을 때 empty title/description 표시 확인
3. 삭제된 작업지시서가 있을 때 row 클릭 detail modal 확인
4. 복원/선택 삭제/비우기 버튼 동작 확인
5. 문서/디자인 목록과 작업지시서 저장소 컴포넌트가 다시 연결될 경우 empty description이 깨지지 않는지 확인

## 다음 작업

0.11.29에서는 관리자 멤버/초대 화면의 Table/List 잔여 패턴을 정리한다.

주의:

- `join_requests` 승인/거절 API 변경 금지
- `member_permissions` 저장 로직 변경 금지
- 목록/empty/loading/error UI 정리 중심
