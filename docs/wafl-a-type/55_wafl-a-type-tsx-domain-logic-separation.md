---
title: WAFL A-TYPE TSX Domain Logic Separation 1
version: 1.0
baseline_source: peacebypiece-ui-0.16.47
status: applied
updated: 2026-05-21
---

# 55. TSX 도메인 로직 분리 1차

## 1. 작업 목적

0.15.29 코드 품질 감사에서 확인한 TSX 내부 도메인 로직 후보 중 시스템 고객사 승인 화면을 1차 분리 대상으로 정했다.

목표는 다음과 같다.

```txt
- 화면 컴포넌트에서 상태 판정/라벨 변환/필터 판정을 줄인다.
- 고객사 가입 신청 row 변환을 presentation 계층으로 이동한다.
- 초대 링크 row 변환과 상태 tone 판정을 presentation 계층으로 이동한다.
- 파일 상태/파일 종류/용량 표시 helper를 화면 밖으로 이동한다.
- 기존 API, DB, R2, 승인/거절 액션 흐름은 변경하지 않는다.
```

## 2. 적용 파일

```txt
추가:
- lib/system/systemCompanyApprovalPresentation.ts

수정:
- components/system/companies/SystemCompanyApprovalConsole.tsx
- lib/constants/app.ts
```

## 3. 분리한 로직

`components/system/companies/SystemCompanyApprovalConsole.tsx`에서 아래 순수 로직을 분리했다.

```txt
- CompanyJoinRequestRow / SystemInvitationRow / CompanyManagementFilter 타입
- 고객사 온보딩 상태 normalization
- 고객사 구독 상태 normalization
- 고객사 접근 제한 상태 판정
- 고객사 관리 필터 label/description/count/matches
- 고객사 가입 신청 row 변환
- 고객사 가입 신청 상태 label/tone/action 가능 여부 판정
- 고객사 현재 요금제 label 변환
- 초대 링크 row 변환
- 초대 링크 상태 label/tone/action 가능 여부 판정
- 온보딩 첨부 파일 URL/상태/종류 표시 helper
- load status label/tone 변환
- 시스템 고객사 승인 오류 메시지 변환
- 전화번호 입력 normalization
```

## 4. 유지한 로직

아래는 아직 TSX에 남겨 두었다.

```txt
- useState / useEffect / useMemo 기반 화면 상태
- 버튼 클릭 handler
- fetch 호출과 응답 상태 저장
- modal open/close 상태
- table column 구성
- 실제 JSX 렌더링
```

이번 작업은 동작 변경이 아니라 presentation helper 이동이므로, 이벤트 흐름은 유지했다.

## 5. 구조 기준

이번 분리 이후 기준은 다음과 같다.

```txt
components/system/companies/SystemCompanyApprovalConsole.tsx
- 화면 조립
- 사용자 이벤트 처리
- fetch 호출
- modal/table 렌더링

lib/system/systemCompanyApprovalPresentation.ts
- row 변환
- label/tone 계산
- 상태 판정
- 파일 표시 helper
- 오류 메시지 변환
```

## 6. 추가로 남은 후보

다음 버전 이후 추가 분리 후보는 다음이다.

```txt
- SystemCompanyApprovalConsole의 fetch/action handler를 actionFlow로 분리
- public invite/pending 화면의 상태 guidance selector 정리
- AdminUserAccessPreview의 역할 선택/권한 표시 logic 정리
- WorkOrderWorkspace의 상태 전이/권한 조건 TSX 잔여 점검
- 저장소/휴지통 restore/delete action button 조건 중앙화
```

## 7. 검증 기준

```txt
확인 화면:
- /system/companies

확인 포인트:
- 고객사 가입 신청 목록이 기존처럼 표시되는지
- 전체/승인 대기/승인됨/거절됨/재입력 필요/이용제한 필터가 기존과 동일하게 동작하는지
- 승인/거절/재입력 요청 버튼 표시 조건이 기존과 동일한지
- 고객사 관리자 초대 링크 생성/복사/취소 동작이 기존과 동일한지
- 온보딩 첨부 보기/다운로드 링크가 기존과 동일한지
```

## 8. 비변경 범위

```txt
- DB schema 변경 없음
- API route 변경 없음
- R2 upload/view/delete 흐름 변경 없음
- OAuth/session/permission/companyId 흐름 변경 없음
- package.json/package-lock.json 변경 없음
```
