import AdminRegressionRoutePage from "@/components/admin/regression/AdminRegressionRoutePage";

export default function AdminHistoryPage() {
  return (
    <AdminRegressionRoutePage
      eyebrow="ADMIN HISTORY"
      title="히스토리"
      description="히스토리 route의 무결성 점검 화면입니다. AdminWorkOrderHistoryPage 본 기능 재연결은 하위 컴포넌트 JSX 확인 후 별도 버전에서 진행합니다."
      currentRouteId="history"
    />
  );
}
