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
    <div className={`shrink-0 border-t border-stone-200 bg-white px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:px-6 md:pb-4 ${className}`.trim()}>
      {children}
    </div>
  );
}
