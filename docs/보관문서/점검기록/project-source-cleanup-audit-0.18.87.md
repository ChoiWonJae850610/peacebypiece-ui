# 0.18.87 프로젝트 소스 정리 점검

## 목적

테스트가 불가능한 기간에는 DB/API/R2/권한/업무 상태 흐름을 건드리지 않고, 빌드·런타임 영향이 낮은 프로젝트 정리 작업만 진행한다.

## 이번 정리 범위

다음 파일은 `.gitignore`에 이미 제외 대상으로 정의된 로컬 생성물 또는 패치 자동화 산출물이다. 프로젝트 소스 기준 zip에 포함될 필요가 없으므로 삭제 대상으로 정리한다.

- `commit-meta.md`
- `git-status.txt`
- `git-tracked-files.txt`
- `git-history-files.txt`
- `tsconfig.tsbuildinfo`

## 정리하지 않은 항목

- `app/dev/`, `app/test/`, `app/worker/`는 개발·점검용 route 후보이지만 실제 사용 여부와 노출 정책 확인이 필요하므로 이번 버전에서는 삭제하지 않는다.
- `next-env.d.ts`는 `.gitignore`에 포함되어 있지만 Next/TypeScript 타입 선언 관련 파일이므로 이번 버전에서는 삭제하지 않는다.
- `docs/`의 과거 버전별 기록 문서는 현재 판단 근거가 될 수 있으므로 이번 버전에서는 삭제하지 않는다.
- `cloudflare/`, `scripts/`, `db/test/`는 운영·배포·검증 흐름과 연결될 수 있으므로 이번 버전에서는 삭제하지 않는다.

## 전체 점검 메모

- `fallback`이라는 단어는 i18n 기본 문구, 값 정규화 기본값, DB 결과 없음 안내 등 정상 용례가 많아 단순 검색만으로 삭제하면 위험하다.
- `mock`, `dummy`, `test` 관련 항목은 개발·점검용과 실제 제거 대상이 섞여 있으므로 화면/route별 사용 여부 확인 후 단계적으로 정리해야 한다.
- 테스트 가능 전까지는 상태 변경, 권한, DB schema, 파일 업로드, R2 삭제/복원, 작업지시서 상태 전환 로직 수정은 보류한다.

## 다음 정리 후보

1. `app/dev`, `app/test`, `app/worker`의 실제 접근 경로와 runtime guard 확인
2. `lib/admin/mockDataAudit.ts`, `lib/admin/completionAudit.ts`가 현재 화면에서 필요한지 확인
3. 오래된 버전별 문서 중 `docs/현재기준/`에 흡수 가능한 내용 분류
4. `pending-tests.md`를 최신 테스트 불가 정책과 누적 테스트 목록 기준으로 정리
