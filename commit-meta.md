Version : 0.9.103
Base Version : 0.9.102
Target Version : 0.9.103
Summary : 시스템 카테고리 규칙 UI 재연결
Description : 0.9.94에서 회귀 점검 화면으로 대체된 /system/category-rules를 기존 CategoryRulesManager 본 화면으로 재연결했습니다. getCategoryRulesManagerText()를 사용해 기존 i18n text를 전달하고, 기존 category rule editor/list/test modal/category values modal 및 local persistence 흐름을 유지했습니다. DB schema, 추천 알고리즘, 저장소 구조는 수정하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/system/category-rules/page.tsx
- lib/system/systemRegressionRoutes.ts
추가 파일 목록 :
- docs/system/system_category_rules_ui_reconnect.md
삭제 파일 목록 :
- 없음
