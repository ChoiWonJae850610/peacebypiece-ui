export const WORK_ORDER_COMMAND_CODES = {
  sizeStructure: {
    create: "work_order.size_structure.create",
    rename: "work_order.size_structure.rename",
    reorder: "work_order.size_structure.reorder",
    delete: "work_order.size_structure.delete",
  },
  colorStructure: {
    create: "work_order.color_structure.create",
    patch: "work_order.color_structure.patch",
    reorder: "work_order.color_structure.reorder",
    delete: "work_order.color_structure.delete",
  },
  colorSizeQuantity: {
    upsert: "work_order.color_size_quantity.upsert",
  },
  material: {
    create: "work_order.material.create",
    patch: "work_order.material.patch",
    delete: "work_order.material.delete",
    orderRequest: "work_order.material.order_request",
    orderCancel: "work_order.material.order_cancel",
    orderComplete: "work_order.material.order_complete",
    legacyArchive: "work_order.material.archive",
    legacyRestore: "work_order.material.restore",
  },
} as const;

export type WorkOrderCommandCode =
  | (typeof WORK_ORDER_COMMAND_CODES.sizeStructure)[keyof typeof WORK_ORDER_COMMAND_CODES.sizeStructure]
  | (typeof WORK_ORDER_COMMAND_CODES.colorStructure)[keyof typeof WORK_ORDER_COMMAND_CODES.colorStructure]
  | (typeof WORK_ORDER_COMMAND_CODES.colorSizeQuantity)[keyof typeof WORK_ORDER_COMMAND_CODES.colorSizeQuantity]
  | (typeof WORK_ORDER_COMMAND_CODES.material)[keyof typeof WORK_ORDER_COMMAND_CODES.material];
