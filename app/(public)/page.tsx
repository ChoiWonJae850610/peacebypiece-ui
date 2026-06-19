import WaflLoginPage from "@/components/auth/WaflLoginPage";
import { readLoginErrorParam, readLoginReturnToParam, type LoginPageSearchParams } from "@/lib/auth/loginPageParams";

type RootPageProps = {
  searchParams?: Promise<LoginPageSearchParams>;
};

export default async function RootPage({ searchParams }: RootPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  return <WaflLoginPage error={readLoginErrorParam(resolvedSearchParams)} returnTo={readLoginReturnToParam(resolvedSearchParams)} />;
}
