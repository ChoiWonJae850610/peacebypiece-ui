import type { MaterialKindValue } from "@/lib/constants/workorderDomain";

export type MaterialKind = MaterialKindValue;

export type Material = {
  id: string;
  type: MaterialKind;
  name: string;
  vendor: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  status: string;
};
