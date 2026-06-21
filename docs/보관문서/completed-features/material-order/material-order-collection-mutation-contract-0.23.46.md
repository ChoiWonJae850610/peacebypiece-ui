# Material Order Collection Mutation Contract — 0.23.46

## 목표

발주서 품목과 작업지시서 할당 저장은 단일 필드 PATCH가 아니라 컬렉션 교체 작업이다. 이 작업도 WAFL 공통 mutation 결과 계약을 사용하되, 전체 발주서 목록을 다시 조회하거나 전체 객체 배열로 교체하지 않는다.

## 변경 계약

- 서버는 상세 저장 transaction을 완료한 뒤 변경된 발주서 한 건의 collection patch만 반환한다.
- 응답 필드:
  - supplierPartnerId
  - supplierPartnerName
  - note
  - dueDate
  - totalAmount
  - lines 및 allocations
  - updatedAt
- 클라이언트는 현재 MaterialOrder 객체에 위 patch만 병합한다.
- 다른 발주서 목록과 선택 상태는 유지한다.
- 상태 변경 전에 상세 저장이 필요한 경우 상세 collection mutation 완료를 await한 후 상태 mutation을 실행한다.

## DB 원자성

상세 저장은 기존 transaction 범위를 유지한다.

1. 발주서 header 금액·공급처·메모·납기일 갱신
2. 기존 allocations 삭제
3. 기존 lines 삭제
4. 새 lines 입력
5. 새 allocations 입력
6. 전체 성공 시 commit, 실패 시 rollback

## 비동기 저장 감사

프로젝트 전역의 비동기 호출을 검색한 결과, 사용자 변경을 DB에 저장하는 mutation과 단순 조회 effect를 분리해야 한다.

- 허용: useEffect 내부 초기 조회 fire-and-forget
- 금지: 사용자 저장 mutation을 `void promise`로 실행하고 성공 처리
- 후속 감사 대상:
  - 작업지시서 사용자·권한 저장
  - 작업지시서 상세 로딩과 선택 전환
  - 파트너 옵션 조회
  - 관리자 설정 조회

0.23.46에서는 발주서 collection mutation 계약을 적용하고, 프로젝트 전체 비동기 호출은 후속 버전에서 위험도별로 전환한다.
