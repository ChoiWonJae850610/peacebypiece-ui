# WAFL A-Type — 생산구성 현재값 partner/company scope 점검

## 버전

0.15.81

## 목적

작업지시서 생산구성 현재값 테이블의 저장/조회 기준을 회사 범위와 partner join 기준으로 다시 정리한다.

대상 테이블:

- `orders`
- `spec_sheet_materials`
- `spec_sheet_outsourcing_lines`

## 확인한 위험 지점

### 1. replace 저장의 삭제 조건

현재 생산구성 저장은 현재값 테이블을 `spec_sheet_id` 기준으로 replace 한다.

이때 삭제 조건이 `spec_sheet_id`만 사용하면, 개발 중 id 충돌이나 잘못된 데이터 상태에서 다른 회사 row까지 삭제될 위험이 있다.

0.15.81에서는 다음 저장 경로의 delete 조건에 `company_id` 범위를 같이 적용한다.

- 공장 발주 row replace
- 원단/부자재 row replace
- 외주공정 row replace

### 2. 공장 partner 해석 범위

발주요청 시 공장 partner를 찾는 서버 저장 경로에서 `partners`, `partner_items` 모두 `company_id` 기준으로 제한해야 한다.

0.15.81에서는 `factory_partner_id` 해석 시 현재 세션 회사의 partner만 대상으로 한다.

### 3. vendorPartnerId 표시 fallback

`spec_sheet_materials.vendor`와 `spec_sheet_outsourcing_lines.vendor`는 저장 당시 snapshot 표시명이다.

다만 snapshot vendor가 비어 있고 `vendor_partner_id`만 남아 있는 경우, 상세 조회에서 같은 회사의 `partners.name`을 fallback으로 표시한다.

우선순위:

1. 저장된 snapshot vendor
2. 같은 회사의 partner name
3. 빈 문자열

partner가 삭제되거나 비활성 상태가 되어도 snapshot vendor가 있으면 화면 표시가 유지된다.

## 0.15.81 변경 기준

- schema 변경 없음
- full_reset.sql 변경 없음
- production current table의 company scope delete 보강
- detail snapshot 조회의 partner name fallback 보강
- 자동 저장 정책 변경 없음
- 첨부/메모/R2/휴지통/purge 흐름 변경 없음

## 테스트 체크리스트

1. 원단/부자재 협력업체 선택 후 검토요청
2. 새로고침 후 vendor snapshot과 vendorPartnerId 유지 확인
3. 외주공정 협력업체 선택 후 검토요청
4. 새로고침 후 외주 vendor snapshot과 vendorPartnerId 유지 확인
5. 공장 선택 후 발주요청
6. 같은 이름의 partner가 다른 회사에 있어도 현재 회사 partner만 사용되는지 확인
7. 저장 후 다른 회사 작업지시서 데이터가 섞이지 않는지 확인
8. 제목 변경 시 미저장 draft 보존 동작 유지 확인
9. 메모/첨부 저장 동작 회귀 없음 확인
