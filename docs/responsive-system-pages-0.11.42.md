# 0.11.42 모바일 시스템관리자 화면 보정

## 작업 목표

시스템관리자 주요 화면의 모바일/태블릿 표시를 작은 범위로 보정한다.

## 적용 범위

- `/system`
- `/system/storage-usage`
- `/system/companies`
- 시스템관리자 통계 overview 섹션

## 반영 내용

### 시스템 홈

- 시스템 콘솔 외곽 padding을 모바일에서 줄였다.
- 상단 header padding과 제목 크기를 모바일 폭 기준으로 낮췄다.
- navigation card가 작은 폭에서는 세로 정렬되고, `sm` 폭부터 2열로 전환되도록 조정했다.

### 시스템 저장소 사용량

- `/system/storage-usage` 상단 header와 요약 카드 padding을 모바일 기준으로 보정했다.
- 요약 카드는 모바일 1열, `sm` 폭 2열, 데스크톱 5열 구조로 유지했다.
- 실제 삭제 후보 목록의 action button 영역을 모바일에서 grid로 정리했다.
- 실제 삭제 후보 table row/header에 최소 너비를 부여해 좁은 폭에서는 내부 가로 스크롤로 접근하도록 했다.

### 시스템 고객사 승인

- `/system/companies` 외곽 padding과 header/card padding을 모바일 기준으로 보정했다.
- 상단 action link/button은 모바일에서 세로로 쌓이도록 조정했다.
- 가입 신청 검토 table row에 최소 너비를 부여해 모바일에서 내용이 찌그러지지 않고 내부 스크롤로 접근하도록 했다.
- 승인/거절 버튼은 모바일에서 세로 배치, `sm` 이상에서 가로 배치되도록 조정했다.

### 시스템 통계 overview

- 통계 카드, R2 purge 상태, 저장소 용량 구분, 고객사별 사용 현황의 title/badge row가 모바일에서 세로 배치되도록 조정했다.
- 저장 용량 진행률의 label/value가 모바일에서 줄바꿈되도록 조정했다.

## 변경하지 않은 것

- 고객사 승인/거절 API
- join_requests 조회 조건
- storage purge API
- R2 실제 삭제/재시도 로직
- audit log / billing / standards domain logic
- DB schema
- package.json / package-lock.json

## 확인 항목

1. `/system` 모바일 폭에서 header, navigation card grid가 화면 밖으로 밀리지 않는지 확인한다.
2. `/system/storage-usage` 모바일 폭에서 요약 카드와 실제 삭제 후보 목록이 내부 스크롤로 접근 가능한지 확인한다.
3. `/system/storage-usage` 선택 삭제/전체삭제/새로고침 버튼이 모바일에서 잘리지 않는지 확인한다.
4. `/system/companies` 모바일 폭에서 가입 신청 table과 승인/거절 버튼이 접근 가능한지 확인한다.
5. `/system/companies` 승인/거절 action flow가 기존과 동일하게 동작하는지 확인한다.
