# 0.19.39 WAFL Toast 공통화 잔여 정리

## 목표

성공, 진행중, 경고, 오류 toast를 `WaflToast` 단일 규격으로 정리한다. 기존 `ToastMessage` API는 유지해서 화면별 대량 수정 없이 공통 toast shell만 교체한다.

## 반영

- `components/common/ui/WaflToast.tsx` 추가
- `ToastMessage`를 `WaflToast` adapter로 전환
- `showWaflToast`, `showWaflLoadingToast` export 유지
- `info / success / warning / danger / loading` tone별 icon, duration, ARIA role 기준 분리
- toast tone 색상을 WAFL theme/status token 기반으로 보정
- 작업지시서 write-lock processing toast를 공통 `WaflProcessingToast`로 전환
- processing toast의 별도 “처리중” 라벨을 제거하고 icon + message 중심으로 통일

## 유지

- 기존 화면의 `ToastMessage` 사용 방식 유지
- Sonner 기반 루트 `AppToaster` 유지
- DB/API/R2/첨부/메모/휴지통 흐름 변경 없음

## 확인 대상

- 작업지시서 상태 변경 결과 toast
- 작업지시서 처리중 toast
- 원단·부자재 발주 상태 변경 toast
- 협력업체 저장 성공/실패 toast
- 저장소 삭제/복원/비우기 toast
- 멤버 초대/취소/권한 저장 toast
