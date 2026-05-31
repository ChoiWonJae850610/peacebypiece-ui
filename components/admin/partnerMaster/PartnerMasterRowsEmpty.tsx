import { ADMIN_RESPONSIVE_TABLE_EMPTY_CLASS } from "@/components/admin/common/responsiveTable/adminResponsiveTableStyles";

type PartnerMasterRowsEmptyProps = {
  label: string;
};

export default function PartnerMasterRowsEmpty({ label }: PartnerMasterRowsEmptyProps) {
  return (
    <div className={ADMIN_RESPONSIVE_TABLE_EMPTY_CLASS}>
      {label}
    </div>
  );
}
