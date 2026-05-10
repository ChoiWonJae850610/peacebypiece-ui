# 0.9.224391 — 권한 기반 카드형 홈 로드맵

## 목적

권한 시스템을 당장 구현하지 않고도, 이후 권한 기반 카드형 홈으로 확장할 수 있도록 최소 설계 기준을 정리한다.

이번 문서는 대규모 리팩토링을 피하기 위한 단계 분리 문서다.

## 현재 판단

권한 시스템을 먼저 완성하면 아래 영역이 동시에 연결된다.

1. 사용자/멤버
2. 역할
3. 권한
4. 역할별 권한
5. 사용자별 권한 override
6. 라우트 접근 제어
7. API 접근 제어
8. 카드형 홈 노출 조건
9. 초대/가입 흐름
10. i18n 표시명

따라서 현재 안정화 직후 단계에서는 권한 DB부터 만들지 않는다.

## 단계 분리 원칙

### 1단계 — 문서화

권한 기반 카드 원칙과 카드 후보를 문서화한다.

이 단계에서는 DB schema를 바꾸지 않는다.

### 2단계 — 카드 registry

카드형 홈을 만들 때 각 카드에 permission code 필드를 포함한다.

예시 구조:

```ts
const dashboardCards = [
  {
    id: "partners",
    permission: "partner.manage",
    href: "/admin/partners",
  },
  {
    id: "files",
    permission: "storage.manage",
    href: "/admin/files",
  },
];
```

초기에는 실제 권한 필터를 붙이지 않고 customer_admin 기준으로 표시한다.

### 3단계 — 권한 selector

카드 노출 조건은 TSX 내부에 직접 작성하지 않는다.

후보 위치:

- `lib/admin/dashboardCards.*`
- `lib/permissions/*`
- `components/admin/*`는 표시만 담당

### 4단계 — 실제 권한 시스템

권한 DB와 권한 관리 UI는 이후 버전에서 분리해 구현한다.

## 권한 코드 후보

### 업무 접근

| 코드 | 의미 |
| --- | --- |
| `workorder.access` | 작업지시서 업무 화면 접근 |
| `workorder.view` | 작업지시서 조회 |
| `workorder.edit` | 작업지시서 수정 |
| `workorder.create` | 작업지시서 생성 |
| `workorder.approve` | 검토/승인 처리 |

### 운영 관리

| 코드 | 의미 |
| --- | --- |
| `partner.manage` | 협력업체관리 |
| `storage.manage` | 저장소관리 |
| `stats.view` | 통계정보 조회 |
| `settings.organization.manage` | 조직 환경설정 관리 |
| `member.manage` | 멤버관리 |

### 기준정보 관리

| 코드 | 의미 |
| --- | --- |
| `standard_unit.manage` | 단위표준 관리 |
| `outsourcing_process.manage` | 외주공정 관리 |
| `product_type.manage` | 생산품유형 관리 |

### 개인 설정

| 코드 | 의미 |
| --- | --- |
| `settings.personal.manage` | 개인 설정 관리 |

## 카드 후보

### 항상 별도 업무 진입으로 다룰 카드

1. 작업지시서 업무 화면

### 고객관리자 기본 관리 카드

1. 협력업체관리
2. 저장소관리
3. 통계정보
4. 환경설정
5. 멤버관리 후보

### 권한 부여 가능 관리 카드

1. 단위표준
2. 외주공정
3. 생산품유형

이 항목들은 고객관리자만 쓰는 메뉴로 고정하지 않는다. 관리자가 멤버에게 권한을 주면 해당 멤버 홈에도 표시될 수 있어야 한다.

## 구현 시 주의사항

1. 권한 코드는 상수로 관리한다.
2. 카드 id, permission, href, i18n key는 registry에서 관리한다.
3. TSX에서 문자열 비교로 카드 노출을 직접 판단하지 않는다.
4. 카드 표시명은 i18n key를 사용한다.
5. 실제 권한 DB가 생기기 전에는 현재 사용자 role을 임시 기준으로 사용할 수 있다.
6. 임시 role 기준 로직은 후속 권한 selector로 교체하기 쉽게 분리한다.
7. 화면 구조 변경과 권한 DB 변경을 한 패치에서 섞지 않는다.

## 권장 구현 순서

1. `/admin` 카드형 홈 구현
2. 카드 registry 추가
3. permission code 상수 추가
4. customer_admin 기준 전체 카드 표시
5. 작업지시서 홈 버튼 추가
6. 개인 설정/조직 설정 분리 설계
7. 멤버관리/권한관리 설계
8. 실제 권한 DB 추가
9. 권한 selector와 카드 필터 연결
10. API 권한 체크 연결

## 완료 판단

아래 조건을 만족하면 권한 기반 카드형 홈으로 확장 가능한 1차 설계로 본다.

1. 현재 UI 구현은 작게 시작한다.
2. 권한 코드는 미리 설계한다.
3. 실제 권한 시스템은 후순위로 분리한다.
4. 고객관리자 홈은 좌측 패널 없이 카드형으로 간다.
5. 일반 멤버도 나중에 동일한 카드 구조를 사용할 수 있다.
