import { AdminTableState } from "@/components/admin/common/AdminTableState";

type PartnerMasterRowsEmptyProps = {
  label: string;
};

export default function PartnerMasterRowsEmpty({ label }: PartnerMasterRowsEmptyProps) {
  return <AdminTableState title={label} minHeightClassName="min-h-[220px]" />;
}
