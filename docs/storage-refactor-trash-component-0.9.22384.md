# 0.9.22384 저장소 휴지통 화면 컴포넌트 리팩토링

## 목적

고객관리자 저장소 휴지통 화면의 row 조립, 컬럼 정렬 상수, 용량 표시, 작업지시서 단계 계산 로직을 `FileTrashSection.tsx`에서 분리했다.

## 변경 내용

- `components/admin/files/fileTrashSectionRows.ts` 추가
- 휴지통 통합 row 생성 로직을 분리
- 휴지통 테이블 컬럼 클래스/그리드 상수 분리
- 용량 표시 함수 분리
- 작업지시서 단계 계산 상수/함수 분리
- 기존 화면 구조와 버튼 동작은 유지

## 유지 정책

- DB schema 변경 없음
- R2 Worker 기반 삭제 흐름 유지
- package.json / package-lock.json 수정 없음
- 휴지통 버튼명/정렬/비우기 모달 동작 변경 없음
