import WaflLoginPage from "@/components/auth/WaflLoginPage";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readError(params: Record<string, string | string[] | undefined>): string | null {
  const value = params.error;
  const firstValue = Array.isArray(value) ? value[0] : value;
  const trimmed = typeof firstValue === "string" ? firstValue.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  return <WaflLoginPage error={readError(resolvedSearchParams)} />;
}
