import type { ReactNode } from "react";

type WorkOrderDetailSectionStackProps = {
  children: ReactNode;
  device: "mobile" | "tablet";
};

const SECTION_STACK_CLASS_BY_DEVICE = {
  mobile: "space-y-3.5",
  tablet: "grid gap-4",
} as const;

export default function WorkOrderDetailSectionStack({
  children,
  device,
}: WorkOrderDetailSectionStackProps) {
  return (
    <div
      data-wafl-device-density={device}
      className={SECTION_STACK_CLASS_BY_DEVICE[device]}
    >
      {children}
    </div>
  );
}
