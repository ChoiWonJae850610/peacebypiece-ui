"use client";

import type { ReactNode } from "react";

export default function ModalFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`shrink-0 border-t px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:px-6 md:pb-4 pbp-modal-chrome ${className}`.trim()}>
      {children}
    </div>
  );
}
