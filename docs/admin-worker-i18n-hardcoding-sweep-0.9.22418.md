# 0.9.22418 admin/worker i18n 하드코딩 정리 2차

## 목표

0.9.22417 기준에서 남아 있던 고객관리자 메인, 저장소 요약 placeholder, 휴지통 상세 모달의 한영 혼합 문구를 정리한다.

## 반영 내용

- `/admin` 메인 하단 카드/운영 메뉴/API 준비/정책 메모를 client presentation 컴포넌트로 분리했다.
- 관리자 메인 카드의 제목, 설명, 버튼, 상태 배지를 `adminConsole` i18n key로 표시하도록 정리했다.
- 운영 대시보드의 priority/status/flow label이 서버 기본 한국어 문자열에 묶이지 않도록 client locale 기준으로 다시 변환했다.
- 저장소 요약 카드의 초기 placeholder 설명값이 한국어로 먼저 노출되지 않도록 size/status description 변환 helper를 보강했다.
- 영어 locale에서 `0items`처럼 붙어 보이던 count 표시를 `0 items` 형식으로 보정했다.
- 휴지통 상세 모달의 작업지시서 단계명과 `첨부 n개`, `메모 n개` 표시를 locale formatter로 분리했다.
- `en/admin.ts`에 한국어 fallback을 넣는 우회 방식은 사용하지 않았다.

## 다음 확인

- `/admin` 영어/한국어 전환 확인
- `/admin/files` 새로고침 직후 저장소 placeholder 문구 확인
- `/admin/files` 작업지시서 휴지통 상세 모달 count/status 문구 확인
- `/worker` 작업지시서 상세 화면 잔여 i18n 확인
