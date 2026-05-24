"use client";

import { type ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

type AdminCompanyAccessGateProps = {
  accessBlocked: boolean;
  blockedPath?: string;
  children: ReactNode;
};

const ADMIN_SUBSCRIPTION_PATH = "/workspace/subscription";

export default function AdminCompanyAccessGate({ accessBlocked, blockedPath = ADMIN_SUBSCRIPTION_PATH, children }: AdminCompanyAccessGateProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!accessBlocked || pathname === blockedPath) return;
    router.replace(blockedPath);
  }, [accessBlocked, blockedPath, pathname, router]);

  return <>{children}</>;
}
