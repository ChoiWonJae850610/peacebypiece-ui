import "server-only";

import { performance } from "perf_hooks";
import type { CompanyMemberId, EntityVersion, ProcessId, TenantMemberScope, WorkOrderId } from "@/lib/domain/work-orders/contracts";
import { queryDb, withWaflV2TenantWriteTransaction, type DbQueryResultRow, type DbTransactionClient } from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import type { DeleteProductionProcessCommand, ProductionOrderTransitionKind, ProductionProcessCommand, ProductionProcessWrite } from "@/lib/domain/work-orders/command/processValidation";
import { WORK_ORDER_FACTORY_PROCESS_CODE, WORK_ORDER_PROCESS_UNIT_CODE } from "@/lib/domain/work-orders/productionProcessPolicy";
import { WORK_ORDER_COMMAND_CODES } from "@/lib/domain/work-orders/command/workOrderCommandCodes";

export const PRODUCTION_PROCESS_CREATE_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.productionProcess.create;
export const PRODUCTION_PROCESS_UPDATE_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.productionProcess.update;
export const PRODUCTION_PROCESS_DELETE_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.productionProcess.delete;
export const PRODUCTION_PROCESS_ORDER_REQUEST_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.productionProcess.orderRequest;
export const PRODUCTION_PROCESS_ORDER_CANCEL_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.productionProcess.orderCancel;
export const PRODUCTION_PROCESS_ORDER_COMPLETE_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.productionProcess.orderComplete;

export type ProcessFailure = "not_found" | "conflict" | "locked" | "revision_mismatch" | "invalid_option" | "factory_exists" | "order_not_ready" | "invalid_state_transition" | "idempotency_conflict" | "idempotency_incomplete";
export class ProcessCommandRepositoryError extends Error {
  constructor(readonly reason: ProcessFailure, readonly entityVersion: number | null = null) { super(reason); this.name = "ProcessCommandRepositoryError"; }
}

type MutationContext = { statementCount: number };
type TargetRow = DbQueryResultRow & { work_order_version: number | string; work_order_status: string; total_quantity: number | string; revision_id: string; revision_status: string; derivation_kind: string; reorder_round: number | string };
type ReceiptRow = DbQueryResultRow & { request_sha256: string; work_order_id: string | null; result_revision_id: string | null; result_entity_version: number | string | null };

async function reserveReceipt(client: DbTransactionClient, context: MutationContext, input: { scope: TenantMemberScope; commandCode: string; keyHash: string; requestHash: string }) {
  const inserted = await client.query<ReceiptRow>(`INSERT INTO work_order_command_receipts(company_id,command_code,idempotency_key,request_sha256,correlation_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(company_id,command_code,idempotency_key) DO NOTHING RETURNING request_sha256,work_order_id,result_revision_id,result_entity_version`, [input.scope.companyId,input.commandCode,input.keyHash,input.requestHash,input.scope.correlationId]); context.statementCount += 1;
  if (inserted.rows[0]) return null;
  const selected = await client.query<ReceiptRow>(`SELECT request_sha256,work_order_id,result_revision_id,result_entity_version FROM work_order_command_receipts WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3`, [input.scope.companyId,input.commandCode,input.keyHash]); context.statementCount += 1;
  const receipt=selected.rows[0];
  if(!receipt) throw new ProcessCommandRepositoryError("idempotency_incomplete");
  if(receipt.request_sha256!==input.requestHash) throw new ProcessCommandRepositoryError("idempotency_conflict",receipt.result_entity_version===null?null:Number(receipt.result_entity_version));
  if(!receipt.work_order_id||!receipt.result_revision_id||receipt.result_entity_version===null) throw new ProcessCommandRepositoryError("idempotency_incomplete");
  return receipt;
}

async function completeReceipt(client: DbTransactionClient, context: MutationContext, input: { scope: TenantMemberScope; commandCode: string; keyHash: string; workOrderId: string; revisionId: string; nextVersion: number }) {
  await client.query(`UPDATE work_order_command_receipts SET work_order_id=$4::uuid,result_revision_id=$5::uuid,result_entity_version=$6 WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3`, [input.scope.companyId,input.commandCode,input.keyHash,input.workOrderId,input.revisionId,input.nextVersion]); context.statementCount += 1;
}

