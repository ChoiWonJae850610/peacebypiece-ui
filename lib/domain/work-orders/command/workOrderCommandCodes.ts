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
  structureSelection: {
    batch: "work_order.structure_selection.batch",
  },
  measurement: {
    applyTemplate: "work_order.measurement.apply_template",
    patchUnit: "work_order.measurement.patch_unit",
    patchCell: "work_order.measurement.patch_cell",
    sizeCreate: "work_order.measurement.size.create",
    sizePatch: "work_order.measurement.size.patch",
    sizeDelete: "work_order.measurement.size.delete",
    sizeReorder: "work_order.measurement.size.reorder",
    pomCreate: "work_order.measurement.pom.create",
    pomPatch: "work_order.measurement.pom.patch",
    pomDelete: "work_order.measurement.pom.delete",
    pomReorder: "work_order.measurement.pom.reorder",
    pomSelectionBatch: "work_order.measurement.pom_selection.batch",
    saveCompanyTemplate: "work_order.measurement.save_company_template",
    updateCompanyTemplate: "work_order.measurement.update_company_template",
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
  productionProcess: {
    create: "work_order.production_process.create",
    update: "work_order.production_process.update",
    delete: "work_order.production_process.delete",
    orderRequest: "work_order.production_process.order_request",
    orderCancel: "work_order.production_process.order_cancel",
    orderComplete: "work_order.production_process.order_complete",
  },
} as const;

export type WorkOrderCommandCode =
  | (typeof WORK_ORDER_COMMAND_CODES.sizeStructure)[keyof typeof WORK_ORDER_COMMAND_CODES.sizeStructure]
  | (typeof WORK_ORDER_COMMAND_CODES.colorStructure)[keyof typeof WORK_ORDER_COMMAND_CODES.colorStructure]
  | (typeof WORK_ORDER_COMMAND_CODES.colorSizeQuantity)[keyof typeof WORK_ORDER_COMMAND_CODES.colorSizeQuantity]
  | (typeof WORK_ORDER_COMMAND_CODES.structureSelection)[keyof typeof WORK_ORDER_COMMAND_CODES.structureSelection]
  | (typeof WORK_ORDER_COMMAND_CODES.measurement)[keyof typeof WORK_ORDER_COMMAND_CODES.measurement]
  | (typeof WORK_ORDER_COMMAND_CODES.material)[keyof typeof WORK_ORDER_COMMAND_CODES.material]
  | (typeof WORK_ORDER_COMMAND_CODES.productionProcess)[keyof typeof WORK_ORDER_COMMAND_CODES.productionProcess];

export const MEASUREMENT_SNAPSHOT_CONTENT_COMMAND_CODES = [
  WORK_ORDER_COMMAND_CODES.sizeStructure.create,
  WORK_ORDER_COMMAND_CODES.sizeStructure.rename,
  WORK_ORDER_COMMAND_CODES.sizeStructure.reorder,
  WORK_ORDER_COMMAND_CODES.sizeStructure.delete,
  WORK_ORDER_COMMAND_CODES.measurement.patchCell,
  WORK_ORDER_COMMAND_CODES.measurement.sizeCreate,
  WORK_ORDER_COMMAND_CODES.measurement.sizePatch,
  WORK_ORDER_COMMAND_CODES.measurement.sizeDelete,
  WORK_ORDER_COMMAND_CODES.measurement.sizeReorder,
  WORK_ORDER_COMMAND_CODES.measurement.pomCreate,
  WORK_ORDER_COMMAND_CODES.measurement.pomPatch,
  WORK_ORDER_COMMAND_CODES.measurement.pomDelete,
  WORK_ORDER_COMMAND_CODES.measurement.pomReorder,
  WORK_ORDER_COMMAND_CODES.measurement.pomSelectionBatch,
] as const satisfies readonly WorkOrderCommandCode[];
