# company/user repository DB 연결 1차

Version: 0.9.86

## 목적

SaaS형 테넌트 구조에서 시스템관리자가 고객사와 고객사 멤버를 조회할 수 있도록 DB repository를 1차 연결한다.

## 추가/변경 대상

- `lib/companies/companyTypes.ts`
- `lib/companies/companyRepository.ts`
- `lib/companies/api/companyRouteHandlers.ts`
- `app/api/system/companies/route.ts`

## API

### GET /api/system/companies

고객사 목록을 반환한다.

### GET /api/system/companies?companyId=company-sample-customer

고객사 상세, company_users, role_permissions를 반환한다.

## 이번 패치 기준

1. 실제 DB query는 `queryDb`를 통해서만 실행한다.
2. 화면은 직접 DB에 접근하지 않는다.
3. 인증/회원가입 연결은 하지 않는다.
4. company/user 생성, 수정, 삭제는 하지 않는다.
5. 조회 repository만 1차 연결한다.

## 다음 작업

0.9.87에서 permission policy와 DB 권한 연결 준비를 진행한다.
