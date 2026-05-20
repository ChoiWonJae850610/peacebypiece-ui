import SystemStandardsSeedStatusPage from "@/components/system/standards/SystemStandardsSeedStatusPage";
import { getSystemStandardsSeedStatus } from "@/lib/system/standards/seedStatusRepository";

export default async function SystemStandardsSeedStatusRoute() {
  const seedStatus = await getSystemStandardsSeedStatus();
  return <SystemStandardsSeedStatusPage seedStatus={seedStatus} />;
}
