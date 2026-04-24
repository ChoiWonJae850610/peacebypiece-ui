import "server-only";

import { queryDb, isDatabaseConfigured } from "@/lib/db/client";
import type { DbQueryResultRow } from "@/lib/db/client";
import type {
  PartnerDbRecord,
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

function buildWhereClause(conditions: string[]) {
  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function normalizePartnerItem(row: PartnerItemRow): PartnerItemWithRelations {
  return {
    ...row,
    unit_price: toNumber(row.unit_price),
  };
}

function normalizePartnerItemBase(row: PartnerItemBaseRow): PartnerItemRecord {
  return {
    ...row,
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
        conditions.push(`type = $${params.length}`);
      }
      if (options.activeOnly) {
        conditions.push("is_active = true");
      }

      const result = await queryDb<PartnerRow>(
        `SELECT id, company_id, name, type, contact, email, is_active, created_at, updated_at
         FROM partners
         ${buildWhereClause(conditions)}
         ORDER BY name ASC`,
        params,
      );

      return result.rows;
    },
    listUnits: async (activeOnly = false) => {
      const result = await queryDb<UnitRow>(
        `SELECT id, code, name, category, is_active, sort_order, created_at, updated_at
         FROM units
         ${activeOnly ? "WHERE is_active = true" : ""}
         ORDER BY sort_order ASC, name ASC`,
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
        params.push(options.category);
        conditions.push(`pi.category = $${params.length}`);
      }
      if (options.activeOnly) {
        conditions.push("pi.is_active = true");
      }

      const result = await queryDb<PartnerItemRow>(
        `SELECT
           pi.id,
           pi.partner_id,
           pi.category,
           pi.name,
           pi.unit_id,
           pi.unit_price,
           pi.currency,
           pi.memo,
           pi.is_active,
           pi.created_at,
           pi.updated_at,
           p.name AS partner_name,
           u.name AS unit_name,
           u.code AS unit_code
         FROM partner_items pi
         LEFT JOIN partners p ON p.id = pi.partner_id
         LEFT JOIN units u ON u.id = pi.unit_id
         ${buildWhereClause(conditions)}
         ORDER BY p.name ASC, pi.category ASC, pi.name ASC`,
        params,
      );

      return result.rows.map(normalizePartnerItem);
    },
    createPartner: async (input) => {
      const result = await queryDb<PartnerRow>(
        `INSERT INTO partners (company_id, name, type, contact, email, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, company_id, name, type, contact, email, is_active, created_at, updated_at`,
        [input.company_id ?? null, input.name.trim(), input.type, input.contact ?? null, input.email ?? null, input.is_active ?? true],
      );

      const [created] = result.rows;
      if (!created) throw new Error("Partner creation failed");
      return created;
    },
    updatePartner: async (partnerId, input) => {
      const current = await queryDb<PartnerRow>(
        `SELECT id, company_id, name, type, contact, email, is_active, created_at, updated_at
         FROM partners
         WHERE id = $1`,
        [partnerId],
      );
      const [target] = current.rows;
      if (!target) throw new Error("Partner not found");

      const next = {
        company_id: input.company_id === undefined ? target.company_id : input.company_id,
        name: input.name === undefined ? target.name : input.name.trim(),
        type: input.type === undefined ? target.type : input.type,
        contact: input.contact === undefined ? target.contact : input.contact,
        email: input.email === undefined ? target.email : input.email,
        is_active: input.is_active === undefined ? target.is_active : input.is_active,
      };

      const result = await queryDb<PartnerRow>(
        `UPDATE partners
         SET company_id = $2,
             name = $3,
             type = $4,
             contact = $5,
             email = $6,
             is_active = $7
         WHERE id = $1
         RETURNING id, company_id, name, type, contact, email, is_active, created_at, updated_at`,
        [partnerId, next.company_id, next.name, next.type, next.contact, next.email, next.is_active],
      );

      const [updated] = result.rows;
      if (!updated) throw new Error("Partner update failed");
      return updated;
    },
    createPartnerItem: async (input) => {
      const result = await queryDb<PartnerItemBaseRow>(
        `INSERT INTO partner_items (partner_id, category, name, unit_id, unit_price, currency, memo, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, partner_id, category, name, unit_id, unit_price, currency, memo, is_active, created_at, updated_at`,
        [
          input.partner_id,
          input.category,
          input.name.trim(),
          input.unit_id ?? null,
          input.unit_price ?? 0,
          input.currency ?? "KRW",
          input.memo ?? null,
          input.is_active ?? true,
        ],
      );

      const [created] = result.rows;
      if (!created) throw new Error("Partner item creation failed");
      return normalizePartnerItemBase(created);
    },
  };
}
