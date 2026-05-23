# 0.16.0 발주서 HTML 미리보기/검증 경로

## 목적

발주서 PDF Generator를 붙이기 전에 HTML 템플릿 자체가 기존 발주요청 모달/인쇄 양식과 맞는지 브라우저에서 먼저 확인한다.

PDF 생성 엔진 문제와 HTML 템플릿 문제를 분리하기 위한 검증 단계다.

## 미리보기 URL

```text
/api/workorders/{workOrderId}/generated/order-request-html
```

예시:

```text
/api/workorders/wo_xxx/generated/order-request-html
```

선택적으로 발주 메모를 query string으로 넘길 수 있다.

```text
/api/workorders/{workOrderId}/generated/order-request-html?requestNote=검증용%20메모
```

## 권한/범위

- 현재 로그인 세션의 `companyId` 기준으로만 조회한다.
- 멤버 계정은 기존 작업지시서 조회 범위와 동일하게 본인 담당 작업지시서만 조회한다.
- 회사 API 접근 차단 상태이면 동일하게 차단된다.
- 응답은 `no-store`로 반환한다.

## 템플릿 기준

0.16.0부터 PDF Generator에 넘기는 HTML은 기존 발주요청 인쇄 HTML과 같은 빌더를 사용한다.

- A4 portrait
- 기존 발주요청 모달/인쇄 양식 기준
- 대표 이미지 영역
- 요청사항 영역
- 원단/부자재/외주 내역 표
- 자동 인쇄 toolbar 제거
- 브라우저 미리보기용 HTML 반환

## 다음 단계

0.16.1 이후 PDF Generator 서비스/Worker는 이 HTML을 입력으로 받아 PDF 변환을 수행한다.
