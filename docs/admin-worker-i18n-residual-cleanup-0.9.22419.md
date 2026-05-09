# 0.9.22419 admin/worker i18n 잔여 정리

## 목적

0.9.22418 이후에도 남은 admin/worker 화면의 한영 혼합 표시를 줄이고, 저장소 화면의 초기 placeholder 값과 휴지통 상세 count/status 표시를 locale 기반 formatter로 정리한다.

## 반영 내용

- 저장소 snapshot placeholder의 한국어 데이터 문자열을 중립/영문 token 기반 값으로 변경했다.
- 저장소 요약 카드의 `0 items` 형태 count도 locale formatter가 처리하도록 보정했다.
- 휴지통 상세 모달과 작업지시서 저장소 목록의 작업지시서 단계/문서·디자인 count/메모 count 표시를 locale formatter로 통일했다.
- `작업중` 상태값을 작업지시서 단계 formatter에서 `Draft`/`작성중`으로 변환할 수 있도록 alias에 포함했다.
- 이미지 미리보기 실패 title도 i18n key를 통해 표시하도록 정리했다.
- 영어 dictionary의 count suffix 앞 공백을 제거해 `0 items` 조립을 formatter가 담당하도록 정리했다.

## 보류한 항목

영어 locale 새로고침 직후 아주 짧게 한국어가 보이는 SSR 초기 locale flash는 이번 버전에서 구조 수정하지 않는다.

현재 구조에서 `AdminShell`은 서버 렌더링 시 `DEFAULT_LOCALE`로 먼저 렌더링하고, 클라이언트 hydration 이후 사용자의 저장된 locale로 다시 렌더링한다. 이 때문에 영어 설정 상태에서도 초기 frame에서 ko 문구가 보일 수 있다.

이 문제는 다음 중 하나로 별도 처리해야 한다.

1. 서버 렌더링 단계에서도 cookie/header/url 기준 initial locale을 읽는다.
2. locale-sensitive placeholder는 hydration 전 skeleton으로만 표시한다.

현재는 저장소/휴지통 안정화와 하드코딩 잔여 정리를 우선하기 위해 문서화하고 보류한다.

## 확인 항목

- `/admin/files` 영어 locale에서 작업지시서 휴지통 상세의 `작업중`, `첨부 n개`, `메모 n개`가 영어로 표시되는지 확인한다.
- `/admin/files` 작업지시서 저장소 목록에서도 count/status가 현재 locale 기준으로 보이는지 확인한다.
- 저장소 요약 카드의 snapshot placeholder 값이 한국어 데이터 문자열에 의존하지 않는지 확인한다.
- `npm run build`는 사용자가 로컬에서 확인한다.
