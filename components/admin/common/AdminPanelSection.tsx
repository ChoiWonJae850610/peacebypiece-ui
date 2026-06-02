import type { ReactNode } from "react";

import WaflSectionPanel from "@/components/admin/common/WaflSectionPanel";

type AdminPanelSectionProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  headerClassName?: string;
  headerMinClassName?: string;
  contentClassName?: string;
};

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function AdminPanelSection({
  eyebrow,
  title,
  description,
  meta,
  children,
  footer,
  className,
  headerClassName,
  headerMinClassName,
  contentClassName,
}: AdminPanelSectionProps) {
  return (
    <WaflSectionPanel
      eyebrow={eyebrow}
      title={title}
      description={description}
      meta={meta}
      footer={footer}
      className={joinClassNames("flex min-h-fit touch-pan-y flex-col overflow-visible overscroll-auto 2xl:min-h-0 2xl:overflow-hidden", className)}
      headerClassName={joinClassNames(headerMinClassName, headerClassName)}
      bodyClassName={joinClassNames("min-h-fit 2xl:min-h-0 2xl:flex-1", contentClassName)}
    >
      {children}
    </WaflSectionPanel>
  );
}
