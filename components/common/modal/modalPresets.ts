export const MODAL_EXCEPTION_PRESETS = {
  attachmentPreview: {
    maxWidthClass: "md:max-w-4xl",
    overlayClassName: "pbp-modal-overlay",
    bodyClassName: "p-4 md:p-6",
  },
  inventoryLog: {
    maxWidthClass: "md:max-w-2xl",
  },
  adminPanel: {
    maxWidthClass: "md:max-w-3xl",
    bodyClassName: "space-y-4",
  },
} as const;