async function lockTarget(client: DbTransactionClient, context: MutationContext, input: { scope: TenantMemberScope; workOrderId: WorkOrderId; assignedCompanyMemberId: CompanyMemberId | null }, allowReorderValues = false, allowConfirmedFactoryMemo = false) {
  const selected=await client.query<TargetRow>(`SELECT w.entity_version work_order_version,w.status work_order_status,w.total_quantity,w.derivation_kind,w.reorder_round,r.id revision_id,r.revision_status FROM work_orders w JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id WHERE w.company_id=$1 AND w.id=$2::uuid AND w.deleted_at IS NULL AND ($3::text IS NULL OR w.assignee_member_id=$3) FOR UPDATE OF w,r`,[input.scope.companyId,input.workOrderId,input.assignedCompanyMemberId]); context.statementCount+=1;
  const row=selected.rows[0]; if(!row)throw new ProcessCommandRepositoryError("not_found");
  const draftMutable=row.work_order_status==="draft"&&row.revision_status==="draft";
  const confirmedMemoMutable=allowConfirmedFactoryMemo&&["issued","revised","completed"].includes(String(row.work_order_status))&&["finalized","superseded"].includes(String(row.revision_status));
  if(!draftMutable&&!confirmedMemoMutable)throw new ProcessCommandRepositoryError("locked",Number(row.work_order_version));
  if(row.derivation_kind==="reorder"&&Number(row.reorder_round)>0&&!allowReorderValues)throw new ProcessCommandRepositoryError("locked",Number(row.work_order_version));
  return row;
}

async function resolveCanonicalSelection(context: MutationContext, scope: TenantMemberScope, process: ProductionProcessWrite) {
  if(process.role==="factory") {
    const partner=await queryDb<DbQueryResultRow>(`SELECT p.id,p.name FROM partners p JOIN partner_items pi ON pi.company_id=p.company_id AND pi.partner_id=p.id WHERE p.company_id=$1 AND p.id=$2 AND p.is_active=true AND pi.is_active=true AND pi.item_type='factory' LIMIT 1`,[scope.companyId,process.partnerId]); context.statementCount+=1;
    if(!partner.rows[0])throw new ProcessCommandRepositoryError("invalid_option");
    return { processTypeCode:WORK_ORDER_FACTORY_PROCESS_CODE, processName:"제작 공장", partnerId:String(partner.rows[0].id), partnerName:String(partner.rows[0].name) };
  }
  const standard=await queryDb<DbQueryResultRow>(`SELECT s.id,s.code,s.name FROM system_outsourcing_process_standards s LEFT JOIN company_enabled_process_standards e ON e.process_standard_id=s.id AND e.company_id=$1 WHERE s.is_active=true AND COALESCE(e.is_enabled,true)=true AND (s.code=$2 OR s.id=$2) LIMIT 1`,[scope.companyId,process.processCode]); context.statementCount+=1;
  const selectedStandard=standard.rows[0]; if(!selectedStandard)throw new ProcessCommandRepositoryError("invalid_option");
  const partner=await queryDb<DbQueryResultRow>(`SELECT DISTINCT p.id,p.name FROM partners p JOIN partner_items pi ON pi.company_id=p.company_id AND pi.partner_id=p.id LEFT JOIN outsourcing_processes o ON o.company_id=pi.company_id AND o.id=pi.outsourcing_process_id WHERE p.company_id=$1 AND p.id=$2 AND p.is_active=true AND pi.is_active=true AND pi.item_type='outsourcing' AND (pi.outsourcing_process_id=$3 OR o.name=$4 OR pi.item_name=$4) LIMIT 1`,[scope.companyId,process.partnerId,String(selectedStandard.id),String(selectedStandard.name)]); context.statementCount+=1;
  if(!partner.rows[0])throw new ProcessCommandRepositoryError("invalid_option");
  return { processTypeCode:String(selectedStandard.code??selectedStandard.id), processName:String(selectedStandard.name), partnerId:String(partner.rows[0].id), partnerName:String(partner.rows[0].name) };
}

