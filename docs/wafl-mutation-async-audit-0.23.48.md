# WAFL Mutation Async Audit — 0.23.48

## 목적

작업지시서와 발주서에서 반복되었던 비동기 저장 미대기, 부분 응답의 전체 객체 교체, 오래된 응답 덮어쓰기 문제를 다른 화면까지 확산시키지 않기 위해 프로젝트 전역 mutation 후보를 자동 분류한다.

## 자동 감사 명령

```bash
npm run audit:wafl-mutations
```

엄격 모드는 전체 엔터티 캐스팅 후보가 남아 있으면 실패한다.

```bash
node scripts/audit-wafl-mutations.mjs --strict
```

## 0.23.48 기준 결과

- 검사 소스 파일: 1,072개
- 전체 후보: 225건
- 이벤트 경계 `void` 비동기 호출: 28건
- effect/초기화 경계 `void` 호출: 96건
- `.then()` 체인: 34건
- 직접 `fetch` mutation 후보: 59건
- `WorkOrder`/`MaterialOrder` 전체 엔터티 캐스팅 후보: 8건

이 숫자는 결함 건수가 아니라 검토 대상 수다. 초기 조회, 이벤트 래퍼, 완전한 DB row mapper처럼 정상적인 사용도 포함될 수 있다.

## 우선순위

### P0 — 전체 엔터티 캐스팅 후보

다음 파일은 부분 응답을 완전한 작업지시서로 오인할 가능성이 있어 우선 정밀 검토한다.

- `lib/hooks/workorder/workorderRepositoryMutations.ts`
- `lib/workorder/api/workOrderRouteHandlers.ts`
- `lib/workorder/repository/dbWorkOrderRowMappers.ts`
- `lib/workorder/workflow.ts`

정상적인 완전 row 변환은 allowlist 또는 명시적 mapper로 분류하고, 부분 PATCH 응답은 `WaflPatchResult<TPatch>` 외 타입으로 캐스팅하지 않는다.

### P1 — 사용자 저장의 `.then()` 체인

우선 검토 대상:

- `components/admin/partnerMaster/usePartnerMasterController.ts`
- `components/admin/settings/AdminCompanyFilesPanel.tsx`
- `components/admin/settings/AdminSettingsHub.tsx`
- `components/admin/standards/*`
- `components/common/modal/CreateWorkOrderModal.tsx`
- `components/workorder/detail/modals/BasicInfoEditModal.tsx`
- `components/workorder/factoryInstruction/WorkOrderFactoryInstructionPanel.tsx`
- `lib/hooks/useWorkOrder.ts`

조회 체인은 유지할 수 있으나 사용자 mutation은 `await`, lock, loading/success/error, rollback 경계를 갖춰야 한다.

### P2 — 직접 fetch mutation

관리자·시스템·개인 설정 화면에 직접 `fetch` mutation 후보가 집중되어 있다. 다음 공통 규칙 적용 여부를 화면별로 확인한다.

- 동일 리소스 중복 저장 잠금
- 서버 완료까지 `await`
- 처리된 오류 재전파 금지
- 오래된 응답 차단
- 부분 PATCH 병합
- 실패 rollback
- 공통 토스트 lifecycle

## 분류 규칙

- `void load...()`처럼 조회 시작을 위한 호출은 mutation 결함으로 보지 않는다.
- 이벤트 핸들러의 `void save...()`는 저장 함수 내부에서 오류를 완전히 처리하는지 확인한다.
- `.then()` 자체는 금지하지 않지만 사용자 저장에서 lifecycle 누락 가능성이 높으므로 검토한다.
- `as WorkOrder`와 `as MaterialOrder`는 완전 row mapper인지 부분 응답 캐스팅인지 구분한다.
- 자동 감사 결과만으로 런타임 코드를 일괄 변경하지 않는다.

## 후속 순서

1. P0 캐스팅 8건을 실제 위험/정상 mapper로 분류
2. 작업지시서 생성·기본정보·공장지시 저장 경로의 `.then()` 제거
3. 업체·설정·파일 업로드 mutation을 `useWaflMutation` 기준으로 전환
4. 직접 fetch mutation에 공통 API adapter와 오류 정규화 적용
5. strict 감사 allowlist를 확정하고 CI/전체검사 메뉴에 연결
