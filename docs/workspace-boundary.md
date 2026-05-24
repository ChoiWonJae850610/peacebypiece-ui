# Workspace Boundary

기준 버전: 0.16.4
상태: boundary baseline
목적: 고객사 업무공간(workspace), 시스템관리자(system), 개인설정(me)의 책임 경계를 고정한다.

## 1. workspace 정의

`workspace`는 고객사 소속 사용자가 실제 업무를 처리하는 영역이다.

포함:

```txt
- 작업지시서
- 협력업체관리
- 저장소관리
- 통계정보
- 멤버관리
- 환경설정
- 원단·부자재
```

기준 URL:

```txt
/workspace
/workspace/workorders
/workspace/partners
/workspace/storage
/workspace/stats
/workspace/members
/workspace/settings
/workspace/materials
```

## 2. workspace에 두지 않는 것

```txt
- 시스템 전체 고객사 관리
- 전체 고객사 저장소 사용량 관리
- 시스템 감사 로그
- 전체 요금제/청구/결제 운영
- 약관/개인정보처리방침 버전 운영
- 시스템관리자 전용 승인/정지/삭제 처리
```

위 항목은 `/system` 경계에 둔다.

## 3. system 정의

`system`은 WAFLOW 서비스 운영자/시스템관리자 영역이다.

포함:

```txt
- 고객사 관리
- 고객사 승인/정지/상태 관리
- 저장소 사용량 및 삭제 처리 로그
- 감사 로그
- 요금제/청구/결제 운영
- 약관/개인정보/운영 정책 관리
```

기준 URL:

```txt
/system
/system/customers
/system/storage-usage
/system/audit-logs
/system/billing
/system/policies
```

## 4. me 정의

`me`는 로그인 사용자 개인설정 영역이다.

포함:

```txt
- 내 프로필 이름
- 연락처
- 생년월일
- 개인 언어 설정
- 개인 테마/색상 설정
```

기준 URL:

```txt
/me/settings
```

규칙:

```txt
- 개인설정은 별도 권한 없이 로그인 사용자가 접근 가능해야 한다.
- workspace 환경설정과 개인설정을 섞지 않는다.
- 개인설정 진입은 사람 아이콘을 사용한다.
- 톱니바퀴는 관리자/환경설정 의미로 유지한다.
```

## 5. workspace 메뉴 기준

기본 메뉴 후보:

```txt
작업지시서
협력업체관리
저장소관리
통계정보
멤버관리
환경설정
원단·부자재
```

규칙:

```txt
- 메뉴 노출 조건은 중앙화한다.
- href는 /workspace 기준으로 통일한다.
- /admin href를 신규로 만들지 않는다.
- system 메뉴와 workspace 메뉴를 같은 shell에 섞지 않는다.
```

## 6. 멤버관리 / 권한 경계

멤버관리 목록에는 고객사 관리자를 표시하지 않는 방향을 유지한다.

권한 UI 기준:

```txt
- 작업지시서
- 협력업체관리
- 통계
- 기준정보
```

권한 모달에 노출하지 않는 항목:

```txt
- 저장소
- 환경설정
- 멤버관리
- 감사로그
- 개인설정
```

작업지시서 권한 기준:

```txt
작성 가능 ON  = 생성/수정/삭제 가능 + 조회 가능
작성 가능 OFF = 조회만 가능
발주 가능 ON  = 검토 없이 발주 요청까지 가능한 관리자급 흐름
```

## 7. 작업지시서 조회 경계

기본 조회 원칙:

```txt
- 고객사 관리자는 같은 회사의 작업지시서를 볼 수 있다.
- 일반 멤버는 기본적으로 본인이 담당자인 작업지시서를 본다.
- companyId scope는 repository에서 강제한다.
- 담당자 목록도 같은 회사 멤버 기준으로 조회한다.
```

## 8. 원단·부자재 경계

원단·부자재는 workspace 업무 데이터로 본다.

단계별 연결 기준:

```txt
1차 = /workspace/materials 독립 화면
2차 = 작업지시서 상세와 연결
3차 = 발주 상태와 연결
4차 = 권한별 수정/발주 가능 조건 연결
```

규칙:

```txt
- 주요 업무 데이터는 테이블/컬럼화한다.
- payload/json에 핵심 원단·부자재 정보를 숨기지 않는다.
- companyId scope를 강제한다.
- 작업지시서 기존 발주 미리보기 흐름을 무리하게 바꾸지 않는다.
```

## 9. 저장소 / R2 경계

workspace 저장소는 고객사 관점의 저장소 관리 화면이다.

system 저장소 사용량은 서비스 운영자 관점의 전체 관리 화면이다.

```txt
/workspace/storage      = 고객사 저장소/휴지통
/system/storage-usage   = 시스템관리자 저장소 사용량/삭제 처리
```

규칙:

```txt
- R2 Worker 기반 흐름을 유지한다.
- 첨부/메모/delete/restore/purge 정상 흐름은 직접 목표가 아니면 변경하지 않는다.
- legacy R2 key compatibility는 새 구조에서는 유지하지 않는다.
- 실제 R2 URL이나 secret은 로그/문서/패치에 포함하지 않는다.
```

## 10. 결정 필요 시 멈춤 기준

다음 항목은 사용자 결정 없이 확정하지 않는다.

```txt
- 고객사 휴지통 비우기 정책 변경
- 30일 경과 후 영구 삭제 자동화 방식 변경
- 시스템관리자 고객사 파일 접근 사유 필수 여부 변경
- /admin legacy redirect 유지 여부 변경
- 고객사 관리자와 멤버 권한 표시 정책 변경
- 원단·부자재가 저장소 사용량에 포함되는 범위 변경
- 결제/청구/약관 재동의 정책 변경
```
