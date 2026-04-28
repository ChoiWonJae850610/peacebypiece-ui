import "server-only";

import { randomUUID } from "crypto";
import { queryDb, isDatabaseConfigured } from "@/lib/db/client";
import { getWorkspaceCompanyContext } from "@/lib/constants/company";
import type { DbQueryResultRow } from "@/lib/db/client";
import type {
  OutsourcingProcessRecord,
  PartnerDbRecord,
  PartnerDbType,
  PartnerItemCategory,
  PartnerItemRecord,
  PartnerItemWithRelations,
  PartnerUnitRecord,
} from "@/lib/partners/types";
import type {
  ListPartnerItemsOptions,
  ListPartnersOptions,
  PartnerRepositoryInfo,
  PartnerWritableRepository,
} from "@/lib/partners/partnerRepository";

type PartnerRow = PartnerDbRecord & DbQueryResultRow;
type UnitRow = PartnerUnitRecord & DbQueryResultRow;
type PartnerItemRow = PartnerItemWithRelations & DbQueryResultRow;
type PartnerItemBaseRow = PartnerItemRecord & DbQueryResultRow;
type OutsourcingProcessRow = OutsourcingProcessRecord & DbQueryResultRow;

const ROLE_ITEM_TYPES: PartnerDbType[] = ["factory", "fabric", "subsidiary", "outsourcing"];

