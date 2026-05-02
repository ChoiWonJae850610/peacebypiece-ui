import SystemRegressionRoutePage from "@/components/system/regression/SystemRegressionRoutePage";

export default function SystemCategoryRulesPage() {
  return (
    <SystemRegressionRoutePage
      eyebrow="SYSTEM CATEGORY RULES"
      title="카테고리 규칙"
      description="카테고리 규칙 route의 무결성 점검 화면입니다. CategoryRulesManager 본 기능 재연결은 하위 컴포넌트 JSX 확인 후 별도 버전에서 진행합니다."
      currentRouteId="category-rules"
    />
  );
}
