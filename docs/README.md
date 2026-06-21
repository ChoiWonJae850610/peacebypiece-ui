# WAFL / PeaceByPiece 문서 인덱스

- 기준 앱 버전: `0.24.11`
- tracked docs 파일 수: 664
- docs 루트 파일 수: 266
- 현재 정리 기준: 루트에 누적된 버전별 완료 보고서는 삭제보다 archive 이동을 우선하고, 대량 이동은 manifest와 사용자 승인 후 수행한다.

## 1. 현재 기준 문서

현재 개발·테스트·리팩토링에서 우선 확인해야 하는 문서는 `docs/현재기준/`에 둔다.

- `docs/현재기준/README.md`
- 리팩토링 규칙
- 소스 구조
- 라우팅 구조
- 데이터베이스 구조
- 데이터베이스 쿼리·인덱스 정책
- 작업지시서 상태 구조
- 워크스페이스 경계
- 고객사/시스템 통계 지표
- 원단·부자재 데이터베이스/발주 설계
- full-reset 검증

## 2. 운영 기준 문서

- 현재 상태: `docs/codex-current-state.md`
- 제품화 로드맵: `docs/productization-roadmap.md`
- cleanup inventory: `docs/audits/repository-cleanup-inventory-0.24.11.md`
- docs archive manifest: `docs/audits/docs-archive-manifest-0.24.11.md`
- 테스트/자동화 현재 기준: `docs/현재기준/testing-and-automation.md`
- Simulator 현재 기준: `docs/현재기준/simulator.md`
- WAFL UI 시스템 현재 기준: `docs/현재기준/wafl-ui-system.md`

## 3. 정책 문서

서비스 약관, 개인정보처리방침, 요금·환불·저장소·데이터 보관 정책은 `docs/정책문서/`에 둔다.

- 정책 문서 README
- 정책 문서 구성
- 정책 결정사항
- 정책 기반 개발 우선순위
- 고객 공개용 초안: `docs/정책문서/고객공개/`

정책/약관 문서는 product policy와 사용자 데이터 보호에 연결되므로 자동 삭제하지 않는다.

## 4. 보관 문서

과거 설계 기록, 점검 기록, WAFL A-Type 누적 문서는 `docs/보관문서/`에 둔다.

- `docs/보관문서/wafl-a-type/`
- `docs/보관문서/점검기록/`
- `docs/보관문서/테스트기록/`
- `docs/보관문서/설계초안/`
- `docs/보관문서/DB기록/`

다음 archive 단계의 권장 추가 구조는 아래와 같다.

- `docs/보관문서/versions/`
- `docs/보관문서/build-fixes/`
- `docs/보관문서/completed-features/`
- `docs/보관문서/qa-history/`
- `docs/보관문서/deprecated/`

## 5. 현재 통계

| 영역 | 파일 수 |
| --- | ---: |
| docs 루트 | 266 |
| docs/보관문서 | 325 |
| docs/정책문서 | 32 |
| docs/현재기준 | 31 |
| docs/audits | 10 |

## 6. 정리 원칙

- docs 루트에는 README, current-state, roadmap, 최신 audit처럼 현재 판단에 필요한 canonical 문서만 남기는 방향으로 정리한다.
- 버전별 결과 문서는 `docs/audits/` 또는 `docs/보관문서/versions/`로 보낸다.
- build-fix, Playwright 초기 구축, simulator 소규모 수정, WAFL UI catalog, pipeline version 문서는 1차로 병합/보관/삭제했다. 남은 문서군은 manifest 기준으로 나누어 이동한다.
- exact duplicate와 legacy generated output은 참조 0건과 canonical 대체 파일을 확인한 뒤 삭제한다.
- DB/migration/lockfile/auth/permission/policy/Cloudflare deploy 파일은 사용자 승인 없이 삭제하지 않는다.

## 7. 검증

repository cleanup 변경은 아래 profile을 우선 사용한다.

```powershell
powershell -ExecutionPolicy Bypass -File tools/pipeline/verify-safe.ps1 -Profile repository-cleanup
```

기능 코드, DB/API, R2, 권한, 정책 차단, 요금제/저장소 제한처럼 영향 범위가 있는 작업은 해당 영역의 `verify-safe` profile 또는 별도 계약 테스트를 추가해 확인한다.
