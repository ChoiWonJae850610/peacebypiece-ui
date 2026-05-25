# Source Architecture

기준 버전: 0.16.48
상태: structure baseline
목적: WAFLOW / PeaceByPiece 소스 계층의 책임 경계를 고정한다.

## 1. 기본 원칙

소스 구조는 URL, 화면 조립, 업무 로직, 공통 UI를 분리하는 방향으로 정리한다.

```txt
app        = URL 진입점과 route boundary
features   = 화면 조립, 화면 단위 controller/hook, domain UI composition
lib        = 업무 로직, service, repository, policy, permission, auth, storage
components = 공통 UI와 재사용 가능한 presentation component
```

## 2. app 계층

`app`은 Next.js route 진입점이다. 실제 업무 로직을 길게 두지 않는다.

허용:

```txt
- page.tsx / layout.tsx / route.ts의 최소 진입 처리
- params/searchParams 수신
- route group 구성
- service 또는 feature entry component 호출
```

금지:

```txt
- DB query 직접 작성
- role/status/companyId 직접 판단
- 긴 event handler 작성
- API route 안에 업무 로직 누적
- 화면에서 사용할 fixture/mock 데이터 직접 선언
```

## 3. features 계층

`features`는 화면 단위 조립 계층이다. 사용자가 보는 화면의 구조와 상호작용 흐름을 담당한다.

허용:

```txt
- 화면 단위 component 조립
- list/detail/modal/preview 같은 기능 화면 분리
- controller hook 구성
- event handler 이름 정리
- empty/loading/error state 연결
```

금지:

```txt
- DB query 직접 실행
- R2 key 직접 생성
- 권한/상태 정책을 문자열 비교로 직접 작성
- 회사 범위 조회 조건을 화면에서 직접 조립
```

권장 구조:

```txt
features/workorders/
  list/
  detail/
  modals/
  preview/
  components/
  hooks/

features/materials/
  list/
  detail/
  components/
  hooks/
  __fixtures__/
```

## 4. lib 계층

`lib`는 업무 기준과 데이터 흐름의 중심이다.

권장 책임:

```txt
lib/auth              = session, login state, route/API guard helper
lib/permissions       = capability, role policy, route access policy
lib/workorders        = workorder service/repository/policy/types
lib/materials         = material service/repository/policy/types
lib/storage           = R2/storage service/repository/key policy
lib/i18n              = copy, labels, locale helper
lib/debug             = development trace/debug helper
```

규칙:

```txt
- service는 업무 흐름을 담당한다.
- repository는 DB query를 담당한다.
- policy/capability는 권한·상태 판단을 담당한다.
- API route는 service 호출만 하도록 얇게 유지한다.
- repository는 항상 companyId scope를 명시적으로 강제한다.
```

## 5. components 계층

`components`는 공통 UI와 presentation component를 담당한다.

허용:

```txt
- Button/Card/Input/Table/Badge/Modal 등 공통 UI
- Layout shell의 presentation 구성
- domain 값이 이미 계산된 결과를 표시
```

금지:

```txt
- API 호출 직접 수행
- DB/R2 관련 처리
- role/status/companyId 정책 판단
- 서비스 코드나 상태 전이 직접 처리
```

## 6. 작업지시서 흐름 기준

작업지시서 주요 액션은 다음 흐름으로 고정한다.

```txt
Button
→ controller / feature hook
→ service
→ repository
→ DB
```

파일/R2가 포함되는 경우:

```txt
Button
→ controller / feature hook
→ service
→ storage service
→ R2 Worker / DB repository
```

## 7. 이름 규칙

모호한 handler 이름은 피한다.

권장:

```txt
handleCreateWorkorderClick
handleOpenWorkorderDetailClick
handleRequestReviewClick
handleOpenOrderPreviewClick
handleSubmitOrderRequest
handleAttachmentDeleteConfirm
handleMemoSaveSubmit
handleAssigneeChangeSubmit
```

비권장:

```txt
handleClick
handleSave
onSubmit
updateData
saveItem
```

## 8. fallback / mock / legacy 기준

실제 화면 경로에서는 fallback/mock/legacy compatibility를 원칙적으로 제거한다.

```txt
- demo company fallback 금지
- mock member fallback 금지
- mock workorder fallback 금지
- old path compatibility 유지 금지
- 데이터 없음은 mock이 아니라 empty state로 처리
- fixture가 필요하면 features/*/__fixtures__ 안에만 둔다
```

## 9. DB payload/json 기준

업무·권한·통계·검색·상태에 쓰이는 값은 payload/json에 숨기지 않는다.

```txt
테이블/컬럼화 대상:
- companyId scope에 필요한 값
- 권한 판단에 필요한 값
- 상태 전이에 필요한 값
- 통계/검색/정렬에 필요한 값
- 원단·부자재 주요 업무 데이터

JSON 허용 후보:
- 구조가 자주 바뀌는 보조 메타데이터
- UI 표시 보조값
- 통계/권한/상태 판단에 쓰이지 않는 부가 정보
```

## 10. 패치 작업 기준

```txt
- 기능 변경과 구조 정리를 한 패치에 과도하게 섞지 않는다.
- working R2/첨부/메모/휴지통/purge 흐름은 직접 목표가 아니면 건드리지 않는다.
- APP_VERSION, commit-meta.md Version, zip 파일명 버전을 일치시킨다.
- npm run build는 ChatGPT/container에서 실행하지 않는다.
```

## 11. 0.16.25 기준 실제 구조 안정화 상태

0.16.4~0.16.25 구간에서 문서 기준과 실제 구조를 다음 상태로 맞춘다.

```txt
완료된 기준:
- 고객사 업무 화면 기준 URL은 /workspace다.
- 작업지시서 page.tsx는 features/workorders/page 진입 컴포넌트를 호출한다.
- 작업지시서 주요 event 흐름은 controller hook으로 분리했다.
- 작업지시서 API route는 service/repository facade를 경유한다.
- 작업지시서 capability 판단은 lib/permissions/workorderCapabilities.ts에 중앙화했다.
- workspace API guard 기준은 lib/auth/apiRouteGuards.ts에 둔다.
- 원단·부자재 기준정보는 lib/materials service/repository/types/constants 계층을 사용한다.
- 개발 trace는 lib/debug/trace.ts를 사용하고 production에서는 출력하지 않는다.
```

아직 rename 후보로 남겨둔 항목은 다음과 같다.

```txt
후속 후보:
- components/admin/* 공통 UI prefix rename
- lib/admin/* workspace domain prefix rename
- app/api/admin/* → app/api/workspace/* alias/이전/삭제
- 원단·부자재 감사로그 실제 기록 연결
- 원단·부자재 통계 집계 연결
- 원단·부자재 파일 첨부/R2 편입 여부 결정
```

0.16.25 이후에는 새 기능을 붙이기 전에 위 후보 중 현재 작업 목표와 직접 관련 있는 것만 작은 버전 단위로 처리한다.
