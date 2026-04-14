import type { MaterialStatusValue, MaterialTypeValue, MaterialUnitValue } from "@/lib/constants/material";


export type MaterialKind = MaterialTypeValue;

export type Material = {
  id: string;
  type: MaterialKind;
  name: string;
  vendor: string;
  quantity: number;
  unit: MaterialUnitValue;
  unitCost: number;
  totalCost: number;
  status: MaterialStatusValue;
};
