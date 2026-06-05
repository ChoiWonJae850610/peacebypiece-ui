# 0.18.33 저장소관리 요약 카드 컨테이너 기준 반응형 보정

## 목적

0.18.32에서 휴지통 목록에 적용한 컨테이너 폭 기준 반응형 판단을 저장소관리 상단 요약 카드에도 적용한다.

## 변경 범위

- FileStorageSummary
- APP_VERSION

## 반영 내용

- FileStorageSummary에 ResizeObserver 기반 useElementSize 적용
- 저장소 요약 영역의 실제 컨테이너 폭을 기준으로 narrow / medium / wide layout mode 결정
- wide: 요금제 용량 / 파일 운영 / 파일 유형 3열
- medium: 요금제 용량 / 파일 운영 2열 + 파일 유형 도넛 전체 폭
- narrow: 전체 1열

## 유지 사항

- WorkspaceShell 스크롤 구조 변경 없음
- 휴지통 복원/삭제/purge 흐름 변경 없음
- DB/API/R2/첨부/메모 흐름 변경 없음
