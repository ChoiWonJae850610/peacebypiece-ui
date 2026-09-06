export function isWorkOrderSketchAuthoringEnabled(input: Readonly<{
  authenticated: boolean;
  dev: boolean;
}>): boolean {
  return input.authenticated && input.dev;
}
