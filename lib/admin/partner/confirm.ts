type DeleteOutsourcingProcessConfirmText = {
  deleteProcessTitle: string;
  deleteProcessDescription: string;
  cancel: string;
  confirmDelete: string;
  deleteProcessBody: string;
  deleteProcessMissing: string;
};

export function buildDeleteOutsourcingProcessConfirmCopy(
  deletingLabel: string | null,
  text: DeleteOutsourcingProcessConfirmText,
) {
  return {
    title: text.deleteProcessTitle,
    description: text.deleteProcessDescription,
    cancelLabel: text.cancel,
    confirmLabel: text.confirmDelete,
    body: deletingLabel
      ? text.deleteProcessBody.replace("{label}", deletingLabel)
      : text.deleteProcessMissing,
  };
}
