import "server-only";

import type { DbQueryResultRow, DbTransactionClient } from "@/lib/db/client";
import { queryDb, withDbTransaction } from "@/lib/db/client";
import type {
  SignupApplicationFileRecord,
  SignupApplicationStatus,
} from "./signupApplicationTypes";
import type { SignupApplicationOwner } from "./signupApplicationRepository";
import { SIGNUP_APPLICATION_CERTIFICATE_FILE_TYPE } from "./signupApplicationFilePolicy";

type SignupApplicationFileRow = DbQueryResultRow & {
  id: string;
  application_id: string;
  file_type: "business_registration";
  original_name: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number | string;
  uploaded_at: Date | string;
  reviewed_by_system_user_id: string | null;
  reviewed_at: Date | string | null;
  approved_company_file_id: string | null;
  deleted_at: Date | string | null;
};

type SignupApplicationStatusRow = DbQueryResultRow & {
  id: string;
  status: SignupApplicationStatus;
};

type Queryable = {
  query: <TRow extends DbQueryResultRow = DbQueryResultRow>(text: string, params?: unknown[]) => Promise<{
    rows: TRow[];
    rowCount: number;
  }>;
};

const SIGNUP_APPLICATION_FILE_COLUMNS = `
  id,
  application_id,
  file_type,
  original_name,
  storage_key,
  mime_type,
  size_bytes,
  uploaded_at,
  reviewed_by_system_user_id,
  reviewed_at,
  approved_company_file_id,
  deleted_at
`;

const QUALIFIED_SIGNUP_APPLICATION_FILE_COLUMNS = `
  file.id AS id,
  file.application_id AS application_id,
  file.file_type AS file_type,
  file.original_name AS original_name,
  file.storage_key AS storage_key,
  file.mime_type AS mime_type,
  file.size_bytes AS size_bytes,
  file.uploaded_at AS uploaded_at,
  file.reviewed_by_system_user_id AS reviewed_by_system_user_id,
  file.reviewed_at AS reviewed_at,
  file.approved_company_file_id AS approved_company_file_id,
  file.deleted_at AS deleted_at
`;

