import type { MaterialStatusValue, MaterialTypeValue, MaterialUnitValue } from "@/lib/constants/material";
import type { RegistryTypeValue } from "@/lib/constants/workorderDomain";

export type MaterialKind = MaterialTypeValue;

export type MaterialVendorRef = {
  type: RegistryTypeValue;
  name: string;
};

export type Material = {
  id: string;
  type: MaterialKind;
  name: string;
  vendor: string;
  vendorRef?: MaterialVendorRef | null;
  quantity: number;
  unit: MaterialUnitValue;
  unitCost: number;
  totalCost: number;
  status: MaterialStatusValue;
};
