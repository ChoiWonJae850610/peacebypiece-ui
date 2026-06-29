import PendingApprovalDashboard from "@/components/invitations/PendingApprovalDashboard";
import SignupApplicationDashboard from "@/components/signup/SignupApplicationDashboard";

type PendingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string): string | null {
  const value = params[key];
  const firstValue = Array.isArray(value) ? value[0] : value;
  const trimmed = typeof firstValue === "string" ? firstValue.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

function getRequestType(value: string | null): "member" | "company" | null {
  return value === "member" || value === "company" ? value : null;
}

export default async function PendingPage({ searchParams }: PendingPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  if (getParam(resolvedSearchParams, "type") === "signup") {
    return <SignupApplicationDashboard />;
  }

  return (
    <PendingApprovalDashboard
      initialRequestId={getParam(resolvedSearchParams, "requestId")}
      initialApplicantEmail={getParam(resolvedSearchParams, "applicantEmail") || getParam(resolvedSearchParams, "email")}
      initialRequestType={getRequestType(getParam(resolvedSearchParams, "type"))}
    />
  );
}