function iso(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function mapFileRow(row: SignupApplicationFileRow): SignupApplicationFileRecord {
  return {
    id: row.id,
    applicationId: row.application_id,
    fileType: row.file_type,
    originalName: row.original_name,
    storageKey: row.storage_key,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    uploadedAt: iso(row.uploaded_at) ?? "",
    reviewedBySystemUserId: row.reviewed_by_system_user_id,
    reviewedAt: iso(row.reviewed_at),
    approvedCompanyFileId: row.approved_company_file_id,
    deletedAt: iso(row.deleted_at),
  };
}

function getQueryable(client?: DbTransactionClient | null): Queryable {
  return client ?? { query: queryDb };
}

export type CreateSignupApplicationCertificateMetadataInput = {
  id: string;
  applicationId: string;
  owner: SignupApplicationOwner;
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
};

export type SignupApplicationCertificateMutationResult = {
  file: SignupApplicationFileRecord;
  replacedFiles: SignupApplicationFileRecord[];
};

export type SignupApplicationCertificateRepository = {
  findActiveOwnedCertificate(input: {
    applicationId: string;
    owner: SignupApplicationOwner;
  }): Promise<SignupApplicationFileRecord | null>;
  createActiveOwnedCertificate(input: CreateSignupApplicationCertificateMetadataInput): Promise<SignupApplicationCertificateMutationResult>;
  deleteActiveOwnedCertificate(input: {
    applicationId: string;
    owner: SignupApplicationOwner;
    fileId: string;
  }): Promise<SignupApplicationFileRecord | null>;
  findCertificateForSystemViewer(input: {
    applicationId: string;
    fileId: string;
  }): Promise<SignupApplicationFileRecord | null>;
};

async function lockOwnedEditableApplication(input: {
  db: Queryable;
  applicationId: string;
  owner: SignupApplicationOwner;
}): Promise<SignupApplicationStatusRow | null> {
  const result = await input.db.query<SignupApplicationStatusRow>(
    `
      SELECT id, status
      FROM signup_applications
      WHERE id = $1
        AND google_sub = $2
        AND email_normalized = $3
        AND status IN ('draft', 'changes_requested')
      FOR UPDATE
    `,
    [input.applicationId, input.owner.googleSub, input.owner.emailNormalized],
  );
  return result.rows[0] ?? null;
}

export function createPostgresSignupApplicationCertificateRepository(
  client?: DbTransactionClient | null,
): SignupApplicationCertificateRepository {
  const db = getQueryable(client);

  return {
    async findActiveOwnedCertificate(input) {
      const result = await db.query<SignupApplicationFileRow>(
        `
          SELECT ${QUALIFIED_SIGNUP_APPLICATION_FILE_COLUMNS}
          FROM signup_application_files file
          JOIN signup_applications app ON app.id = file.application_id
          WHERE file.application_id = $1
            AND app.google_sub = $2
            AND app.email_normalized = $3
            AND file.file_type = $4
            AND file.deleted_at IS NULL
          ORDER BY file.uploaded_at DESC, file.id DESC
          LIMIT 1
        `,
        [
          input.applicationId,
          input.owner.googleSub,
          input.owner.emailNormalized,
          SIGNUP_APPLICATION_CERTIFICATE_FILE_TYPE,
        ],
      );
      return result.rows[0] ? mapFileRow(result.rows[0]) : null;
    },

    async createActiveOwnedCertificate(input) {
      return withDbTransaction(async (transactionClient) => {
        const transactionDb = getQueryable(transactionClient);
        const locked = await lockOwnedEditableApplication({
          db: transactionDb,
          applicationId: input.applicationId,
          owner: input.owner,
        });
        if (!locked) throw new Error("SIGNUP_CERTIFICATE_UPLOAD_NOT_ALLOWED");

        const replacedResult = await transactionClient.query<SignupApplicationFileRow>(
          `
            UPDATE signup_application_files
            SET deleted_at = now()
            WHERE application_id = $1
              AND file_type = $2
              AND deleted_at IS NULL
            RETURNING ${SIGNUP_APPLICATION_FILE_COLUMNS}
          `,
          [input.applicationId, SIGNUP_APPLICATION_CERTIFICATE_FILE_TYPE],
        );

        const insertResult = await transactionClient.query<SignupApplicationFileRow>(
          `
            INSERT INTO signup_application_files (
              id,
              application_id,
              file_type,
              original_name,
              storage_key,
              mime_type,
              size_bytes
            ) VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7::bigint
            )
            RETURNING ${SIGNUP_APPLICATION_FILE_COLUMNS}
          `,
          [
            input.id,
            input.applicationId,
            SIGNUP_APPLICATION_CERTIFICATE_FILE_TYPE,
            input.originalName,
            input.storageKey,
            input.mimeType,
            input.sizeBytes,
          ],
        );

        const file = insertResult.rows[0];
        if (!file) throw new Error("SIGNUP_CERTIFICATE_METADATA_SAVE_FAILED");
        return {
          file: mapFileRow(file),
          replacedFiles: replacedResult.rows.map(mapFileRow),
        };
      });
    },

    async deleteActiveOwnedCertificate(input) {
      return withDbTransaction(async (transactionClient) => {
        const transactionDb = getQueryable(transactionClient);
        const locked = await lockOwnedEditableApplication({
          db: transactionDb,
          applicationId: input.applicationId,
          owner: input.owner,
        });
        if (!locked) throw new Error("SIGNUP_CERTIFICATE_DELETE_NOT_ALLOWED");

        const result = await transactionClient.query<SignupApplicationFileRow>(
          `
            UPDATE signup_application_files
            SET deleted_at = now()
            WHERE application_id = $1
              AND id = $2
              AND file_type = $3
              AND deleted_at IS NULL
            RETURNING ${SIGNUP_APPLICATION_FILE_COLUMNS}
          `,
          [input.applicationId, input.fileId, SIGNUP_APPLICATION_CERTIFICATE_FILE_TYPE],
        );
        return result.rows[0] ? mapFileRow(result.rows[0]) : null;
      });
    },

    async findCertificateForSystemViewer(input) {
      const result = await db.query<SignupApplicationFileRow>(
        `
          SELECT ${SIGNUP_APPLICATION_FILE_COLUMNS}
          FROM signup_application_files
          WHERE application_id = $1
            AND id = $2
            AND file_type = $3
            AND deleted_at IS NULL
          LIMIT 1
        `,
        [input.applicationId, input.fileId, SIGNUP_APPLICATION_CERTIFICATE_FILE_TYPE],
      );
      return result.rows[0] ? mapFileRow(result.rows[0]) : null;
    },
  };
}
