# 0.9.22416 작업지시서 i18n presentation 구조 정리 및 build 오류 보정

## 목적

0.9.22415에서 진행한 작업지시서 i18n 1차 정리 이후 발생한 build 오류를 보정하고, `workOrderDisplayTranslation.ts`에 모이기 시작한 표시 변환 책임을 역할별 presentation 파일로 분리한다.

## 수정 내용

- `detailEditorShared.tsx`의 `??`와 `||` 혼용 표현에 괄호를 추가해 Turbopack parser 오류를 수정했다.
- 작업지시서 표시 변환 helper를 역할별 파일로 분리했다.
  - `workOrderValuePresentation.ts`: DB/사용자 입력 표시값의 locale 변환
  - `workOrderStatusPresentation.ts`: workflow 상태, 표시 단계, 검수 상태 라벨
  - `workOrderActionPresentation.ts`: workflow action 버튼 라벨
- 기존 import 경로의 회귀를 막기 위해 `workOrderDisplayTranslation.ts`는 barrel export로 유지했다.

## 판단

이번 버전은 하드코딩 문구 추가가 아니라, 0.9.22415에서 만든 display translation helper가 커지는 것을 막기 위한 구조 분리다.

## DB 변경

없음.

## build

ChatGPT 환경에서는 `npm run build`를 실행하지 않았다. 사용자가 로컬에서 확인한다.
