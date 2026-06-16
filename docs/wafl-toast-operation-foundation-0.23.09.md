# WAFL Toast Operation Foundation 0.23.09

## 목적
- 동일 저장 작업의 loading, success, error 토스트가 중복 생성되지 않고 같은 토스트에서 교체되도록 공통 operation 상태를 추가한다.

## 변경
- `useWaflToastOperation` 공통 훅 추가
- `ToastMessage`에 Sonner 고정 `toastId` 전달 기능 추가
- 발주서 토스트 상태를 공통 operation 상태로 연결
- 기존 발주서 저장 문구와 기능 흐름은 유지

## 후속 작업
- 발주서 필드별 저장 문구와 loading 누락 정리
- 작업지시서와 공장 전달사항을 동일 operation 정책으로 연결
