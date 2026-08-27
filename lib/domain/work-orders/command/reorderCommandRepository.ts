import "server-only";

import { performance } from "perf_hooks";

import type {
  CreateWorkOrderReorderCommand,
  CreateWorkOrderReorderResult,
  EntityVersion,
  TenantMemberScope,
  WorkOrderId,
  WorkOrderRevisionId,
} from "@/lib/domain/work-orders/contracts";
import { withWaflV2TenantReadOnlyTransaction, withWaflV2TenantWriteTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import { canCreateWorkOrderReorder } from "@/lib/domain/work-orders/contracts/lineage";
import { serializePostgresDateOnly } from "@/lib/domain/work-orders/dateOnly.mjs";

export const WORK_ORDER_REORDER_CREATE_COMMAND_CODE = "work_order.create_reorder";

export type ReorderCopiedImagePlan = {
  readonly sourceImageId: string;
  readonly targetImageId: string;
  readonly storageObjectKey: string;
  readonly thumbnailObjectKey: string | null;
  readonly isRepresentative: boolean;
};

export type ReorderCopiedAttachmentPlan = {
  readonly sourceAttachmentId: string;
  readonly targetAttachmentId: string;
  readonly storageObjectKey: string;
  readonly outputInclude: boolean;
};

export type ReorderAssetCopyPlan = {
  readonly image: ReorderCopiedImagePlan | null;
  readonly images: readonly ReorderCopiedImagePlan[];
  readonly attachments: readonly ReorderCopiedAttachmentPlan[];
};

type FailureReason = "not_found" | "ineligible" | "idempotency_conflict" | "idempotency_incomplete";

export class ReorderCommandRepositoryError extends Error {
  readonly reason: FailureReason;
  constructor(reason: FailureReason) {
    super(reason);
    this.name = "ReorderCommandRepositoryError";
    this.reason = reason;
  }
}

type ReorderResultRow = DbQueryResultRow & {
  readonly work_order_id: string;
  readonly revision_id: string;
  readonly revision_no: number | string;
  readonly product_name: string;
  readonly product_type_code: string | null;
  readonly season_code: string | null;
  readonly item_code: string | null;
  readonly due_date: string | null;
  readonly total_quantity: number | string;
  readonly memo: string | null;
  readonly factory_delivery_memo: string | null;
  readonly source_work_order_id: string;
  readonly source_revision_id: string;
  readonly series_root_work_order_id: string;
  readonly reorder_round: number | string;
};

type ReceiptRow = DbQueryResultRow & {
  readonly request_sha256: string;
  readonly work_order_id: string | null;
  readonly result_revision_id: string | null;
  readonly result_entity_version: number | string | null;
};

type SourceRow = DbQueryResultRow & {
  readonly work_order_id: string;
  readonly revision_id: string;
  readonly status: string;
  readonly revision_status: string;
  readonly is_sample: boolean;
  readonly derivation_kind: "original" | "reorder" | "rework";
  readonly reorder_round: number | string;
  readonly series_root_work_order_id: string | null;
};

export type ReorderCommandRepositoryResult = {
  readonly result: CreateWorkOrderReorderResult;
  readonly nextVersion: EntityVersion;
  readonly idempotentReplay: boolean;
  readonly statementCount: number;
  readonly transactionCount: 1;
  readonly dbMs: number;
};

function integer(value: number | string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error("REORDER_INVALID_INTEGER");
  return parsed;
}

function mapResult(row: ReorderResultRow): CreateWorkOrderReorderResult {
  return {
    workOrderId: row.work_order_id as WorkOrderId,
    revisionId: row.revision_id as WorkOrderRevisionId,
    revisionNumber: integer(row.revision_no) as CreateWorkOrderReorderResult["revisionNumber"],
    status: "draft",
    revisionStatus: "draft",
    displayDocumentNumber: null,
    productName: row.product_name,
    productTypeCode: row.product_type_code,
    seasonCode: row.season_code,
    itemCode: row.item_code,
    dueDate: serializePostgresDateOnly(row.due_date, "REORDER_INVALID_DUE_DATE"),
    totalQuantity: integer(row.total_quantity),
    memo: row.memo,
    factoryDeliveryMemo: row.factory_delivery_memo,
    isSample: false,
    derivationKind: "reorder",
    sourceWorkOrderId: row.source_work_order_id as WorkOrderId,
    sourceRevisionId: row.source_revision_id as WorkOrderRevisionId,
    seriesRootWorkOrderId: row.series_root_work_order_id as WorkOrderId,
    reorderRound: integer(row.reorder_round),
  };
}

const RESULT_SQL = `
  SELECT w.id AS work_order_id, r.id AS revision_id, r.revision_no,
         w.product_name, w.product_type_code, w.season_code, w.item_code,
         w.due_date::text AS due_date, w.total_quantity, r.memo, r.factory_delivery_memo,
         w.source_work_order_id, w.source_revision_id, w.series_root_work_order_id, w.reorder_round
  FROM work_orders w
  JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
  WHERE w.company_id=$1 AND w.id=$2::uuid AND r.id=$3::uuid
`;

export async function readCompletedWorkOrderReorderReplay(input: {
  readonly scope: TenantMemberScope;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
}): Promise<CreateWorkOrderReorderResult | null> {
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const receipt = await client.query<ReceiptRow>(`
      SELECT request_sha256,work_order_id,result_revision_id,result_entity_version
      FROM work_order_command_receipts
      WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
    `, [input.scope.companyId, WORK_ORDER_REORDER_CREATE_COMMAND_CODE, input.scopedIdempotencyKeyHash]);
    const row = receipt.rows[0];
    if (!row) return null;
    if (row.request_sha256 !== input.requestHash) throw new ReorderCommandRepositoryError("idempotency_conflict");
    if (!row.work_order_id || !row.result_revision_id || row.result_entity_version === null) {
      throw new ReorderCommandRepositoryError("idempotency_incomplete");
    }
    const result = await client.query<ReorderResultRow>(RESULT_SQL, [input.scope.companyId, row.work_order_id, row.result_revision_id]);
    if (!result.rows[0]) throw new ReorderCommandRepositoryError("idempotency_incomplete");
    return mapResult(result.rows[0]);
  });
}