async function advanceParent(client: DbTransactionClient, context: MutationContext, input: { scope: TenantMemberScope; workOrderId: WorkOrderId; revisionId: string; expectedVersion: EntityVersion; workOrderStatus?: string; revisionStatus?: string }) {
  const result=await client.query<DbQueryResultRow>(`WITH totals AS (SELECT COALESCE(sum(amount),0)::numeric(14,2) total FROM work_order_processes WHERE company_id=$1 AND revision_id=$4::uuid),wo AS (UPDATE work_orders SET entity_version=entity_version+1,updated_at=now() WHERE company_id=$1 AND id=$2::uuid AND entity_version=$3 AND status=$5 RETURNING entity_version),rev AS (UPDATE work_order_revisions r SET entity_version=entity_version+1,process_total=t.total,estimated_total=r.fabric_total+r.accessory_total+t.total,updated_at=now() FROM totals t WHERE r.company_id=$1 AND r.id=$4::uuid AND r.revision_status=$6 RETURNING r.id) SELECT entity_version FROM wo WHERE EXISTS(SELECT 1 FROM rev)`,[input.scope.companyId,input.workOrderId,input.expectedVersion,input.revisionId,input.workOrderStatus??"draft",input.revisionStatus??"draft"]); context.statementCount+=1;
  const next=Number(result.rows[0]?.entity_version); if(!next)throw new ProcessCommandRepositoryError("conflict",input.expectedVersion); return next;
}

async function emitEvent(client: DbTransactionClient, context: MutationContext, input:{scope:TenantMemberScope;workOrderId:WorkOrderId;commandCode:string;summary:string;metadata:object}) {
  await client.query(`INSERT INTO domain_events(company_id,entity_type,entity_id,command_code,actor_member_id,correlation_id,change_summary,metadata,schema_version) VALUES($1,'work_order',$2,$3,$4,$5,$6,$7::jsonb,1)`,[input.scope.companyId,input.workOrderId,input.commandCode,input.scope.companyMemberId,input.scope.correlationId,input.summary,JSON.stringify(input.metadata)]); context.statementCount+=1;
}

type Common = { readonly scope: TenantMemberScope; readonly assignedCompanyMemberId: CompanyMemberId | null; readonly workOrderId: WorkOrderId; readonly keyHash: string; readonly requestHash: string };

export async function createProductionProcessV2(input: Common & { readonly processId: ProcessId; readonly command: ProductionProcessCommand }) {
  const started=performance.now(); const context:MutationContext={statementCount:0};
  const canonical=await resolveCanonicalSelection(context,input.scope,input.command.process);
  const data=await withWaflV2TenantWriteTransaction(async(client)=>{await installTenantClaims(client,input.scope);context.statementCount+=1;const receipt=await reserveReceipt(client,context,{scope:input.scope,commandCode:PRODUCTION_PROCESS_CREATE_COMMAND_CODE,keyHash:input.keyHash,requestHash:input.requestHash});if(receipt)return{workOrderId:input.workOrderId,revisionId:String(receipt.result_revision_id),processId:input.processId,nextVersion:Number(receipt.result_entity_version),idempotentReplay:true};const target=await lockTarget(client,context,input);const version=Number(target.work_order_version);if(version!==input.command.expectedVersion)throw new ProcessCommandRepositoryError("conflict",version);if(input.command.process.role==="factory"){const existing=await client.query<DbQueryResultRow>(`SELECT 1 FROM work_order_processes WHERE company_id=$1 AND revision_id=$2::uuid AND process_type_code=$3 LIMIT 1`,[input.scope.companyId,target.revision_id,WORK_ORDER_FACTORY_PROCESS_CODE]);context.statementCount+=1;if(existing.rows[0])throw new ProcessCommandRepositoryError("factory_exists",version);}const inserted=await client.query<DbQueryResultRow>(`INSERT INTO work_order_processes(id,company_id,revision_id,process_type_code,process_name_snapshot,partner_id,partner_name_snapshot,quantity,due_date,unit_code,unit_price,amount,memo,status,display_order,entity_version) SELECT $1::uuid,$2,$3::uuid,$4,$5,$6,$7,$8::numeric,NULL,$9,$10::numeric,round($8::numeric*$10::numeric,2),$11,'ready',COALESCE(max(display_order),-1)+1,1 FROM work_order_processes WHERE company_id=$2 AND revision_id=$3::uuid RETURNING id`,[input.processId,input.scope.companyId,target.revision_id,canonical.processTypeCode,canonical.processName,canonical.partnerId,canonical.partnerName,String(target.total_quantity),WORK_ORDER_PROCESS_UNIT_CODE,input.command.process.unitPrice,input.command.process.memo]);context.statementCount+=1;if(!inserted.rows[0])throw new ProcessCommandRepositoryError("conflict",version);const nextVersion=await advanceParent(client,context,{scope:input.scope,workOrderId:input.workOrderId,revisionId:String(target.revision_id),expectedVersion:input.command.expectedVersion});await emitEvent(client,context,{scope:input.scope,workOrderId:input.workOrderId,commandCode:PRODUCTION_PROCESS_CREATE_COMMAND_CODE,summary:input.command.process.role==="factory"?"제작 공장 설정":"추가 공정 등록",metadata:{processId:input.processId,role:input.command.process.role,clientRequestId:input.command.clientRequestId,versionTransition:{from:version,to:nextVersion}}});await completeReceipt(client,context,{scope:input.scope,commandCode:PRODUCTION_PROCESS_CREATE_COMMAND_CODE,keyHash:input.keyHash,workOrderId:input.workOrderId,revisionId:String(target.revision_id),nextVersion});return{workOrderId:input.workOrderId,revisionId:String(target.revision_id),processId:input.processId,nextVersion,idempotentReplay:false};});
  return{data,statementCount:context.statementCount,transactionCount:1 as const,dbMs:Number((performance.now()-started).toFixed(2))};
}

