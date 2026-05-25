---
title: WAFL A-TYPE Auth Session Policy
version: 0.5
baseline_source: peacebypiece-ui-0.16.47
status: draft-final
updated: 2026-05-20
---

# 18. 인증 / 세션 / 역할 판정 정책

## 1. 목적

Google 로그인 이후 사용자를 어떤 업무 영역으로 보낼지, 어떤 route 접근을 허용할지 정의한다.

## 2. 로그인 후 판정 순서

```txt
1. Google session 존재 여부 확인
2. system admin 여부 확인
3. customer admin 여부 확인
4. company member 여부 확인
5. 초대/승인/프로필 상태 확인
6. 접근 가능한 홈으로 이동
```

## 3. 시스템관리자

```txt
조건:
- system_users 또는 이에 준하는 system admin registry에 active 상태로 존재

접근:
- /system
- /system/companies
- /system/storage-usage
- /system/audit-logs
- /system/settings

주의:
- 시스템관리자는 고객사 관리자 홈과 별도 IA를 사용한다.
```

## 4. 고객사 관리자

```txt
조건:
- 승인된 customer admin company account
- company status가 active 또는 trial 등 접근 가능한 상태

접근:
- /workspace
- /workspace/members
- /workspace/settings
- /workspace/files
- /workspace/stats
- /workspace/partners
- /workspace/materials
- /workspace/standards
```

## 5. 일반 멤버

```txt
조건:
- 승인된 company membership
- active 상태

접근:
- /workspace
- /worker
- 권한에 따라 일부 workspace 기능 접근 가능 여부를 별도 판단
```

## 6. 초대 링크와 가입 상태

```txt
valid:
- 가입/승인 요청 진행 가능

expired:
- 만료 안내 화면

revoked:
- 취소 안내 화면

alreadyAccepted:
- 이미 사용된 링크 안내 또는 로그인 유도

pendingApproval:
- 승인 대기 화면

invalid:
- 유효하지 않은 초대 안내
```

## 7. 상태별 route 처리

```txt
profile_required:
- 프로필 입력 또는 온보딩 화면으로 이동

approval_pending:
- 승인 대기 화면으로 이동

rejected:
- 거절 안내 화면으로 이동

service_paused:
- /service-paused

unauthorized:
- /login 또는 403
```

## 8. system admin bootstrap

```txt
- 개발/초기 운영에서는 bootstrap SQL로 지정 이메일을 system admin에 등록할 수 있다.
- bootstrap SQL은 db/seed에 보관한다.
- 실제 운영에서는 별도 관리자 등록/감사 정책을 마련한다.
```

## 9. 금지

```txt
- 로그인만으로 자동 시스템관리자 승인
- 초대 링크 진입만으로 DB/R2 partial record 생성
- customer admin invite email과 Google email 일치 강제
- 승인 요청 전 초대 링크를 used 처리
```

## 10. QA

```txt
[ ] system admin은 /system으로 진입하는가?
[ ] 고객사 관리자는 /workspace로 진입하는가?
[ ] 일반 멤버는 /workspace 또는 /worker로 진입하는가?
[ ] 승인 대기 사용자는 업무 화면에 들어가지 못하는가?
[ ] service paused 상태는 /service-paused로 이동하는가?
```
