export type InternalRuntimePolicyInput = {
  isSystemAdmin: boolean;
};

function hasSystemAdminAccess(input: InternalRuntimePolicyInput): boolean {
  return input.isSystemAdmin;
}

export function canAccessIdControl(input: InternalRuntimePolicyInput): boolean {
  return hasSystemAdminAccess(input);
}

export function canSwitchTestAccount(input: InternalRuntimePolicyInput): boolean {
  return hasSystemAdminAccess(input);
}

export function canViewFunctionsCatalog(input: InternalRuntimePolicyInput): boolean {
  return hasSystemAdminAccess(input);
}

export function canViewUICatalog(input: InternalRuntimePolicyInput): boolean {
  return hasSystemAdminAccess(input);
}

export function canViewDiagnostics(input: InternalRuntimePolicyInput): boolean {
  return hasSystemAdminAccess(input);
}
