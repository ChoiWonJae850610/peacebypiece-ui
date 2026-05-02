import AdminRegressionRoutePage from "@/components/admin/regression/AdminRegressionRoutePage";

export default function AdminSettingsPage() {
  return (
    <AdminRegressionRoutePage
      eyebrow="ADMIN SETTINGS"
      title="환경설정"
      description="환경설정 route의 무결성 점검 화면입니다. 설정 form 본 기능 재연결은 하위 컴포넌트 JSX 확인 후 별도 버전에서 진행합니다."
      currentRouteId="settings"
    />
  );
}
