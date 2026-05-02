import SystemRegressionRoutePage from "@/components/system/regression/SystemRegressionRoutePage";

export default function SystemCompanyPlanSkeleton() {
  return (
    <SystemRegressionRoutePage
      eyebrow="SYSTEM BILLING"
      title="요금제·용량"
      description="요금제·용량 route의 무결성 점검 화면입니다. 본 billing UI 재연결은 JSX 무결성 확인 후 별도 버전에서 진행합니다."
      currentRouteId="billing"
    />
  );
}
