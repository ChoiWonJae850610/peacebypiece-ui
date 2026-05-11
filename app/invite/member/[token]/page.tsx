import MemberInvitationJoinRequestPage from "@/components/invitations/MemberInvitationJoinRequestPage";

type InviteMemberPageProps = {
  params: Promise<{ token: string }>;
};

export default async function InviteMemberPage({ params }: InviteMemberPageProps) {
  const resolvedParams = await params;

  return <MemberInvitationJoinRequestPage token={resolvedParams.token} />;
}
