# 시스템 기준정보 WAFL 전환 0.23.56

## 대상

- `SystemProcessStandardsPage`
- `SystemUnitStandardsPage`
- `SystemProductTemplateStandardsPage`

## 변경

- 화면 내부 직접 `fetch`를 `waflLegacyApiRequest`로 전환했습니다.
- 생성·수정·활성화 mutation을 `useWaflMutation`의 resource lock과 공통 토스트 lifecycle로 통합했습니다.
- 생산품 템플릿과 1·2·3차 분류 mutation도 동일한 계약으로 통합했습니다.
- native input을 `WaflInput`으로 교체하고 상태 토글 native button을 `AdminButton`으로 교체했습니다.
- API 성공 응답에 필수 record/records가 없으면 로컬 목록을 변경하지 않습니다.
- 조회 실패 시 mock 또는 fallback 데이터로 대체하지 않습니다.

## 지표

- 시스템관리자 직접 fetch: 17건 → 2건
- 시스템관리자 native control: 57건 → 22건
- 고위험 전체 엔터티 캐스팅: 0건 유지

## 위험 및 확인

- API route 계약은 기존 `{ ok, record }`, `{ ok, records }` 형식을 유지합니다.
- 전체 build와 실제 DB/API 검사는 로컬 파이프라인에서 확인해야 합니다.