export async function createWorkOrderReorderV2(input: {
  readonly scope: TenantMemberScope;
  readonly sourceWorkOrderId: WorkOrderId;
  readonly command: CreateWorkOrderReorderCommand;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
  readonly targetWorkOrderId: WorkOrderId;
  readonly targetRevisionId: WorkOrderRevisionId;
  readonly targetSizeSpecId: string;
  readonly assets: ReorderAssetCopyPlan;
}): Promise<ReorderCommandRepositoryResult> {
  const startedAt = performance.now();
  let statementCount = 0;
  const value = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    statementCount += 1;

    const reserved = await client.query<ReceiptRow>(`
      INSERT INTO work_order_command_receipts(company_id,command_code,idempotency_key,request_sha256,correlation_id)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(company_id,command_code,idempotency_key) DO NOTHING
      RETURNING request_sha256,work_order_id,result_revision_id,result_entity_version
    `, [input.scope.companyId, WORK_ORDER_REORDER_CREATE_COMMAND_CODE, input.scopedIdempotencyKeyHash, input.requestHash, input.scope.correlationId]);
    statementCount += 1;
    if (reserved.rowCount === 0) {
      const receipt = await client.query<ReceiptRow>(`
        SELECT request_sha256,work_order_id,result_revision_id,result_entity_version
        FROM work_order_command_receipts
        WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
      `, [input.scope.companyId, WORK_ORDER_REORDER_CREATE_COMMAND_CODE, input.scopedIdempotencyKeyHash]);
      statementCount += 1;
      const replay = receipt.rows[0];
      if (!replay) throw new ReorderCommandRepositoryError("idempotency_incomplete");
      if (replay.request_sha256 !== input.requestHash) throw new ReorderCommandRepositoryError("idempotency_conflict");
      if (!replay.work_order_id || !replay.result_revision_id || replay.result_entity_version === null) {
        throw new ReorderCommandRepositoryError("idempotency_incomplete");
      }
      const result = await client.query<ReorderResultRow>(RESULT_SQL, [input.scope.companyId, replay.work_order_id, replay.result_revision_id]);
      statementCount += 1;
      if (!result.rows[0]) throw new ReorderCommandRepositoryError("idempotency_incomplete");
      return { row: result.rows[0], replay: true };
    }

    const sourceResult = await client.query<SourceRow>(`
      SELECT w.id AS work_order_id,w.current_revision_id AS revision_id,w.status,r.revision_status,
             w.is_sample,w.derivation_kind,w.reorder_round,w.series_root_work_order_id
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.id=$2::uuid AND w.deleted_at IS NULL
      FOR UPDATE OF w
    `, [input.scope.companyId, input.sourceWorkOrderId]);
    statementCount += 1;
    const source = sourceResult.rows[0];
    if (!source) throw new ReorderCommandRepositoryError("not_found");
    if (!canCreateWorkOrderReorder({
      isSample: source.is_sample,
      derivationKind: source.derivation_kind,
      reorderRound: integer(source.reorder_round),
      status: source.status,
      revisionStatus: source.revision_status,
    })) throw new ReorderCommandRepositoryError("ineligible");

    const rootId = source.derivation_kind === "original" ? source.work_order_id : source.series_root_work_order_id;
    if (!rootId) throw new ReorderCommandRepositoryError("ineligible");
    const rootLock = await client.query(`
      SELECT id FROM work_orders
      WHERE company_id=$1 AND id=$2::uuid AND derivation_kind='original' AND is_sample=false AND deleted_at IS NULL
      FOR UPDATE
    `, [input.scope.companyId, rootId]);
    statementCount += 1;
    if (!rootLock.rows[0]) throw new ReorderCommandRepositoryError("ineligible");

    const roundResult = await client.query<DbQueryResultRow & { readonly next_round: number | string }>(`
      SELECT COALESCE(max(used_round),0)+1 AS next_round
      FROM (
        SELECT reorder_round AS used_round FROM work_orders
        WHERE company_id=$1 AND series_root_work_order_id=$2::uuid AND derivation_kind='reorder'
        UNION ALL
        SELECT (metadata->>'reorderRound')::integer AS used_round FROM domain_events
        WHERE company_id=$1 AND command_code='work_order.reorder_deleted'
          AND metadata->>'seriesRootWorkOrderId'=$2::text
      ) used_rounds
    `, [input.scope.companyId, rootId]);
    statementCount += 1;
    const reorderRound = integer(roundResult.rows[0]?.next_round ?? 1);

    await client.query(`
      INSERT INTO work_orders(
        id,company_id,product_name,product_type_code,season_code,item_code,status,due_date,total_quantity,
        created_by_member_id,entity_version,is_sample,derivation_kind,source_work_order_id,source_revision_id,
        series_root_work_order_id,reorder_round
      )
      SELECT $3::uuid,$1,r.product_name_snapshot,r.product_type_code_snapshot,r.season_code_snapshot,
             r.item_code_snapshot,'draft',$4::date,$5,$6,1,false,'reorder',$2::uuid,r.id,$7::uuid,$8
      FROM work_order_revisions r
      WHERE r.company_id=$1 AND r.id=$9::uuid AND r.revision_status='finalized'
    `, [input.scope.companyId, source.work_order_id, input.targetWorkOrderId, input.command.dueDate ?? null,
      input.command.totalQuantity, input.scope.companyMemberId, rootId, reorderRound, source.revision_id]);
    statementCount += 1;

    await client.query(`
      INSERT INTO work_order_revisions(
        id,company_id,work_order_id,revision_no,revision_status,source_revision_id,
        company_code_snapshot,season_code_snapshot,item_code_snapshot,product_name_snapshot,
        product_type_code_snapshot,due_date_snapshot,total_quantity_snapshot,unit_price,
        memo,factory_delivery_memo,author_member_id,entity_version
      )
      SELECT $3::uuid,$1,$2::uuid,0,'draft',NULL,company_code_snapshot,season_code_snapshot,
             item_code_snapshot,product_name_snapshot,product_type_code_snapshot,$4::date,$5,unit_price,
             memo,factory_delivery_memo,$6,1
      FROM work_order_revisions
      WHERE company_id=$1 AND id=$7::uuid AND revision_status='finalized'
    `, [input.scope.companyId, input.targetWorkOrderId, input.targetRevisionId, input.command.dueDate ?? null,
      input.command.totalQuantity, input.scope.companyMemberId, source.revision_id]);
    statementCount += 1;

    await client.query(`
      INSERT INTO work_order_colors(id,company_id,revision_id,color_code,display_name,hex_value,display_order)
      SELECT gen_random_uuid(),$1,$2::uuid,color_code,display_name,hex_value,display_order
      FROM work_order_colors WHERE company_id=$1 AND revision_id=$3::uuid ORDER BY display_order,id
    `, [input.scope.companyId, input.targetRevisionId, source.revision_id]);
    statementCount += 1;
    await client.query(`
      INSERT INTO work_order_sizes(id,company_id,revision_id,size_code,display_label,display_order)
      SELECT gen_random_uuid(),$1,$2::uuid,size_code,display_label,display_order
      FROM work_order_sizes WHERE company_id=$1 AND revision_id=$3::uuid ORDER BY display_order,id
    `, [input.scope.companyId, input.targetRevisionId, source.revision_id]);
    statementCount += 1;
    await client.query(`
      INSERT INTO color_size_quantities(company_id,revision_id,color_id,size_id,quantity)
      SELECT $1,$2::uuid,c.id,s.id,0 FROM work_order_colors c CROSS JOIN work_order_sizes s
      WHERE c.company_id=$1 AND c.revision_id=$2::uuid AND s.company_id=$1 AND s.revision_id=$2::uuid
    `, [input.scope.companyId, input.targetRevisionId]);
    statementCount += 1;

    const sourceSpec = await client.query<DbQueryResultRow & { readonly id: string }>(`
      SELECT id FROM work_order_size_specs WHERE company_id=$1 AND revision_id=$2::uuid
    `, [input.scope.companyId, source.revision_id]);
    statementCount += 1;
    if (sourceSpec.rows[0]) {
      await client.query(`
        INSERT INTO work_order_size_specs(id,company_id,revision_id,gender_code,category_code,measurement_unit,source_template_id,source_template_version)
        SELECT $3::uuid,$1,$2::uuid,gender_code,category_code,measurement_unit,source_template_id,source_template_version
        FROM work_order_size_specs WHERE company_id=$1 AND id=$4::uuid
      `, [input.scope.companyId, input.targetRevisionId, input.targetSizeSpecId, sourceSpec.rows[0].id]);
      statementCount += 1;
      await client.query(`
        INSERT INTO work_order_size_spec_sizes(id,company_id,revision_id,size_spec_id,size_code,display_label,display_order)
        SELECT gen_random_uuid(),$1,$2::uuid,$3::uuid,size_code,display_label,display_order
        FROM work_order_size_spec_sizes WHERE company_id=$1 AND size_spec_id=$4::uuid
      `, [input.scope.companyId, input.targetRevisionId, input.targetSizeSpecId, sourceSpec.rows[0].id]);
      statementCount += 1;
      await client.query(`
        INSERT INTO work_order_size_spec_poms(id,company_id,revision_id,size_spec_id,pom_code,display_name,measurement_type,instruction,display_order)
        SELECT gen_random_uuid(),$1,$2::uuid,$3::uuid,pom_code,display_name,measurement_type,instruction,display_order
        FROM work_order_size_spec_poms WHERE company_id=$1 AND size_spec_id=$4::uuid
      `, [input.scope.companyId, input.targetRevisionId, input.targetSizeSpecId, sourceSpec.rows[0].id]);
      statementCount += 1;
      await client.query(`
        INSERT INTO work_order_size_spec_values(company_id,revision_id,size_spec_id,size_row_id,pom_column_id,decimal_value,display_fraction)
        SELECT $1,$2::uuid,$3::uuid,target_size.id,target_pom.id,value.decimal_value,value.display_fraction
        FROM work_order_size_spec_values value
        JOIN work_order_size_spec_sizes source_size ON source_size.id=value.size_row_id
        JOIN work_order_size_spec_poms source_pom ON source_pom.id=value.pom_column_id
        JOIN work_order_size_spec_sizes target_size ON target_size.company_id=$1 AND target_size.size_spec_id=$3::uuid AND target_size.size_code=source_size.size_code
        JOIN work_order_size_spec_poms target_pom ON target_pom.company_id=$1 AND target_pom.size_spec_id=$3::uuid AND target_pom.pom_code=source_pom.pom_code
        WHERE value.company_id=$1 AND value.size_spec_id=$4::uuid
      `, [input.scope.companyId, input.targetRevisionId, input.targetSizeSpecId, sourceSpec.rows[0].id]);
      statementCount += 1;
    }

    await client.query(`
      INSERT INTO work_order_material_lines(
        id,company_id,revision_id,material_id,material_type,name,color_option,supplier_partner_id,
        required_quantity,allowance_quantity,inventory_usage_quantity,order_quantity,unit_code,unit_price,
        amount,overage_disposition,status,memo,display_order,image_id,entity_version,usage_area,supplier_name_snapshot
      )
      SELECT gen_random_uuid(),$1,$2::uuid,material_id,material_type,name,color_option,supplier_partner_id,
             required_quantity,allowance_quantity,0,required_quantity+allowance_quantity,unit_code,unit_price,
             round((required_quantity+allowance_quantity)*unit_price,2),overage_disposition,'editing',memo,
             display_order,NULL,1,usage_area,supplier_name_snapshot
      FROM work_order_material_lines
      WHERE company_id=$1 AND revision_id=$3::uuid AND archived_at IS NULL
      ORDER BY material_type,display_order,id
    `, [input.scope.companyId, input.targetRevisionId, source.revision_id]);
    statementCount += 1;

    await client.query(`
      INSERT INTO work_order_processes(
        id,company_id,revision_id,process_type_code,process_name_snapshot,partner_id,partner_name_snapshot,
        quantity,due_date,unit_code,unit_price,amount,memo,status,display_order,entity_version,
        application_area,application_color_target
      )
      SELECT gen_random_uuid(),$1,$2::uuid,process_type_code,process_name_snapshot,partner_id,partner_name_snapshot,
             $4::numeric,NULL,unit_code,unit_price,round($4::numeric*unit_price,2),memo,'ready',display_order,1,
             application_area,application_color_target
      FROM work_order_processes WHERE company_id=$1 AND revision_id=$3::uuid ORDER BY display_order,id
    `, [input.scope.companyId, input.targetRevisionId, source.revision_id, input.command.totalQuantity]);
    statementCount += 1;

    if (input.assets.image) {
      const image = input.assets.image;
      await client.query(`
        INSERT INTO work_order_images(
          id,company_id,work_order_id,storage_object_key,thumbnail_object_key,original_filename,mime_type,
          size_bytes,content_sha256,title,display_order,is_current_representative,created_by_member_id
        )
        SELECT $4::uuid,$1,$2::uuid,$5,$6,original_filename,mime_type,size_bytes,content_sha256,title,
               display_order,true,$7
        FROM work_order_images WHERE company_id=$1 AND work_order_id=$3::uuid AND id=$8::uuid AND deleted_at IS NULL
      `, [input.scope.companyId, input.targetWorkOrderId, source.work_order_id, image.targetImageId,
        image.storageObjectKey, image.thumbnailObjectKey, input.scope.companyMemberId, image.sourceImageId]);
      statementCount += 1;
      await client.query(`
        INSERT INTO work_order_revision_images(company_id,revision_id,image_id,display_order,is_representative,filename_snapshot,mime_type_snapshot,storage_object_key_snapshot)
        SELECT $1,$2::uuid,$3::uuid,display_order,true,filename_snapshot,mime_type_snapshot,$4
        FROM work_order_revision_images WHERE company_id=$1 AND revision_id=$5::uuid AND image_id=$6::uuid AND is_representative=true
      `, [input.scope.companyId, input.targetRevisionId, image.targetImageId, image.storageObjectKey, source.revision_id, image.sourceImageId]);
      statementCount += 1;
    }

    for (const attachment of input.assets.attachments) {
      await client.query(`
        INSERT INTO work_order_attachments(
          id,company_id,work_order_id,attachment_kind,storage_object_key,original_filename,mime_type,
          size_bytes,content_sha256,output_include_default,created_by_member_id
        )
        SELECT $4::uuid,$1,$2::uuid,attachment_kind,$5,original_filename,mime_type,size_bytes,content_sha256,$8,$6
        FROM work_order_attachments WHERE company_id=$1 AND work_order_id=$3::uuid AND id=$7::uuid AND deleted_at IS NULL
      `, [input.scope.companyId, input.targetWorkOrderId, source.work_order_id, attachment.targetAttachmentId,
        attachment.storageObjectKey, input.scope.companyMemberId, attachment.sourceAttachmentId, attachment.outputInclude]);
      statementCount += 1;
      await client.query(`
        INSERT INTO work_order_revision_attachments(company_id,revision_id,attachment_id,display_order,output_include,filename_snapshot,mime_type_snapshot,storage_object_key_snapshot)
        SELECT $1,$2::uuid,$3::uuid,display_order,$7,filename_snapshot,mime_type_snapshot,$4
        FROM work_order_revision_attachments
        WHERE company_id=$1 AND revision_id=$5::uuid AND attachment_id=$6::uuid
      `, [input.scope.companyId, input.targetRevisionId, attachment.targetAttachmentId, attachment.storageObjectKey,
        source.revision_id, attachment.sourceAttachmentId, attachment.outputInclude]);
      statementCount += 1;
    }

    await client.query(`
      UPDATE work_order_revisions r SET
        fabric_total=(SELECT COALESCE(sum(amount) FILTER(WHERE material_type='fabric'),0)::numeric(14,2) FROM work_order_material_lines WHERE company_id=$1 AND revision_id=$2::uuid),
        accessory_total=(SELECT COALESCE(sum(amount) FILTER(WHERE material_type='accessory'),0)::numeric(14,2) FROM work_order_material_lines WHERE company_id=$1 AND revision_id=$2::uuid),
        process_total=(SELECT COALESCE(sum(amount),0)::numeric(14,2) FROM work_order_processes WHERE company_id=$1 AND revision_id=$2::uuid),
        estimated_total=(SELECT COALESCE(sum(amount),0)::numeric(14,2) FROM work_order_material_lines WHERE company_id=$1 AND revision_id=$2::uuid)
          +(SELECT COALESCE(sum(amount),0)::numeric(14,2) FROM work_order_processes WHERE company_id=$1 AND revision_id=$2::uuid),
        updated_at=now()
      WHERE r.company_id=$1 AND r.id=$2::uuid
    `, [input.scope.companyId, input.targetRevisionId]);
    statementCount += 1;
    await client.query(`
      UPDATE work_orders SET current_revision_id=$3::uuid,representative_image_id=$4::uuid,updated_at=now()
      WHERE company_id=$1 AND id=$2::uuid AND current_revision_id IS NULL
    `, [input.scope.companyId, input.targetWorkOrderId, input.targetRevisionId, input.assets.image?.targetImageId ?? null]);
    statementCount += 1;
    await client.query(`
      INSERT INTO domain_events(company_id,entity_type,entity_id,command_code,actor_member_id,correlation_id,change_summary,metadata,schema_version)
      VALUES($1,'work_order',$2,$3,$4,$5,'N차 리오더 초안 생성',$6::jsonb,1)
    `, [input.scope.companyId, input.targetWorkOrderId, WORK_ORDER_REORDER_CREATE_COMMAND_CODE,
      input.scope.companyMemberId, input.scope.correlationId, JSON.stringify({
        clientRequestId: input.command.clientRequestId,
        sourceWorkOrderId: source.work_order_id,
        sourceRevisionId: source.revision_id,
        seriesRootWorkOrderId: rootId,
        reorderRound,
        lifecycleReset: true,
      })]);
    statementCount += 1;
    await client.query(`
      UPDATE work_order_command_receipts
      SET work_order_id=$4::uuid,result_revision_id=$5::uuid,result_entity_version=1
      WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
    `, [input.scope.companyId, WORK_ORDER_REORDER_CREATE_COMMAND_CODE, input.scopedIdempotencyKeyHash,
      input.targetWorkOrderId, input.targetRevisionId]);
    statementCount += 1;
    const result = await client.query<ReorderResultRow>(RESULT_SQL, [input.scope.companyId, input.targetWorkOrderId, input.targetRevisionId]);
    statementCount += 1;
    if (!result.rows[0]) throw new Error("REORDER_CREATE_RESULT_MISSING");
    return { row: result.rows[0], replay: false };
  });

  return {
    result: mapResult(value.row),
    nextVersion: 1 as EntityVersion,
    idempotentReplay: value.replay,
    statementCount,
    transactionCount: 1,
    dbMs: Number((performance.now() - startedAt).toFixed(2)),
  };
}
