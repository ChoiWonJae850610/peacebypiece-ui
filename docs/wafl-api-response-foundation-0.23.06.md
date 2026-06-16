# WAFL API response foundation 0.23.06

## 목표

공장 전달사항과 발주서 API의 요청, 응답, 오류 처리를 공통 WAFL 계층으로 통일한다.

## 공통 응답 형식

성공 응답은 `ok: true`와 `data`를 사용한다.
오류 응답은 `ok: false`, `code`, `message`를 사용한다.

## 클라이언트

- `waflApiRequest`
- `readWaflApiResponse`
- `readWaflLegacyApiResponse`
- 빈 응답과 잘못된 JSON을 안전하게 처리한다.
- 네트워크 오류와 API 오류를 `WaflApiError`로 통일한다.

## 서버

- `createWaflApiSuccess`
- `createWaflApiError`
- `createWaflUnhandledApiError`
- `readWaflJsonBody`
- 기술 오류는 서버 로그에 기록하고 사용자에게는 안정된 문구만 반환한다.

## 적용 범위

- 공장 전달사항 GET/PATCH
- 발주서 GET/POST/PUT/PATCH
- 발주서 클라이언트 요청
- 기존 공급처 및 작업지시서 요약 응답은 공통 레거시 파서로 안전하게 읽는다.
