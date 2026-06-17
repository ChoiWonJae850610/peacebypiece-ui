# 작업지시서 단일 필드 PATCH 경량화 — 0.23.32

## 목적

작업지시서의 납기일·분류·담당자·수량·재고·제목 변경이 전체 작업지시서 저장 경로를 타지 않고 실제 변경 필드만 `spec_sheets`에 반영되도록 정리한다.

## 변경 내용

- `WorkOrderStatePatch`에 작업지시서 즉시 저장 대상 필드를 명시적으로 추가했다.
- 즉시 저장 전용 `persistImmediateWorkOrderPatchWithHistory`를 추가했다.
- 작업지시서 기본정보 즉시 변경과 담당자 변경을 전체 WorkOrder 저장에서 필드 PATCH로 전환했다.
- 서버 state PATCH에서 변경 필드 기반 저장 정책 검사를 수행한다.
- SQL assignment는 payload에 존재하는 필드만 생성한다.
- 생산 구성 변경이 없는 단일 필드 PATCH에서는 업데이트 후 상세 작업지시서를 다시 조회하지 않는다.
- 응답 patch에 기본정보 필드를 포함해 클라이언트의 현재 WorkOrder에 병합한다.

## 기대 효과

- 납기일·담당자·수량 등 단일 필드 변경 시 불필요한 전체 컬럼 UPDATE 제거
- 생산 구성 동기화 검사와 상세 재조회 경로 축소
- 서버리스 DB 왕복 횟수 감소
- 기존 권한·workflow 잠금 정책 유지

## 범위 밖

- 발주서 기본정보 PATCH 경량화
- DB 인덱스 및 legacy 컬럼 정리
- DB migration
