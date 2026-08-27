export const REORDER_DRAFT_BASIC_EDIT_FIELDS = ["dueDate", "totalQuantity", "memo", "factoryDeliveryMemo"] as const;
export const REORDER_DRAFT_MATERIAL_EDIT_FIELDS = ["requiredQuantity", "allowanceQuantity", "inventoryUsageQuantity", "unitPrice"] as const;
export function reorderDraftPatchAllowed(fields:readonly string[],allowlist:readonly string[]){return fields.every((field)=>allowlist.includes(field));}
export function isReorderDraftIdentity(input:{readonly derivationKind:string;readonly reorderRound:number|string}){return input.derivationKind==="reorder"&&Number(input.reorderRound)>0;}
