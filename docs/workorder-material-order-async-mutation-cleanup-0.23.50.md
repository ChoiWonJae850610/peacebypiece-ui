# 작업지시서·발주서 비동기 mutation 정리 — 0.23.50

## 목적
사용자 저장 경로에서 `void` 또는 `.then()`으로 Promise를 버리지 않고, 저장 완료까지 `await`하는 경로로 통일한다.

## 적용
- 발주서 자재 종류 변경과 확인 저장을 `await` 처리
- 발주서 상태 변경과 검증 확인 저장을 `await` 처리
- 발주 품목 수정·추가·제거를 `await` 처리
- 모바일 하단 도구 닫기 후 animation frame을 기다린 다음 자재 추가 저장
- 공장 전달사항 조회의 `.then()` 체인을 async/await로 변경
- 공장 전달사항 저장 callback에서 `void` 제거

## 유지한 경로
- effect 내부 초기 조회는 호출자가 Promise를 반환할 수 없으므로 `void load...()` 경계를 유지한다. 내부 async 함수에서 오류를 처리한다.
- 기존 WAFL lock, rollback, loading/success/error toast lifecycle은 유지한다.

## 위험 요소
- async callback을 받는 하위 컴포넌트 prop 타입이 지나치게 좁으면 로컬 TypeScript 검사에서 타입 오류가 발견될 수 있다.
- 빠른 연속 입력은 기존 mutation lock으로 차단되지만 실제 UI 회귀 확인이 필요하다.

## 직접 테스트
- 발주서 자재 종류 변경과 확인 모달 저장
- 발주서 상태 변경 및 검증 모달 확인
- 품목 수량·단가 수정, 추가, 제거
- 모바일 하단 도구에서 자재 추가
- 작업지시서 공장 전달사항 조회와 저장
