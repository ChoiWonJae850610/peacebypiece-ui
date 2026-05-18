"use client";

import { type ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

type AdminCompanyAccessGateProps = {
  accessBlocked: boolean;
  children: ReactNode;
};

const ADMIN_SUBSCRIPTION_PATH = "/admin/subscription";

export default function AdminCompanyAccessGate({ accessBlocked, children }: AdminCompanyAccessGateProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!accessBlocked || pathname === ADMIN_SUBSCRIPTION_PATH) return;
    router.replace(ADMIN_SUBSCRIPTION_PATH);
  }, [accessBlocked, pathname, router]);

  return <>{children}</>;
}
