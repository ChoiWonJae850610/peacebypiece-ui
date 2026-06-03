"use client";

import type { ReactNode } from "react";

import { getWaflModalBodyClassName } from "@/components/common/ui/WaflModal";

export default function ModalBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={getWaflModalBodyClassName(className)}>{children}</div>;
}
