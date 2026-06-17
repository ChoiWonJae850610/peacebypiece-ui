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
