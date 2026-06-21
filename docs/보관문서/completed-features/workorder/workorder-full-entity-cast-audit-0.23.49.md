# WorkOrder 전체 엔터티 캐스팅 감사 — 0.23.49

## 목적

`audit:wafl-mutations`에서 고위험으로 탐지된 WorkOrder 전체 엔터티 캐스팅 8건을 실제 위험 코드와 정상 타입 좁히기로 분리하고, 불필요한 전체 엔터티 강제 캐스팅을 제거한다.

## 분석 결과

- 불필요한 전체 WorkOrder 강제 캐스팅: 5건
- 정상적인 indexed access 타입 좁히기: 3건
- 부분 PATCH 응답을 WorkOrder 전체 객체로 직접 캐스팅한 사례: 0건

## 적용 내용

1. 전체 저장 시 audit actor를 WorkOrder 객체에 임시로 합치던 캐스팅 제거
   - audit actor는 기존 `WorkorderMutationOptions.auditActor`로만 전달
2. API PATCH 정책 검사용 병합 객체를 명시적 `WorkOrder` 변수로 검증
3. 런타임 audit actor 호환 읽기를 `unknown` 객체 검사로 변경
4. 주문 요청 가능 여부 확인용 불완전 WorkOrder 생성 제거
   - 현재 사용자 권한을 직접 확인
5. mutation audit에서 `WorkOrder["..."]` indexed access 타입을 전체 엔터티 캐스팅 후보에서 제외

## 기존 동작과 변경 후 동작

- 기존: 일부 경로가 불완전 객체 또는 확장 객체를 `as WorkOrder`로 강제 변환
- 변경: 완전한 WorkOrder는 구조적으로 검증하고, 추가 mutation metadata는 전용 options로 전달
- 저장 API와 DB 계약은 변경하지 않음

## 위험 요소

- audit actor 전달 경로가 options 기반으로만 유지되는지 확인 필요
- 일반 사용자의 발주 요청 권한 판단이 기존 정책 결과와 동일한지 확인 필요

## 자동 검사

- `node scripts/audit-wafl-mutations.mjs` : 성공, 고위험 0건
- `WAFL_MUTATION_AUDIT_STRICT=1 node scripts/audit-wafl-mutations.mjs` : 성공, ExitCode 0
- `npx tsc --noEmit` : 실행 실패. 압축본에 node_modules가 없어 React/Next/Node 타입 모듈을 찾지 못함
- `npm run build` : 미실행 — 사용자가 로컬에서 확인

## 직접 테스트 항목

- 작업지시서 단건 저장 시 audit log actor 기록
- 작업지시서 다건 저장 시 audit log actor 기록
- 관리자와 일반 멤버의 발주 요청 버튼 노출 및 권한
- 작업지시서 PATCH 후 기존 미변경 필드 유지
- 로컬 전체 검사 8번 실행

## DB Migration

없음