export async function updateProductionProcessV2(input: Common & { readonly processId: ProcessId; readonly command: ProductionProcessCommand }) {
  const started=performance.now();const context:MutationContext={statementCount:0};const canonical=await resolveCanonicalSelection(context,input.scope,input.command.process);const data=await withWaflV2TenantWriteTransaction(async(client)=>{await installTenantClaims(client,input.scope);context.statementCount+=1;const receipt=await reserveReceipt(client,context,{scope:input.scope,commandCode:PRODUCTION_PROCESS_UPDATE_COMMAND_CODE,keyHash:input.keyHash,requestHash:input.requestHash});if(receipt)return{workOrderId:input.workOrderId,revisionId:String(receipt.result_revision_id),processId:input.processId,nextVersion:Number(receipt.result_entity_version),idempotentReplay:true};const target=await lockTarget(client,context,input,true,true);const version=Number(target.work_order_version);if(version!==input.command.expectedVersion)throw new ProcessCommandRepositoryError("conflict",version);const current=await client.query<DbQueryResultRow>(`SELECT id,status,process_type_code,partner_id,unit_price,memo FROM work_order_processes WHERE company_id=$1 AND revision_id=$2::uuid AND id=$3::uuid FOR UPDATE`,[input.scope.companyId,target.revision_id,input.processId]);context.statementCount+=1;if(!current.rows[0])throw new ProcessCommandRepositoryError("not_found",version);const confirmedMemoMutation=target.work_order_status!=="draft";if(confirmedMemoMutation){if(input.command.process.role!=="factory"||String(current.rows[0].process_type_code)!==WORK_ORDER_FACTORY_PROCESS_CODE||canonical.processTypeCode!==WORK_ORDER_FACTORY_PROCESS_CODE||String(current.rows[0].partner_id)!==canonical.partnerId||String(current.rows[0].unit_price)!==String(input.command.process.unitPrice))throw new ProcessCommandRepositoryError("locked",version);}else if(current.rows[0].status!=="ready")throw new ProcessCommandRepositoryError("locked",version);if(target.derivation_kind==="reorder"&&Number(target.reorder_round)>0&&!confirmedMemoMutation&&(String(current.rows[0].process_type_code)!==canonical.processTypeCode||String(current.rows[0].partner_id)!==canonical.partnerId||(input.command.process.role!=="factory"&&(input.command.process.memo??null)!==(current.rows[0].memo??null))))throw new ProcessCommandRepositoryError("locked",version);if(input.command.process.role==="factory"&&!confirmedMemoMutation){const duplicate=await client.query<DbQueryResultRow>(`SELECT 1 FROM work_order_processes WHERE company_id=$1 AND revision_id=$2::uuid AND process_type_code=$3 AND id<>$4::uuid LIMIT 1`,[input.scope.companyId,target.revision_id,WORK_ORDER_FACTORY_PROCESS_CODE,input.processId]);context.statementCount+=1;if(duplicate.rows[0])throw new ProcessCommandRepositoryError("factory_exists",version);}if(confirmedMemoMutation){await client.query(`UPDATE work_order_processes SET memo=$4,entity_version=entity_version+1,updated_at=now() WHERE company_id=$1 AND revision_id=$2::uuid AND id=$3::uuid`,[input.scope.companyId,target.revision_id,input.processId,input.command.process.memo]);}else{await client.query(`UPDATE work_order_processes SET process_type_code=$4,process_name_snapshot=$5,partner_id=$6,partner_name_snapshot=$7,quantity=$8::numeric,unit_code=$9,unit_price=$10::numeric,amount=round($8::numeric*$10::numeric,2),memo=$11,entity_version=entity_version+1,updated_at=now() WHERE company_id=$1 AND revision_id=$2::uuid AND id=$3::uuid`,[input.scope.companyId,target.revision_id,input.processId,canonical.processTypeCode,canonical.processName,canonical.partnerId,canonical.partnerName,String(target.total_quantity),WORK_ORDER_PROCESS_UNIT_CODE,input.command.process.unitPrice,input.command.process.memo]);}context.statementCount+=1;const nextVersion=await advanceParent(client,context,{scope:input.scope,workOrderId:input.workOrderId,revisionId:String(target.revision_id),expectedVersion:input.command.expectedVersion,workOrderStatus:String(target.work_order_status),revisionStatus:String(target.revision_status)});await emitEvent(client,context,{scope:input.scope,workOrderId:input.workOrderId,commandCode:PRODUCTION_PROCESS_UPDATE_COMMAND_CODE,summary:confirmedMemoMutation?"확정 WorkOrder 공장 전달 메모 수정":input.command.process.role==="factory"?"제작 공장 수정":"추가 공정 수정",metadata:{processId:input.processId,role:input.command.process.role,clientRequestId:input.command.clientRequestId,versionTransition:{from:version,to:nextVersion}}});await completeReceipt(client,context,{scope:input.scope,commandCode:PRODUCTION_PROCESS_UPDATE_COMMAND_CODE,keyHash:input.keyHash,workOrderId:input.workOrderId,revisionId:String(target.revision_id),nextVersion});return{workOrderId:input.workOrderId,revisionId:String(target.revision_id),processId:input.processId,nextVersion,idempotentReplay:false};});return{data,statementCount:context.statementCount,transactionCount:1 as const,dbMs:Number((performance.now()-started).toFixed(2))};
}

