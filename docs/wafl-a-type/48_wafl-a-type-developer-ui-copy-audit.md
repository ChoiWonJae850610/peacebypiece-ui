---
title: WAFL Developer-facing UI Copy Audit
version: 1.0
baseline_source: peacebypiece-ui-0.16.47
status: draft
updated: 2026-05-20
---

# 48. 개발자성 UI/문구 전수 감사

## 1. 목적

0.15.x에서 화면 구조, 운영 IA, 권한, 승인 흐름을 빠르게 붙이면서 일부 화면에 내부 구현 설명과 개발자용 대시보드성 문구가 남아 있다.

이 문서는 실제 고객사 관리자, 멤버, 가입 대기 사용자, 시스템관리자가 보는 화면에서 제거해야 할 내부 용어와 정리 우선순위를 정의한다.

## 2. 판정 기준

```txt
사용자 화면에 노출하지 않는 표현:
- DB table/column 이름
- API route 이름
- 내부 상태 코드
- requestId, companyId, permission_code 같은 구현 식별자
- mock, fallback, placeholder, seed, test 같은 개발용 단어
- “설계 중”, “추후 연결”, “실제 DB 기준으로 바뀜” 같은 구현 단계 설명
- 권한/승인 로직의 내부 처리 방식 설명
```

```txt
사용자 화면에 남겨도 되는 표현:
- 승인 대기
- 승인 완료
- 승인 보류
- 준비 중
- 문의 필요
- 저장 실패
- 다시 시도
- 관리자에게 문의
```

단, “준비 중”은 고객이 이해할 수 있는 기능 상태일 때만 사용하고, 구현 계획 설명으로 길게 쓰지 않는다.

## 3. 이번 버전에서 즉시 정리한 화면

### /pending

문제:
```txt
- 상태 조회 폼이 개발자용 대시보드처럼 보임
- requestId, join_requests.id, permission_code 노출
- 승인 전 접근 범위/승인 처리 흐름이 기획 문서처럼 표시됨
- 승인 대기 사용자가 실제로 해야 할 행동이 불명확함
```

정리:
```txt
- 사용자용 상태 안내 화면으로 단순화
- 내부 ID 직접 입력 폼 제거
- 승인 전 접근 범위 설명 제거
- 승인 처리 흐름 설명 제거
- 상태 새로고침과 로그아웃만 남김
- 승인 완료 시 업무 화면 이동 버튼만 노출
```

## 4. 추가 정리 대상 후보

### Public/Auth

```txt
우선순위 높음:
- /invite/error
- /invite/company/[token]
- /invite/member/[token]
- /service-paused
```

점검 포인트:
```txt
- 초대 token, requestId, join_requests 같은 내부 표현 제거
- 가입자가 이해할 수 있는 다음 행동 중심으로 문구 재작성
- 오류 화면은 “무엇이 잘못됐는지”보다 “무엇을 하면 되는지” 중심으로 정리
```

### System Admin

```txt
우선순위 중간:
- /system/companies
- /system/audit-logs
- /system/standards/*
- /system/billing
```

점검 포인트:
```txt
- 시스템관리자에게 필요한 운영 정보와 개발 진단 정보를 분리
- seed, regression, checkpoint, placeholder 문구는 운영 메뉴에서 감추거나 개발 전용 문서로 이동
- 고객사 승인 화면에는 내부 ID보다 회사명, 신청자, 상태, 처리 버튼 중심으로 표시
```

### Customer Admin

```txt
우선순위 중간:
- /admin/settings
- /admin/members
- /admin/history
- /admin/stats
- /admin/files
```

점검 포인트:
```txt
- “개발 건의”, “준비 중”, “placeholder” 계열 문구를 운영 문구로 정리
- fallback/mock 데이터 설명은 화면에서 제거
- 기능 미구현 카드는 짧은 준비 중 안내와 비활성 상태만 유지
```

### Workspace/Worker

```txt
우선순위 낮음:
- /workspace
- /worker
- 작업지시서 상세 하위 섹션
```

점검 포인트:
```txt
- 작업지시서 입력 placeholder가 사용자 입력 예시인지 개발용 힌트인지 분리
- fallback 표현이 화면에 노출되지 않도록 확인
- 기기별 화면 전환 안내는 실제 사용자 행동 중심으로 정리
```

## 5. 제거 방식

```txt
1. 사용자용 화면에서 내부 용어 제거
2. 필요한 운영 설명은 짧은 도움말로 축약
3. 개발/운영 설계 설명은 docs로 이동
4. 아직 구현 전인 기능은 준비 중 카드로만 표시
5. 실제 기능 없는 테스트 폼은 public 화면에서 제거
6. 시스템관리자에게도 DB/API 식별자 대신 업무 식별 정보 우선 표시
```

## 6. 다음 작업 제안

```txt
0.15.26 — public/auth 문구 UX 정리 2차
- /invite/error
- /invite/company/[token]
- /invite/member/[token]
- /service-paused

0.15.27 — system 화면 개발자성 문구 정리
- /system/companies
- /system/audit-logs
- /system/standards/*
- /system/billing

0.15.28 — admin 화면 개발자성 placeholder 정리
- /admin/settings
- /admin/members
- /admin/history
- /admin/stats
- /admin/files
```
