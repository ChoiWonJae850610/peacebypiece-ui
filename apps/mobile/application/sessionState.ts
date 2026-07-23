export type SessionPhase = "checking" | "connecting" | "authenticated" | "disconnected" | "expired" | "error";

export type SessionState = {
  readonly phase: SessionPhase;
  readonly backgrounded: boolean;
};

export type SessionAction =
  | { readonly type: "check" }
  | { readonly type: "connect" }
  | { readonly type: "authenticated" }
  | { readonly type: "disconnect" }
  | { readonly type: "expire" }
  | { readonly type: "fail" }
  | { readonly type: "background" }
  | { readonly type: "foreground" };

export const INITIAL_SESSION_STATE: SessionState = { phase: "checking", backgrounded: false };

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "check": return { ...state, phase: "checking" };
    case "connect": return { ...state, phase: "connecting" };
    case "authenticated": return { ...state, phase: "authenticated" };
    case "disconnect": return { ...state, phase: "disconnected" };
    case "expire": return { ...state, phase: "expired" };
    case "fail": return { ...state, phase: "error" };
    case "background": return { ...state, backgrounded: true };
    case "foreground": return { ...state, backgrounded: false };
  }
}
