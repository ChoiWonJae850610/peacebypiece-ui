export type WorkOrderSketchTextAnchor = Readonly<{ x: number; y: number }>;

export type WorkOrderSketchTextSession = Readonly<{
  anchor: WorkOrderSketchTextAnchor;
  draft: string;
  focusRequested: boolean;
  id: number;
  phase: "opening" | "presented" | "closing";
}>;

export function createWorkOrderSketchTextSession(
  id: number,
  anchor: WorkOrderSketchTextAnchor,
): WorkOrderSketchTextSession {
  return Object.freeze({ anchor: Object.freeze({ ...anchor }), draft: "", focusRequested: false, id, phase: "opening" });
}

export function presentWorkOrderSketchTextSession(
  session: WorkOrderSketchTextSession | null,
  presentedSessionId: number,
): Readonly<{ requestFocus: boolean; session: WorkOrderSketchTextSession | null }> {
  if (
    session === null
    || session.id !== presentedSessionId
    || session.phase !== "opening"
    || session.focusRequested
  ) return Object.freeze({ requestFocus: false, session });
  return Object.freeze({
    requestFocus: false,
    session: Object.freeze({ ...session, focusRequested: false, phase: "presented" }),
  });
}

export function updateWorkOrderSketchTextDraft(
  session: WorkOrderSketchTextSession | null,
  draft: string,
): WorkOrderSketchTextSession | null {
  return session === null ? null : Object.freeze({ ...session, draft });
}

export function closeWorkOrderSketchTextSession(
  session: WorkOrderSketchTextSession | null,
): WorkOrderSketchTextSession | null {
  return session === null ? null : Object.freeze({ ...session, phase: "closing" });
}

export function isCurrentWorkOrderSketchTextSession(
  session: WorkOrderSketchTextSession | null,
  sessionId: number,
) {
  return session !== null && session.id === sessionId;
}