export async function deleteProductionProcessV2(input: Common & { readonly processId: ProcessId; readonly command: DeleteProductionProcessCommand }) {
  const started=performance.now();const context:MutationContext={statementCount:0};const data=await withWaflV2TenantWriteTransaction(async(client)=>{await installTenantClaims(client,input.scope);context.statementCount+=1;const receipt=await reserveReceipt(client,context,{scope:input.scope,commandCode:PRODUCTION_PROCESS_DELETE_COMMAND_CODE,keyHash:input.keyHash,requestHash:input.requestHash});if(receipt)return{workOrderId:input.workOrderId,revisionId:String(receipt.result_revision_id),processId:null,nextVersion:Number(receipt.result_entity_version),idempotentReplay:true};const target=await lockTarget(client,context,input);const version=Number(target.work_order_version);if(version!==input.command.expectedVersion)throw new ProcessCommandRepositoryError("conflict",version);const removed=await client.query<DbQueryResultRow>(`DELETE FROM work_order_processes WHERE company_id=$1 AND revision_id=$2::uuid AND id=$3::uuid AND status='ready' RETURNING id`,[input.scope.companyId,target.revision_id,input.processId]);context.statementCount+=1;if(!removed.rows[0])throw new ProcessCommandRepositoryError("not_found",version);const nextVersion=await advanceParent(client,context,{scope:input.scope,workOrderId:input.workOrderId,revisionId:String(target.revision_id),expectedVersion:input.command.expectedVersion});await emitEvent(client,context,{scope:input.scope,workOrderId:input.workOrderId,commandCode:PRODUCTION_PROCESS_DELETE_COMMAND_CODE,summary:"제작 공정 삭제",metadata:{processId:input.processId,clientRequestId:input.command.clientRequestId,versionTransition:{from:version,to:nextVersion}}});await completeReceipt(client,context,{scope:input.scope,commandCode:PRODUCTION_PROCESS_DELETE_COMMAND_CODE,keyHash:input.keyHash,workOrderId:input.workOrderId,revisionId:String(target.revision_id),nextVersion});return{workOrderId:input.workOrderId,revisionId:String(target.revision_id),processId:null,nextVersion,idempotentReplay:false};});return{data,statementCount:context.statementCount,transactionCount:1 as const,dbMs:Number((performance.now()-started).toFixed(2))};
}

