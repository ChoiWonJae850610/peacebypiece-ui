# Dead Code / Old Path Cleanup — 0.16.24

## 목적

0.16.24는 `/admin` 화면 라우트를 `/workspace`로 전환한 이후 남은 old path, legacy route, dead code 후보를 정리하기 위한 점검 기준이다.

이번 버전의 목표는 다음과 같다.

- 고객사 업무 화면의 실제 URL 기준을 `/workspace`로 고정한다.
- `/admin` 화면 라우트 파일이 다시 생기지 않도록 점검 기준을 둔다.
- 아직 이름만 `admin`으로 남아 있는 공통 UI/API/domain 모듈과 실제 old path를 구분한다.
- 삭제 가능한 파일과 후속 rename 후보를 섞지 않는다.

## 1. 현재 정리된 항목

### 화면 라우트

0.16.24 기준 고객사 업무 화면은 다음 경로를 기준으로 한다.

| 업무 | 기준 URL |
| --- | --- |
| 홈 | `/workspace` |
| 작업지시서 | `/workspace/workorders` |
| 협력업체 관리 | `/workspace/partners` |
| 원단·부자재 | `/workspace/materials` |
| 저장소 관리 | `/workspace/files` |
| 통계정보 | `/workspace/stats` |
| 멤버관리 | `/workspace/members` |
| 환경설정 | `/workspace/settings` |
| 기준정보 | `/workspace/standards` |

`app/(admin)/admin/*` 화면 라우트는 더 이상 기준 경로가 아니다.

### route group

Next.js route group 이름은 URL에 노출되지 않는다. 따라서 `app/(workspace)/workspace/*`가 고객사 업무 화면의 기준 구조다.

## 2. `/admin` 문자열 분류 기준

`/admin` 문자열이 발견되더라도 모두 즉시 삭제하지 않는다. 다음 기준으로 분류한다.

### A. 즉시 제거 대상

- `href="/admin..."`
- `router.push("/admin...")`
- `redirect("/admin...")`
- 고객사 업무 화면 문서에서 현재 기준 URL처럼 쓰인 `/admin...`
- 신규 코드에서 생성되는 `/admin` 화면 링크

### B. 후속 rename 후보

- `components/admin/*`
- `lib/admin/*`
- `AdminButton`, `AdminTable`, `AdminShell` 같은 공통 UI 명칭
- `Admin*` 접두어가 붙은 workspace 호환 컴포넌트

이 항목은 실제 old path가 아니라 과거 명명 관성이다. 한 번에 rename하면 import churn이 커지므로 workspace 공통 UI rename 구간에서 별도로 처리한다.

### C. API 경로 유지 후보

- `app/api/admin/*`
- `/api/admin/files/*`
- `/api/admin/members/*`
- `/api/admin/settings/*`

0.16.24에서는 API URL rename을 하지 않는다. 클라이언트, 권한 guard, 저장소/휴지통/purge 흐름과 함께 묶여 있어 화면 URL 변경과 같은 버전에서 처리하면 회귀 위험이 크다.

후속 기준:

- `/api/workspace/*` 별칭 route를 먼저 추가한다.
- 클라이언트 호출을 `/api/workspace/*`로 이동한다.
- 기존 `/api/admin/*`는 일정 구간 후 삭제한다.
- R2/첨부/메모/휴지통/purge API는 별도 회귀 테스트 후 이동한다.

### D. 역사 문서 유지 후보

`docs/wafl-a-type/*` 안의 과거 설계 문서는 당시 기준을 보존하는 성격이 있다. 다만 현재 라우팅 정책, 테스트 정책, 페이지 인벤토리처럼 앞으로도 참조할 문서는 `/workspace` 기준으로 갱신한다.

## 3. dead code 삭제 기준

파일을 삭제하기 전 다음 조건을 모두 확인한다.

1. import 참조가 없다.
2. route로 접근되지 않는다.
3. API handler에서 참조하지 않는다.
4. seed, smoke test, reset SQL에서 참조하지 않는다.
5. 문서상 후속 작업 후보가 아니라 실제 폐기 대상이다.

확실하지 않은 파일은 삭제하지 않고 후보 문서에 남긴다.

## 4. 0.16.24에서 삭제하지 않은 항목

다음은 이름상 old admin처럼 보이지만 이번 버전에서는 삭제하지 않는다.

| 대상 | 이유 |
| --- | --- |
| `components/admin/*` | workspace 화면이 아직 공통 Admin UI 컴포넌트를 사용한다. |
| `lib/admin/*` | 저장소, 통계, 멤버, 설정 domain logic이 아직 이 경로에 있다. |
| `app/api/admin/*` | API URL rename은 클라이언트 호출과 guard, R2/휴지통 회귀 테스트가 필요하다. |
| `Admin*` 컴포넌트명 | 기능상 old path가 아니라 UI prefix 문제다. |

## 5. 후속 작업 후보

0.16.25 이후 별도 구간에서 다음 순서로 진행한다.

1. workspace API alias 추가
2. 클라이언트 fetch URL `/api/admin/*` → `/api/workspace/*` 이동
3. `components/admin/common` → `components/workspace/common` rename 후보 분리
4. `lib/admin/files|stats|members|settings` → `lib/workspace/*` rename 후보 분리
5. 삭제 가능한 legacy import 확인
6. `/api/admin/*` 제거 여부 결정

## 6. 테스트 기준

- `/workspace` 직접 접근 정상
- `/workspace/workorders` 직접 접근 정상
- `/workspace/materials` 직접 접근 정상
- `/workspace/files` 직접 접근 정상
- `/workspace/stats` 직접 접근 정상
- `/workspace/members` 직접 접근 정상
- `/workspace/settings` 직접 접근 정상
- `/admin` 화면 URL 직접 접근 시 기준 화면으로 쓰이지 않아야 함
- 기존 `/api/admin/*` 호출은 이번 버전에서 깨지면 안 됨
- R2/첨부/메모/휴지통/purge 흐름 영향 없어야 함
