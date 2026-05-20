import CompanyInvitationJoinRequestPage from "@/components/invitations/CompanyInvitationJoinRequestPage";

type InviteCompanyPageProps = {
  params: Promise<{ token: string }>;
};

export default async function InviteCompanyPage({ params }: InviteCompanyPageProps) {
  const resolvedParams = await params;

  return <CompanyInvitationJoinRequestPage token={resolvedParams.token} />;
}
