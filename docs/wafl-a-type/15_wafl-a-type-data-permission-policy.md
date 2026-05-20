---
title: WAFL A-TYPE Data Permission Policy
version: 0.5
baseline_source: peacebypiece-ui-0.14.8
status: draft-final
updated: 2026-05-20
---

# 15. 데이터 / 권한 / API Guard 정책

## 1. 목적

이 문서는 UI 권한 노출 규칙과 실제 API/DB 접근 제한이 어긋나지 않도록 기준을 정의한다.

핵심 원칙:

```txt
UI에서 버튼을 숨기는 것만으로는 권한 처리가 완료되지 않는다.
모든 작성성 작업은 API route 또는 domain handler에서 다시 권한을 확인한다.
모든 고객사 데이터 조회는 실제 로그인 세션의 companyId로 제한한다.
```

## 2. companyId scope

```txt
- 고객사 관리자와 일반 멤버는 자신의 companyId 데이터만 조회/수정할 수 있다.
- request body, query string, header로 넘어온 companyId는 신뢰하지 않는다.
- companyId는 session/user membership 기준으로 결정한다.
- 시스템관리자 API만 명시적으로 다른 companyId를 다룰 수 있다.
```

## 3. 사용자 유형별 조회 범위

### 3.1 시스템관리자

```txt
- /system 하위 화면 접근 가능
- 고객사 목록, 승인 요청, 저장소 사용량, 감사로그 조회 가능
- 고객사 관리자 업무 화면(/admin)과 혼동하지 않는다.
```

### 3.2 고객사 관리자

```txt
- 자신의 companyId 전체 업무 데이터 조회 가능
- 멤버 승인/초대 가능
- 고객사 설정 접근 가능
- 멤버 목록에서 고객사 관리자 계정은 권한 모달 대상에서 제외할 수 있다.
```

### 3.3 일반 멤버

```txt
- 승인된 company membership이 있어야 접근 가능
- 기본 조회 범위는 본인 담당 작업지시서 중심이다.
- 권한에 따라 작성성 작업만 허용한다.
```

## 4. 권한 key와 API 매핑

### 4.1 작업지시서

```txt
권한 표현:
- 조회 가능
- 작성 가능
- 발주 가능

작성 가능:
- 생성
- 수정
- 삭제/휴지통 이동 요청
- 검토 요청

발주 가능:
- 검토 없이 발주 요청까지 가능한 관리자급 흐름
```

API guard 기준:

```txt
- GET: companyId scope + 담당자/역할 범위 확인
- POST/PATCH/DELETE: 작성 가능 권한 확인
- 발주 관련 action: 발주 가능 권한 확인
```

### 4.2 협력업체

```txt
- 조회는 승인된 고객사 사용자에게 허용 가능
- 생성/수정/비활성/삭제성 작업은 협력업체 관리 권한 필요
```

### 4.3 기준정보

```txt
- 조회는 승인된 고객사 사용자에게 허용 가능
- 등록/수정/비활성/삭제성 작업은 기준정보 관리 권한 필요
```

### 4.4 통계

```txt
- 고객사 관리자와 승인 멤버에게 기본 조회 가능
- 데이터는 session companyId로만 제한한다.
- 시스템관리자 통계와 고객사 관리자 통계 route를 혼동하지 않는다.
```

## 5. UI 노출과 API guard 동시 적용

```txt
1. 권한이 없으면 메뉴/버튼은 숨김을 기본으로 한다.
2. 사용자가 기능 존재를 알아야 하면 disabled + 이유를 사용한다.
3. 직접 URL 접근은 403으로 처리한다.
4. API는 UI 상태와 무관하게 항상 권한을 재검증한다.
```

## 6. 금지

```txt
- UI 버튼 숨김만으로 권한 처리 완료 처리
- request header preview 권한으로 실제 저장 허용
- mock/dev fallback companyId 사용
- 문자열 literal 비교가 여러 화면에 흩어지는 구조
- 시스템관리자 route와 고객사 관리자 route 혼용
```

## 7. QA

```txt
[ ] 권한 없는 사용자가 직접 API 호출 시 403이 반환되는가?
[ ] UI 버튼 숨김과 API guard 기준이 일치하는가?
[ ] companyId를 body/query/header로 바꿔도 다른 회사 데이터에 접근할 수 없는가?
[ ] 고객사 관리자와 시스템관리자 화면이 분리되어 있는가?
[ ] 통계는 기본 조회 가능하되 companyId scope가 적용되는가?
```
