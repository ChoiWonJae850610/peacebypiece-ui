# 0.11.37 관리자 모달 공통화 2차

## 목적

0.11.36에서 시스템 기준정보 모달을 `AdminModal`로 전환한 뒤, 남은 `ModalShell` 직접 사용처 중 고객관리자 저장소 휴지통 모달을 공통 관리자 모달 패턴으로 추가 정리한다.

## 변경 범위

### 전환 대상

- `components/admin/files/fileTrashSectionModals.tsx`
  - `EmptyTrashConfirmModal`
  - `WorkOrderActionPreviewModal`
  - `TrashDetailModal`

### 공통 컴포넌트 보강

- `components/admin/layout/AdminModal.tsx`
  - `minHeightClassName` 옵션 추가
  - 기본값은 기존 관리자 모달과 동일하게 `md:min-h-[360px]` 유지
  - 단순 확인 모달은 `minHeightClassName=""`로 과한 최소 높이를 피할 수 있게 처리

## 유지한 항목

- 휴지통 비우기 확인 문구
- 작업지시서 복원/선택 삭제 preview 로직
- 파일/작업지시서 상세 모달 내용
- 복원/선택 삭제 버튼 disabled 조건
- 고객관리자 삭제 요청 처리 흐름
- 시스템관리자 R2 purge 흐름
- API 요청/응답 구조
- DB schema

## 변경하지 않은 항목

- `components/common/modal/ModalShell.tsx`
- `components/common/modal/BaseModal.tsx`
- `components/common/modal/modalUtils.ts`
- 저장소 action flow
- R2 Worker 기반 purge 처리

## 회귀 확인 필요 항목

1. `/admin/files` 진입
2. 휴지통 탭 진입
3. 휴지통 비우기 모달 열기/닫기
4. 휴지통 비우기 예/아니오 버튼 동작
5. 작업지시서 row 복원 preview 모달 열기/닫기
6. 작업지시서 row 선택 삭제 preview 모달 열기/닫기
7. 파일/작업지시서 상세 모달 열기/닫기
8. 복원/선택 삭제 버튼 disabled 조건 유지 확인
9. 모바일 폭에서 닫기 버튼과 footer button 위치 확인

## 판단

이번 버전은 저장소 휴지통 모달의 wrapper를 `AdminModal`로 정리하는 작업이다. 실제 삭제/복원/R2 purge 로직은 변경하지 않았다. `AdminModal`에 최소 높이 옵션을 추가해 단순 확인 모달과 정보량이 많은 모달의 시각적 밀도를 분리할 수 있게 했다.
