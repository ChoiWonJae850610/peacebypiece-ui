import { notFound } from "next/navigation";

import SystemSignupReviewDetailView from "@/components/system/signup/SystemSignupReviewDetailView";
import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import { getSignupReviewApplicationDetail } from "@/lib/system/signupReviewRepository";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    applicationId: string;
  }>;
};

export default async function SystemSignupApplicationDetailPage({ params }: Props) {
  const actualSession = await getCurrentWaflAuthSession();
  if (!(await isActiveSystemAdminSession(actualSession))) notFound();

  const { applicationId } = await params;
  const application = await getSignupReviewApplicationDetail(applicationId);
  if (!application) notFound();

  return <SystemSignupReviewDetailView application={application} />;
}
