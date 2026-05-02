import InviteAcceptSkeleton from "@/components/invitations/InviteAcceptSkeleton";

interface InviteTokenPageProps {
  params: Promise<{
    token?: string;
  }>;
}

export default async function InviteTokenPage({ params }: InviteTokenPageProps) {
  const resolvedParams = await params;

  return <InviteAcceptSkeleton token={resolvedParams.token ?? ""} />;
}
