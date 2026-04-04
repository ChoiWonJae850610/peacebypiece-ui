"use client";

import type { ReactNode } from "react";

export default function ModalBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6 md:py-5 md:pb-6 ${className}`.trim()}>
      {children}
    </div>
  );
}
