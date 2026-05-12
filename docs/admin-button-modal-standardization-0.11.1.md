# 관리자 Button / Modal action 표준화 1차 — 0.11.1

## 목적

관리자 화면에서 버튼 스타일과 모달 footer action 패턴이 화면별 문자열 className에 직접 묶이지 않도록 공통 컴포넌트 기준을 추가한다.

## 반영 내용

- `components/admin/common/AdminButton.tsx` 추가
- `AdminButton` / `AdminLinkButton` / `getAdminButtonClassName` 제공
- 버튼 variant 기준 추가
  - `primary`
  - `secondary`
  - `danger`
  - `ghost`
- 버튼 size 기준 추가
  - `sm`
  - `md`
- `AdminModalFooterActions` 내부 버튼을 `AdminButton`으로 전환
- 기존 호환 export는 유지
  - `adminModalSecondaryButtonClassName`
  - `adminModalPrimaryButtonClassName`
  - `adminModalDangerButtonClassName`
- `/admin/settings` notice modal footer 버튼을 `AdminButton` / `AdminLinkButton`으로 전환

## 의도적으로 유지한 부분

아래 기존 className export는 기존 화면을 한 번에 깨지 않기 위해 유지했다.

```ts
adminModalSecondaryButtonClassName
adminModalPrimaryButtonClassName
adminModalDangerButtonClassName
```

다음 단계에서 기존 import 사용처를 순차적으로 `AdminButton`으로 바꾸면 된다.

## 다음 권장 작업

0.11.2에서는 아래 사용처를 순차 전환한다.

- `components/admin/partnerMaster/*`
- `components/admin/settings/AdminUserAccessPreview.tsx`
- 저장소/휴지통 confirm modal footer
- 시스템관리자 action button

한 패치에서 모든 버튼을 바꾸면 회귀 범위가 커지므로, 메뉴 단위로 나누는 것이 안전하다.
