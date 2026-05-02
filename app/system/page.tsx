import SystemRegressionRoutePage from "@/components/system/regression/SystemRegressionRoutePage";

export default function SystemPage() {
  return (
    <SystemRegressionRoutePage
      eyebrow="SYSTEM CONSOLE"
      title="시스템관리자 콘솔"
      description="시스템관리자 하위 화면의 route 무결성과 이동 경로를 점검하는 안정화 허브입니다."
      currentRouteId="dashboard"
    />
  );
}
