# Simulator

- 기준 앱 버전: `0.24.11`
- 목적: dev/test simulator fixture, DB/R2 adapter, 안전 guard의 현재 기준을 정리한다.

## 위치

- Simulator guide: `tools/simulator/README.md`
- DB adapter manifest: `tools/simulator/adapters/db/manifest.mjs`
- R2 adapter manifest: `tools/simulator/adapters/r2/manifest.mjs`
- Commands: `tools/simulator/commands/`
- Fixtures: `tools/simulator/fixtures/`
- Test reports: `artifacts/test-reports/`
- Local temp output: `.tmp/simulator/`

## 회사 Fixture

Simulator 회사 ID와 표시명은 안정적인 계약이다.

| Code | Company ID | Display name |
| --- | --- | --- |
| A | `wafl-fn-company-a` | 기본 운영사 |
| B | `wafl-fn-company-b` | 협업 운영사 |
| C | `wafl-fn-company-c` | 승인 대기사 |
| D | `wafl-fn-company-d` | 파일 반려사 |
| E | `wafl-fn-company-e` | 이용 중지사 |
| F | `wafl-fn-company-f` | 탈퇴 요청사 |
| G | `wafl-fn-company-g` | 인원 한도사 |
| H | `wafl-fn-company-h` | 대량 운영사 |
| I | `wafl-fn-company-i` | 과거 데이터사 |
| J | `wafl-fn-company-j` | 경계값 전용사 |

## 안전 정책

- Simulator DB seed/cleanup은 production runtime에서 차단한다.
- DB host/database 이름, approved fingerprint, `wafl-fn` prefix, mutation enable flag, exact confirmation text를 모두 확인한다.
- Seed와 cleanup은 transaction과 advisory lock을 사용한다.
- Cleanup은 fixture에 등록된 `wafl-fn` 회사 ID만 대상으로 한다.
- 실제 R2 upload/delete adapter는 별도 승인과 환경 guard 없이 실행하지 않는다.

## 명령

비파괴 명령:

```bash
npm run simulator:r2:plan
npm run simulator:adapter:plan
npm run simulator:adapter:contract
npm run simulator:db:contract
npm run simulator:db:seed:dry-run
npm run simulator:db:cleanup:dry-run
```

로컬 파일 생성/정리:

```bash
npm run simulator:r2:generate
npm run simulator:r2:cleanup-local
```

`.tmp/simulator/r2/files`와 `.tmp/simulator/r2/manifests` 밖의 경로는 cleanup-local 대상이 아니다.

실제 DB mutation 명령은 명시 승인 후에만 사용한다.

```bash
npm run simulator:db:seed:execute
npm run simulator:db:cleanup:execute
```

## 현재 Fixture 기준

- 회사 프로필 필수값은 업무 테스트 회사에서 완성 상태로 seed한다.
- 사용자 전화번호 출처는 DB 허용값인 `user`를 사용한다.
- `company_users`는 고정 membership id를 기준으로 idempotent upsert한다.
- 품목 분류는 path 기반으로 정규화해 1차·2차·3차 중복을 방지한다.
- R2는 사전 폴더 생성 개념이 없으며 object key prefix로만 표현한다.

## 보류

- 실제 R2 object fixture와 DB metadata reconciliation은 별도 dev/test R2 adapter 단계에서 확인한다.
- Seed performance 개선은 별도 작업이다.
- 운영 데이터와 실제 고객 데이터는 simulator 명령 대상이 아니다.
