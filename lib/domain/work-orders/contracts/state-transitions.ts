import type {
  GeneratedDocumentStatus,
  MaterialLineStatus,
  ProcessStatus,
  WorkOrderStatus,
} from "@/lib/domain/work-orders/contracts/enums";

export type TransitionContract<TState extends string> = {
  readonly from: TState;
  readonly allowedTo: readonly TState[];
  readonly editable: boolean;
  readonly createsRevision: boolean;
  readonly auditEvent: string;
  readonly documentEffect: "none" | "regenerate_on_issue" | "revoke";
};

export const WORK_ORDER_TRANSITIONS = [
  { from: "draft", allowedTo: ["ready_to_issue", "cancelled"], editable: true, createsRevision: false, auditEvent: "work_order.draft_updated", documentEffect: "none" },
  { from: "ready_to_issue", allowedTo: ["draft", "issued", "cancelled"], editable: true, createsRevision: false, auditEvent: "work_order.readiness_changed", documentEffect: "regenerate_on_issue" },
  { from: "issued", allowedTo: ["revised", "completed", "cancelled"], editable: false, createsRevision: true, auditEvent: "work_order.issued", documentEffect: "none" },
  { from: "revised", allowedTo: ["issued", "cancelled"], editable: true, createsRevision: false, auditEvent: "work_order.revision_draft_updated", documentEffect: "regenerate_on_issue" },
  { from: "completed", allowedTo: ["revised"], editable: false, createsRevision: true, auditEvent: "work_order.correction_started", documentEffect: "none" },
  { from: "cancelled", allowedTo: [], editable: false, createsRevision: false, auditEvent: "work_order.cancelled", documentEffect: "revoke" },
] as const satisfies readonly TransitionContract<WorkOrderStatus>[];

export const MATERIAL_LINE_TRANSITIONS = [
  { from: "editing", allowedTo: ["requested", "cancelled"], editable: true, createsRevision: false, auditEvent: "material_line.updated", documentEffect: "none" },
  { from: "requested", allowedTo: ["completed", "cancelled"], editable: false, createsRevision: false, auditEvent: "material_line.order_requested", documentEffect: "none" },
  { from: "completed", allowedTo: [], editable: false, createsRevision: false, auditEvent: "material_line.order_completed", documentEffect: "none" },
  { from: "cancelled", allowedTo: ["editing"], editable: false, createsRevision: false, auditEvent: "material_line.order_cancelled", documentEffect: "none" },
] as const satisfies readonly TransitionContract<MaterialLineStatus>[];

export const PROCESS_TRANSITIONS = [
  { from: "ready", allowedTo: ["in_progress"], editable: true, createsRevision: false, auditEvent: "process.updated", documentEffect: "none" },
  { from: "in_progress", allowedTo: ["completed"], editable: true, createsRevision: false, auditEvent: "process.started", documentEffect: "none" },
  { from: "completed", allowedTo: [], editable: false, createsRevision: false, auditEvent: "process.completed", documentEffect: "none" },
] as const satisfies readonly TransitionContract<ProcessStatus>[];

export const GENERATED_DOCUMENT_TRANSITIONS = [
  { from: "pending", allowedTo: ["generated", "failed"], editable: false, createsRevision: false, auditEvent: "document.generation_requested", documentEffect: "none" },
  { from: "generated", allowedTo: ["revoked"], editable: false, createsRevision: false, auditEvent: "document.generated", documentEffect: "none" },
  { from: "failed", allowedTo: [], editable: false, createsRevision: false, auditEvent: "document.generation_failed", documentEffect: "none" },
  { from: "revoked", allowedTo: ["deleted"], editable: false, createsRevision: false, auditEvent: "document.revoked", documentEffect: "revoke" },
  { from: "deleted", allowedTo: [], editable: false, createsRevision: false, auditEvent: "document.deleted", documentEffect: "none" },
] as const satisfies readonly TransitionContract<GeneratedDocumentStatus>[];
