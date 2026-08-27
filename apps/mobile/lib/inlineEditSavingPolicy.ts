export function isInlineEditInputEditable(input: {
  readonly saving: boolean;
  readonly allowEditingWhileSaving: boolean;
}): boolean {
  return input.allowEditingWhileSaving || !input.saving;
}
