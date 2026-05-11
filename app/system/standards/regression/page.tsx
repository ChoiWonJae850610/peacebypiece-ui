import SystemStandardsRegressionPage from "@/components/system/standards/SystemStandardsRegressionPage";
import { getSystemStandardsRegressionSnapshot } from "@/lib/system/standards/regressionRepository";

export default async function SystemStandardsRegressionRoute() {
  const snapshot = await getSystemStandardsRegressionSnapshot();
  return <SystemStandardsRegressionPage snapshot={snapshot} />;
}
