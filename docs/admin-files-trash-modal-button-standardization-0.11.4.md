# 0.11.4 관리자 저장소 휴지통 모달 버튼 표준화

## 목적

`/admin/files` 휴지통 관련 모달 footer에 남아 있던 개별 버튼 className을 `AdminButton` 공통 컴포넌트로 전환한다.

## 변경 범위

- 휴지통 비우기 확인 모달
- 작업지시서 복원/선택 삭제 범위 확인 모달
- 휴지통 상세 모달

## 적용 기준

- 닫기/아니오: `variant="secondary"`
- 복원: `variant="primary"`
- 선택 삭제/비우기 확인: `variant="danger"`

## 제외 범위

- 휴지통 테이블의 체크박스형 선택 버튼
- 정렬 header 버튼
- 저장소 데이터/API/R2 purge/restore 흐름

위 항목은 이번 패치에서 변경하지 않았다.
