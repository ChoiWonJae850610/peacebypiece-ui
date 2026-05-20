import WaflLoginPage from "@/components/auth/WaflLoginPage";
import { readLoginErrorParam, type LoginPageSearchParams } from "@/lib/auth/loginPageParams";

type LoginPageProps = {
  searchParams?: Promise<LoginPageSearchParams>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  return <WaflLoginPage error={readLoginErrorParam(resolvedSearchParams)} />;
}
