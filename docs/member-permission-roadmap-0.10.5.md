# PeaceByPiece 0.10.5 — 멤버관리/권한관리 설계 기준

## 목표

이번 버전은 실제 멤버 초대, 권한 DB, 권한 관리 UI를 구현하지 않는다.
대신 고객관리자 카드형 홈과 이후 멤버 홈에서 사용할 권한 코드를 기존 permission policy에 연결해, 다음 구현 단계에서 중복된 문자열 기준이 늘어나지 않도록 정리한다.

## 이번 버전에서 확정한 원칙

1. 역할은 기본 권한 묶음으로만 사용한다.
2. 실제 화면 카드 노출은 permission code 기준으로 확장한다.
3. 고객관리자와 일반 멤버의 메인화면은 같은 카드 registry를 사용할 수 있어야 한다.
4. 아직 DB schema는 변경하지 않는다.
5. 권한 코드는 프론트 UI 문자열이 아니라 lib/permissions의 중앙 정책에서 관리한다.

## 권한 기반 카드 후보

| 카드 | 권한 코드 | 현재 상태 |
| --- | --- | --- |
| 작업지시서 업무 화면 | workorder.access | 1차 진입 가능 |
| 협력업체 관리 | partner.manage | 1차 진입 가능 |
| 저장소 관리 | storage.manage | 1차 진입 가능 |
| 통계정보 | stats.view | 1차 진입 가능 |
| 환경설정 | settings.organization.manage | 1차 진입 가능 |
| 멤버 관리 | member.manage | 후순위 |
| 단위표준 | standard_unit.manage | 후순위 |
| 외주공정 | outsourcing_process.manage | 후순위 |
| 생산품유형 | product_type.manage | 후순위 |

## 후속 구현 방향

### 0.10.x 후속

- 고객관리자 카드형 홈 문구 정리
- 멤버관리 placeholder 또는 설계 화면 추가
- 권한 기반 카드 필터링 함수 추가

### 0.11.x 이후 후보

- roles 테이블
- permissions 테이블
- role_permissions 테이블
- user_roles 테이블
- user_permission_overrides 테이블
- 초대/가입 흐름
- API route guard
- 서버 권한 검증

## 보류한 항목

- DB schema 변경
- 실제 권한 편집 UI
- 멤버 초대 발송
- API 권한 차단 로직
- 루트 단일 AppShell 전환
