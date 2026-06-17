# Pending Tests — 0.23.48

- npm run audit:wafl-mutations
- node scripts/audit-wafl-mutations.mjs --strict 실행 시 전체 엔터티 캐스팅 후보 때문에 의도대로 실패하는지
- npm run audit:wafl-ui
- npm run build
- 감사 스크립트가 app/components/features/lib만 검사하는지
- 초기 조회 void 호출과 이벤트 경계 void 호출이 별도 분류되는지
- 직접 POST/PUT/PATCH/DELETE fetch 후보가 출력되는지
- WorkOrder/MaterialOrder 전체 엔터티 캐스팅 후보가 high-risk로 출력되는지
- 감사 스크립트 추가가 런타임 번들 및 화면 동작에 영향을 주지 않는지
- package.json과 package-lock.json이 동기화되어 있는지
## 0.23.50 작업지시서·발주서 비동기 mutation 정리
- 발주서 자재 종류 변경과 확인 모달 저장
- 발주서 상태 변경 및 검증 모달 확인
- 품목 수량·단가 수정, 추가, 제거
- 모바일 하단 도구에서 자재 추가
- 작업지시서 공장 전달사항 조회와 저장


## 0.23.51 WAFL mutation runtime contract

- 동일 resource/document lockKey의 중복 저장이 차단되는지 확인
- 같은 sequenceKey에서 이전 응답이 최신 상태를 덮지 않는지 확인
- onSuccess는 최신 revision에서만 실행되는지 확인
- mutation 실패 시 변경 범위 rollback 확인
- API 오류의 message/code/status 정규화 확인
- rollback/onError 실패가 최초 mutation 오류를 대체하지 않는지 확인
- 작업지시서 feedback wrapper의 rollback/getErrorMessage 옵션 확인
