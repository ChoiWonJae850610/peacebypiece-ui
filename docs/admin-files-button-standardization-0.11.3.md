# 0.11.3 관리자 저장소 버튼 표준화 1차

## 목적

관리자 화면 공통 UI 표준화 흐름에 맞춰 `/admin/files` 저장소 화면의 주요 액션 버튼을 `AdminButton` 기준으로 전환한다.

## 변경 범위

- `FileListSection` 문서/디자인 목록 액션 버튼
- `FileTrashSection` 휴지통 상단 액션 버튼
- `WorkOrderStorageSection` 작업지시서 저장소 준비중 버튼
- `FileStorageSummary` 요금제 업그레이드 준비 버튼

## 제외 범위

- 휴지통 상세/확인 모달 내부 버튼
- 휴지통 테이블 컬럼 내부 정렬/체크 버튼
- 저장소 데이터/API/DB 로직
- R2 purge/restore 흐름

위 항목은 다음 단계에서 별도 패치로 전환한다.
