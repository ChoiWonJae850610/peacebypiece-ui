import WaflLoginPage from "@/components/auth/WaflLoginPage";
import { readLoginErrorParam, type LoginPageSearchParams } from "@/lib/auth/loginPageParams";

type RootPageProps = {
  searchParams?: Promise<LoginPageSearchParams>;
};

export default async function RootPage({ searchParams }: RootPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  return <WaflLoginPage error={readLoginErrorParam(resolvedSearchParams)} />;
}
