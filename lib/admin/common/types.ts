import type { ReactNode } from "react";

export interface AdminBaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AdminTableSortDirection = "asc" | "desc";

export type AdminTableSortState<TKey extends string = string> = {
  key: TKey;
  direction: AdminTableSortDirection;
};

export type AdminTableColumn<TItem, TSortKey extends string = string> = {
  key: string;
  label: ReactNode;
  className?: string;
  headerClassName?: string;
  sortKey?: TSortKey;
  sortAlign?: "left" | "center";
  render: (item: TItem) => ReactNode;
};
