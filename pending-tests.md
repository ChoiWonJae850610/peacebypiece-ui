# Pending Tests — 0.23.44

- npm run build
- 리오더 그룹 재고 0 → 12 변경 시 그룹 구성원 전체 반영
- 발주요청 이후 작업지시서가 그룹에 포함돼도 재고 수정 성공
- 그룹 구성원 일부 업데이트 실패 시 전체 rollback
- 서로 다른 리오더 그룹 ID를 한 요청에 보내면 차단
- 재고 변경 후 분류·납기일·담당자·수량 유지
- 재고 저장 성공 후 WaflPatchResult 배열의 재고 필드만 병합
- 실패 시 Runtime Error overlay 없이 danger 토스트 표시
- 새로고침 후 그룹 구성원 재고 동일성 확인
