export function createDestructiveConfirmationActions(onConfirm: () => void) {
  return Object.freeze({
    cancel: () => undefined,
    confirm: () => onConfirm(),
  });
}
