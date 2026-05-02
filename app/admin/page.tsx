import AdminRegressionRoutePage from "@/components/admin/regression/AdminRegressionRoutePage";

export default function AdminPage() {
  return (
    <AdminRegressionRoutePage
      eyebrow="ADMIN CONSOLE"
      title="고객관리자 콘솔"
      description="관리자 하위 화면의 route 무결성과 이동 경로를 점검하는 안정화 허브입니다."
      currentRouteId="dashboard"
    />
  );
}
