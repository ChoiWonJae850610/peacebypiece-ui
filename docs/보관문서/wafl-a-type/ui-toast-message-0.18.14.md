# UI Toast Message 0.18.14

## 목적

기준정보 화면의 일회성 사용자 피드백을 Sonner toast로 분리하고, 장기 노출이 필요한 오류만 inline message로 유지한다.

## 적용 범위

- `components/common/ToastMessage.tsx`
  - 동일 문구를 반복 실행할 수 있도록 `eventKey`를 추가했다.
  - 기존 `message`/`tone` 기반 사용처는 그대로 동작한다.
- `features/materials/MaterialsWorkspacePage.tsx`
  - 등록, 수정, 삭제, 새로고침 성공 메시지를 toast로 전환했다.
  - 권한 부족 같은 일회성 사용자 액션 피드백은 warning toast로 전환했다.
  - API 실패 메시지는 inline message와 danger toast를 함께 사용한다.

## 제외 범위

- 작업지시서 저장/상태전환 흐름
- 원단·부자재 발주 상태전환 흐름
- DB/API/R2/첨부/메모/휴지통/purge 흐름

## 후속 작업

0.18.15부터는 기존 `message state + ToastMessage`가 중복된 관리자 화면을 같은 기준으로 점진 정리한다.
