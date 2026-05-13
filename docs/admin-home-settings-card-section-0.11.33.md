# 0.11.33 관리자 홈/설정 Card/Section 적용

## 목적

0.11.32에서 추가한 `AdminSection`, `AdminCard`, `AdminSectionHeader` 패턴을 관리자 홈과 환경설정 화면에 제한적으로 적용한다.

## 반영 범위

- `/admin` 운영 관리 섹션은 0.11.32에서 이미 `AdminSection`과 `AdminCard` 기반으로 1차 적용되어 있음.
- 이번 버전에서는 `/admin/settings`의 상단 환경설정 메뉴 섹션을 `AdminSection`으로 전환했다.

## 수정 내용

- `components/admin/settings/AdminSettingsHub.tsx`
  - 직접 작성된 `section.rounded-[28px]` wrapper를 `AdminSection`으로 교체했다.
  - 기존 제목, 설명, 우측 안내 문구, 설정 메뉴 카드 grid 구조는 유지했다.
  - 설정 메뉴 선택, 모달 open/close, 회사 설정 fetch/save 흐름은 변경하지 않았다.

- `lib/constants/app.ts`
  - `APP_VERSION`을 `0.11.33`으로 갱신했다.

## 유지한 항목

- 회사 설정 저장 API 호출 조건 유지
- 테마/언어 저장 action flow 유지
- 기준정보 섹션 진입 방식 유지
- 요금제/계정/피드백 notice modal 동작 유지
- 설정 메뉴 카드의 tone class와 active ring 표현 유지

## 다음 작업 후보

0.11.34에서는 시스템 홈 카드 구조를 `AdminSection` / `AdminCard` 기준으로 정리하는 것이 적합하다.
