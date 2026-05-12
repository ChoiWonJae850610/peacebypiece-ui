# 0.10.65 고객사 생성 시 초기 기준정보 복사 연결

## 목표

시스템관리자가 고객사 가입 신청을 승인해 `companies`를 생성한 직후, 시스템 기준정보를 신규 고객사의 초기 기준정보로 복사하는 repository 흐름을 연결한다.

## 연결 범위

- `initializeCompanyStandards(input)` 추가
- `POST /api/system/companies`의 회사 생성 성공 직후 기준정보 초기화 호출
- 시스템관리자 고객사 승인 화면의 초기 기준정보 복사 단계 상태를 `연결 완료`로 변경

## 초기화 대상

1. 단위 표준
   - `system_unit_standards.is_active = true` 항목을 `company_enabled_unit_standards`에 연결
   - 신규 고객사는 모든 활성 단위를 사용 상태로 시작

2. 외주공정 유형
   - `system_outsourcing_process_standards.is_active = true` 항목을 `company_enabled_process_standards`에 연결
   - 신규 고객사는 모든 활성 외주공정 유형을 사용 상태로 시작

3. 생산품 유형
   - `system_product_type_templates.is_default = true`이면서 활성 상태인 기본 템플릿을 찾음
   - 해당 템플릿의 1차·2차·3차 `system_product_type_template_categories`를 신규 고객사의 `item_categories`로 복사
   - 복사 후 고객사 생산품 유형은 시스템 템플릿과 독립적으로 관리

## 중복 방지 정책

- 단위/외주공정 연결은 `ON CONFLICT`로 재실행 가능하게 처리
- 생산품 유형은 기존 고객사 `item_categories`가 있으면 기본적으로 건너뜀
- `overwriteProductTypes: true` 옵션이 들어온 경우에만 기존 고객사 생산품 유형을 삭제 후 재복사

## 트랜잭션 정책

`withDbTransaction`을 추가해 기준정보 초기화는 하나의 DB transaction 안에서 처리한다.

- 단위 표준 연결
- 외주공정 유형 연결
- 생산품 유형 복사

중간 실패 시 rollback된다.

## API 응답

`POST /api/system/companies`는 회사 생성이 성공하면 다음 결과를 함께 반환한다.

```ts
standardsInitialization: {
  companyId: string;
  unitStandardsLinked: number;
  processStandardsLinked: number;
  productCategoriesCopied: number;
  defaultTemplateId: string | null;
  skippedProductCategories: boolean;
}
```

## 후속 작업

- `companyRepository.createCompany`의 실제 Neon 구현
- join_requests 승인 처리
- invitations accepted 처리
- company_members 고객관리자 생성
- member_permissions 저장
- audit_logs 연결
