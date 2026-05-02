# 시스템 카테고리 규칙 화면 재연결

Version: 0.9.103

## 목적

0.9.94에서 회귀 점검 화면으로 대체된 `/system/category-rules`를 기존 카테고리 규칙 관리 화면으로 재연결한다.

## 이번 패치 기준

1. `/system/category-rules` route에서 `SystemRegressionRoutePage`를 제거한다.
2. 기존 `CategoryRulesManager`를 다시 연결한다.
3. `getCategoryRulesManagerText()`를 사용해 기존 i18n text를 전달한다.
4. 기존 category rule editor/list/test modal/category values modal 구조를 유지한다.
5. 기존 local persistence 흐름을 유지한다.
6. DB schema, 추천 알고리즘, 저장소 구조는 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `app/system/category-rules/page.tsx`
- `lib/system/systemRegressionRoutes.ts`

## 재사용 범위

- `app/system/category-rules/CategoryRulesManager.tsx`
- `components/system/category-rules/*`
- `lib/system/categoryRuleEditor.ts`
- `lib/system/categoryRuleRuntime.ts`
- `lib/system/categoryRuleText.ts`
- `lib/system/categoryRuleView.ts`
- `lib/system/categoryTreeRuntime.ts`
- `lib/system/categoryPersistence.ts`

## 제외

- DB 저장 연결
- AI 분류 기능
- 추천 알고리즘 변경
- category rule schema 변경
- package.json 변경

## 다음 작업

0.9.104에서 `/system/invites` 고객 초대 UI 본 화면 재연결을 진행한다.
