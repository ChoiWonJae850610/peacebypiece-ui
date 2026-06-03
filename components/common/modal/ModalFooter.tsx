"use client";

import type { ReactNode } from "react";

import { getWaflModalFooterClassName } from "@/components/common/ui/WaflModal";

export default function ModalFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={getWaflModalFooterClassName(className)}>{children}</div>;
}
