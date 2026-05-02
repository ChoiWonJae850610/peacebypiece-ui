import AdminRegressionRoutePage from "@/components/admin/regression/AdminRegressionRoutePage";

export default function AdminFilesPage() {
  return (
    <AdminRegressionRoutePage
      eyebrow="ADMIN FILES"
      title="저장소 관리"
      description="파일 관리 route의 무결성 점검 화면입니다. 첨부파일/휴지통 본 기능 재연결은 하위 컴포넌트 JSX 확인 후 별도 버전에서 진행합니다."
      currentRouteId="files"
    />
  );
}
