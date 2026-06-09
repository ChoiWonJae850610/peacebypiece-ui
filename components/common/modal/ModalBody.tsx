"use client";

import type { ReactNode } from "react";

import { getWaflModalBodyClassName } from "@/components/common/ui";

export default function ModalBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div data-wafl-component="modal-body" className={getWaflModalBodyClassName(className)}>{children}</div>;
}
