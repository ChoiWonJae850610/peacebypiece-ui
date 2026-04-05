export type MaterialKind = "원단" | "부자재" | "기타";

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
