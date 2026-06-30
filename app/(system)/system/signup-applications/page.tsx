import { notFound } from "next/navigation";

import SystemSignupReviewListView from "@/components/system/signup/SystemSignupReviewListView";
import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import { listSignupReviewApplications } from "@/lib/system/signupReviewRepository";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    status?: string;
    limit?: string;
    offset?: string;
  }>;
};

export default async function SystemSignupApplicationsPage({ searchParams }: Props) {
  const actualSession = await getCurrentWaflAuthSession();
  if (!(await isActiveSystemAdminSession(actualSession))) notFound();

  const params = await searchParams;
  const result = await listSignupReviewApplications({
    statuses: params.status,
    limit: params.limit,
    offset: params.offset,
  });
  return <SystemSignupReviewListView result={result} />;
}