const PRODUCTION_ORDER_TRANSITIONS = {
  request: { commandCode: PRODUCTION_PROCESS_ORDER_REQUEST_COMMAND_CODE, from: "ready", to: "in_progress", summary: "제작 공장 발주 요청" },
  cancel: { commandCode: PRODUCTION_PROCESS_ORDER_CANCEL_COMMAND_CODE, from: "in_progress", to: "ready", summary: "제작 공장 발주 요청 취소" },
  complete: { commandCode: PRODUCTION_PROCESS_ORDER_COMPLETE_COMMAND_CODE, from: "in_progress", to: "completed", summary: "제작 공장 발주 완료" },
} as const;

export async function transitionProductionProcessOrderV2(input: Common & { readonly processId: ProcessId; readonly command: DeleteProductionProcessCommand; readonly kind: ProductionOrderTransitionKind }) {
  const started = performance.now();
  const context: MutationContext = { statementCount: 0 };
  const transition = PRODUCTION_ORDER_TRANSITIONS[input.kind];
  const data = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const receipt = await reserveReceipt(client, context, { scope: input.scope, commandCode: transition.commandCode, keyHash: input.keyHash, requestHash: input.requestHash });
    if (receipt) return { workOrderId: input.workOrderId, revisionId: String(receipt.result_revision_id), processId: input.processId, nextVersion: Number(receipt.result_entity_version), idempotentReplay: true };
    // Reorder process identity remains locked; only its own factory order
    // lifecycle may transition independently from the source WorkOrder.
    const target = await lockTarget(client, context, input, true);
    const version = Number(target.work_order_version);
    if (version !== input.command.expectedVersion) throw new ProcessCommandRepositoryError("conflict", version);
    const selected = await client.query<DbQueryResultRow>(`
      SELECT id,status,partner_id,unit_price,quantity,process_type_code,entity_version
      FROM work_order_processes
      WHERE company_id=$1 AND revision_id=$2::uuid AND id=$3::uuid
      FOR UPDATE
    `, [input.scope.companyId, target.revision_id, input.processId]);
    context.statementCount += 1;
    const current = selected.rows[0];
    if (!current) throw new ProcessCommandRepositoryError("not_found", version);
    if (current.process_type_code !== WORK_ORDER_FACTORY_PROCESS_CODE) throw new ProcessCommandRepositoryError("invalid_state_transition", version);
    if (current.status !== transition.from) throw new ProcessCommandRepositoryError("invalid_state_transition", version);
    if (input.kind === "request" && (!current.partner_id || Number(current.unit_price) <= 0 || Number(current.quantity) <= 0)) throw new ProcessCommandRepositoryError("order_not_ready", version);
    const updated = await client.query<DbQueryResultRow>(`
      UPDATE work_order_processes
      SET status=$4,
          completed_at=CASE WHEN $4='completed' THEN now() ELSE NULL END,
          completed_by_member_id=CASE WHEN $4='completed' THEN $5 ELSE NULL END,
          entity_version=entity_version+1,
          updated_at=now()
      WHERE company_id=$1 AND revision_id=$2::uuid AND id=$3::uuid
        AND status=$6 AND entity_version=$7
      RETURNING id
    `, [input.scope.companyId, target.revision_id, input.processId, transition.to, input.scope.companyMemberId, transition.from, current.entity_version]);
    context.statementCount += 1;
    if (!updated.rows[0]) throw new ProcessCommandRepositoryError("conflict", version);
    const nextVersion = await advanceParent(client, context, { scope: input.scope, workOrderId: input.workOrderId, revisionId: String(target.revision_id), expectedVersion: input.command.expectedVersion });
    await emitEvent(client, context, { scope: input.scope, workOrderId: input.workOrderId, commandCode: transition.commandCode, summary: transition.summary, metadata: { processId: input.processId, role: "factory", clientRequestId: input.command.clientRequestId, statusTransition: { from: transition.from, to: transition.to }, versionTransition: { from: version, to: nextVersion } } });
    await completeReceipt(client, context, { scope: input.scope, commandCode: transition.commandCode, keyHash: input.keyHash, workOrderId: input.workOrderId, revisionId: String(target.revision_id), nextVersion });
    return { workOrderId: input.workOrderId, revisionId: String(target.revision_id), processId: input.processId, nextVersion, idempotentReplay: false };
  });
  return { data, statementCount: context.statementCount, transactionCount: 1 as const, dbMs: Number((performance.now() - started).toFixed(2)) };
}