function buildWhereClause(conditions: string[]) {
  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function mapDbItemTypeToCategory(value: unknown): PartnerItemCategory {
  if (value === "factory") return "labor";
  if (value === "fabric" || value === "subsidiary" || value === "outsourcing") return value;
  if (value === "labor") return "labor";
  return "outsourcing";
}

function mapCategoryToDbItemType(category: PartnerItemCategory): PartnerDbType {
  if (category === "labor") return "factory";
  return category;
}

function normalizePartnerItem(row: PartnerItemRow): PartnerItemWithRelations {
  return {
    ...row,
    category: mapDbItemTypeToCategory(row.category),
    unit_price: toNumber(row.unit_price),
  };
}

function normalizePartnerItemBase(row: PartnerItemBaseRow): PartnerItemRecord {
  return {
    ...row,
    category: mapDbItemTypeToCategory(row.category),
    unit_price: toNumber(row.unit_price),
  };
}

export function getDbPartnerRepositoryInfo(): PartnerRepositoryInfo {
  return {
    mode: "db",
    adapterConfigured: isDatabaseConfigured(),
    supportsWrite: true,
  };
}

export function createDbPartnerRepository(): PartnerWritableRepository {
  return {
    getRepositoryInfo: getDbPartnerRepositoryInfo,
    listPartners: async (options: ListPartnersOptions = {}) => {
      const params: unknown[] = [];
      const conditions: string[] = [];

      if (options.type) {
        params.push(options.type);
        conditions.push(`EXISTS (SELECT 1 FROM partner_items pi WHERE pi.partner_id = p.id AND pi.item_type = $${params.length})`);
      }
      if (options.activeOnly) {
        conditions.push("p.is_active = true");
      }

      const result = await queryDb<PartnerRow>(
        `SELECT
           p.id,
           p.company_id,
           p.company_name,
           p.name,
           COALESCE(
             MIN(pi.item_type) FILTER (WHERE pi.item_type = 'factory'),
             MIN(pi.item_type) FILTER (WHERE pi.item_type = 'fabric'),
             MIN(pi.item_type) FILTER (WHERE pi.item_type = 'subsidiary'),
             MIN(pi.item_type) FILTER (WHERE pi.item_type = 'outsourcing'),
             'factory'
           ) AS type,
           p.contact_person,
           p.contact,
           p.email,
           p.memo,
           p.is_active,
           p.created_at,
           p.updated_at
         FROM partners p
         LEFT JOIN partner_items pi ON pi.partner_id = p.id
         ${buildWhereClause(conditions)}
         GROUP BY p.id
         ORDER BY p.name ASC`,
        params,
      );

      return result.rows;
    },
    listUnits: async (activeOnly = false) => {
      const result = await queryDb<UnitRow>(
        `SELECT id, company_id, code, name, category, is_active, sort_order, created_at, updated_at
         FROM units
         WHERE (company_id = $1 OR company_id IS NULL)
         ${activeOnly ? "AND is_active = true" : ""}
         ORDER BY sort_order ASC, name ASC`,
        [getWorkspaceCompanyContext().companyId],
      );

      return result.rows;
    },
    listPartnerItems: async (options: ListPartnerItemsOptions = {}) => {
      const params: unknown[] = [];
      const conditions: string[] = [];

      if (options.partnerId) {
        params.push(options.partnerId);
        conditions.push(`pi.partner_id = $${params.length}`);
      }
      if (options.category) {
        params.push(mapCategoryToDbItemType(options.category));
        conditions.push(`pi.item_type = $${params.length}`);
      }
      if (options.activeOnly) {
        conditions.push("pi.is_active = true");
        conditions.push("p.is_active = true");
      }

      const result = await queryDb<PartnerItemRow>(
        `SELECT
           pi.id,
           pi.partner_id,
           pi.item_type AS category,
           COALESCE(op.name, pi.item_name, pi.item_type) AS name,
           NULL::text AS unit_id,
           COALESCE(pi.unit_cost, 0) AS unit_price,
           'KRW'::text AS currency,
           pi.memo,
           pi.is_active,
           pi.created_at,
           pi.updated_at,
           pi.outsourcing_process_id,
           p.name AS partner_name,
           NULL::text AS unit_name,
           pi.unit AS unit_code,
           op.name AS outsourcing_process_name
         FROM partner_items pi
         LEFT JOIN partners p ON p.id = pi.partner_id
         LEFT JOIN outsourcing_processes op ON op.id = pi.outsourcing_process_id
         ${buildWhereClause(conditions)}
         ORDER BY p.name ASC, pi.item_type ASC, COALESCE(op.sort_order, 9999), COALESCE(op.name, pi.item_name, pi.item_type) ASC`,
        params,
      );

      return result.rows.map(normalizePartnerItem);
    },
    listOutsourcingProcesses: async (activeOnly = false) => {
      const result = await queryDb<OutsourcingProcessRow>(
        `SELECT id, company_id, company_name, name, memo, sort_order, is_active, created_at, updated_at
         FROM outsourcing_processes
         ${activeOnly ? "WHERE is_active = true" : ""}
         ORDER BY sort_order ASC, name ASC`,
      );

      return result.rows;
    },
    createPartner: async (input) => {
      const id = randomUUID();
      const result = await queryDb<PartnerRow>(
        `INSERT INTO partners (id, company_id, company_name, name, contact_person, contact, email, memo, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, company_id, company_name, name, 'factory'::text AS type, contact_person, contact, email, memo, is_active, created_at, updated_at`,
        [
          id,
          input.company_id ?? getWorkspaceCompanyContext().companyId,
          input.company_name ?? getWorkspaceCompanyContext().companyName,
          input.name.trim(),
          input.contact_person ?? null,
          input.contact ?? null,
          input.email ?? null,
          input.memo ?? null,
          input.is_active ?? true,
        ],
      );

      const [created] = result.rows;
      if (!created) throw new Error("Partner creation failed");
      return created;
    },
    updatePartner: async (partnerId, input) => {
      const current = await queryDb<PartnerRow>(
        `SELECT id, company_id, company_name, name, 'factory'::text AS type, contact_person, contact, email, memo, is_active, created_at, updated_at
         FROM partners
         WHERE id = $1`,
        [partnerId],
      );
      const [target] = current.rows;
      if (!target) throw new Error("Partner not found");

      const next = {
        company_id: input.company_id === undefined ? target.company_id : input.company_id,
        company_name: input.company_name === undefined ? target.company_name ?? getWorkspaceCompanyContext().companyName : input.company_name,
        name: input.name === undefined ? target.name : input.name.trim(),
        contact_person: input.contact_person === undefined ? target.contact_person ?? null : input.contact_person,
        contact: input.contact === undefined ? target.contact : input.contact,
        email: input.email === undefined ? target.email : input.email,
        memo: input.memo === undefined ? target.memo ?? null : input.memo,
        is_active: input.is_active === undefined ? target.is_active : input.is_active,
      };

      const result = await queryDb<PartnerRow>(
        `UPDATE partners
         SET company_id = $2,
             company_name = $3,
             name = $4,
             contact_person = $5,
             contact = $6,
             email = $7,
             memo = $8,
             is_active = $9,
             updated_at = now()
         WHERE id = $1
         RETURNING id, company_id, company_name, name, 'factory'::text AS type, contact_person, contact, email, memo, is_active, created_at, updated_at`,
        [partnerId, next.company_id, next.company_name, next.name, next.contact_person, next.contact, next.email, next.memo, next.is_active],
      );

      const [updated] = result.rows;
      if (!updated) throw new Error("Partner update failed");
      return updated;
    },
    createPartnerItem: async (input) => {
      const id = randomUUID();
      const itemType = mapCategoryToDbItemType(input.category);
      const result = await queryDb<PartnerItemBaseRow>(
        `INSERT INTO partner_items (id, company_id, company_name, partner_id, item_type, item_name, outsourcing_process_id, unit, unit_cost, memo, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9, $10)
         RETURNING id, partner_id, item_type AS category, item_name AS name, NULL::text AS unit_id, COALESCE(unit_cost, 0) AS unit_price, 'KRW'::text AS currency, memo, is_active, created_at, updated_at, outsourcing_process_id`,
        [
          id,
          getWorkspaceCompanyContext().companyId,
          getWorkspaceCompanyContext().companyName,
          input.partner_id,
          itemType,
          input.name.trim(),
          input.outsourcing_process_id ?? null,
          input.unit_price ?? 0,
          input.memo ?? null,
          input.is_active ?? true,
        ],
      );

      const [created] = result.rows;
      if (!created) throw new Error("Partner item creation failed");
      return normalizePartnerItemBase(created);
    },
    replacePartnerRoleItems: async (partnerId, items) => {
      await queryDb(
        `DELETE FROM partner_items
         WHERE partner_id = $1
           AND item_type = ANY($2::text[])`,
        [partnerId, ROLE_ITEM_TYPES],
      );

      for (const item of items) {
        const itemType = mapCategoryToDbItemType(item.category);
        await queryDb(
          `INSERT INTO partner_items (id, company_id, company_name, partner_id, item_type, item_name, outsourcing_process_id, unit, unit_cost, memo, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, 0, $8, $9)`,
          [
            randomUUID(),
            getWorkspaceCompanyContext().companyId,
            getWorkspaceCompanyContext().companyName,
            partnerId,
            itemType,
            item.name.trim(),
            item.outsourcing_process_id ?? null,
            item.memo ?? null,
            item.is_active ?? true,
          ],
        );
      }
    },
    replaceOutsourcingProcesses: async (items) => {
      for (const item of items) {
        await queryDb(
          `INSERT INTO outsourcing_processes (id, company_id, company_name, name, memo, sort_order, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE
           SET company_id = EXCLUDED.company_id,
               company_name = EXCLUDED.company_name,
               name = EXCLUDED.name,
               memo = EXCLUDED.memo,
               sort_order = EXCLUDED.sort_order,
               is_active = EXCLUDED.is_active,
               updated_at = now()`,
          [item.id, item.company_id ?? getWorkspaceCompanyContext().companyId, item.company_name ?? getWorkspaceCompanyContext().companyName, item.name.trim(), item.memo ?? null, item.sort_order, item.is_active],
        );
      }

      const activeIds = items.map((item) => item.id);
      if (activeIds.length === 0) {
        await queryDb("DELETE FROM outsourcing_processes");
        return;
      }

      await queryDb("DELETE FROM outsourcing_processes WHERE id <> ALL($1::text[])", [activeIds]);
    },
  };
}
