import type { ReactNode } from "react";

export interface AdminBaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AdminTableColumn<TItem> = {
  key: string;
  label: ReactNode;
  className?: string;
  headerClassName?: string;
  render: (item: TItem) => ReactNode;
};
