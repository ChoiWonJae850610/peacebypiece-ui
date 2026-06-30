import { createR2WorkerSignedUrl } from "../lib/storage/r2/r2WorkerSignature.mjs";

const STORAGE_ROOT = "signup-applications";
const CERTIFICATE_DIR = "business-registration";
const FILE_COLUMNS = `
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

const QUALIFIED_FILE_COLUMNS = `
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

export class IntegrationWorkerRequestError extends Error {
  constructor(input) {
    super(input.code);
    this.name = "IntegrationWorkerRequestError";
    this.code = input.code;
    this.status = input.status;
    this.retryable = input.retryable;
    this.operation = input.operation;
    this.responseReceived = input.responseReceived;
  }
}

function iso(value) {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapFile(row) {
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

export function buildIntegrationCertificateStorageKey(input) {
  return `${STORAGE_ROOT}/${input.applicationId}/${CERTIFICATE_DIR}/${input.fileId}.${input.extension}`;
}

export function isIntegrationCertificateStorageKey(input) {
  return input.storageKey === buildIntegrationCertificateStorageKey({
    applicationId: input.applicationId,
    fileId: input.fileId,
    extension: input.storageKey.split(".").pop(),
  });
}

export function isIntegrationCertificateStorageKeyConsistentWithMime(input) {
  const extension = input.storageKey.split(".").pop();
  return (
    (extension === "png" && input.mimeType === "image/png")
    || (extension === "jpg" && input.mimeType === "image/jpeg")
    || (extension === "pdf" && input.mimeType === "application/pdf")
  );
}

export function createIntegrationCertificateRepository(client) {
  return {
    async findActiveOwnedCertificate(input) {
      const result = await client.query(
        `
          SELECT ${QUALIFIED_FILE_COLUMNS}
          FROM signup_application_files file
          JOIN signup_applications app ON app.id = file.application_id
          WHERE file.application_id = $1
            AND app.google_sub = $2
            AND app.email_normalized = $3
            AND file.file_type = 'business_registration'
            AND file.deleted_at IS NULL
          ORDER BY file.uploaded_at DESC, file.id DESC
          LIMIT 1
        `,
        [input.applicationId, input.owner.googleSub, input.owner.emailNormalized],
      );
      return result.rows[0] ? mapFile(result.rows[0]) : null;
    },

    async createActiveOwnedCertificate(input) {
      await client.query("BEGIN");
      try {
        const locked = await client.query(
          `
            SELECT id
            FROM signup_applications
            WHERE id = $1
              AND google_sub = $2
              AND email_normalized = $3
              AND status IN ('draft', 'changes_requested')
            FOR UPDATE
          `,
          [input.applicationId, input.owner.googleSub, input.owner.emailNormalized],
        );
        if (locked.rowCount !== 1) throw new Error("SIGNUP_CERTIFICATE_UPLOAD_NOT_ALLOWED");

        const replaced = await client.query(
          `
            UPDATE signup_application_files
            SET deleted_at = now()
            WHERE application_id = $1
              AND file_type = 'business_registration'
              AND deleted_at IS NULL
            RETURNING ${FILE_COLUMNS}
          `,
          [input.applicationId],
        );

        const inserted = await client.query(
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
              'business_registration',
              $3,
              $4,
              $5,
              $6
            )
            RETURNING ${FILE_COLUMNS}
          `,
          [input.id, input.applicationId, input.originalName, input.storageKey, input.mimeType, input.sizeBytes],
        );
        await client.query("COMMIT");
        return {
          file: mapFile(inserted.rows[0]),
          replacedFiles: replaced.rows.map(mapFile),
        };
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      }
    },

    async deleteActiveOwnedCertificate(input) {
      await client.query("BEGIN");
      try {
        const locked = await client.query(
          `
            SELECT id
            FROM signup_applications
            WHERE id = $1
              AND google_sub = $2
              AND email_normalized = $3
              AND status IN ('draft', 'changes_requested')
            FOR UPDATE
          `,
          [input.applicationId, input.owner.googleSub, input.owner.emailNormalized],
        );
        if (locked.rowCount !== 1) throw new Error("SIGNUP_CERTIFICATE_DELETE_NOT_ALLOWED");

        const deleted = await client.query(
          `
            UPDATE signup_application_files
            SET deleted_at = now()
            WHERE application_id = $1
              AND id = $2
              AND file_type = 'business_registration'
              AND deleted_at IS NULL
            RETURNING ${FILE_COLUMNS}
          `,
          [input.applicationId, input.fileId],
        );
        await client.query("COMMIT");
        return deleted.rows[0] ? mapFile(deleted.rows[0]) : null;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      }
    },
  };
}

function createSignedWorkerUrl(config, method, key, contentType = "application/octet-stream") {
  const expiresAt = Math.floor(Date.now() / 1000) + 300;
  return createR2WorkerSignedUrl({ uploadUrl: config.workerUrl, secret: config.workerSecret, method, key, contentType, expiresAt });
}

export async function workerRequest(config, method, key, body, contentType) {
  const url = createSignedWorkerUrl(config, method, key, contentType);
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: method === "PUT" ? { "Content-Type": contentType } : undefined,
      body,
    });
  } catch {
    throw new IntegrationWorkerRequestError({
      code: `R2_WORKER_${method}_NETWORK_ERROR`,
      status: 0,
      retryable: true,
      operation: method.toLowerCase(),
      responseReceived: false,
    });
  }
  if (!response.ok) {
    await response.text().catch(() => "");
    throw new IntegrationWorkerRequestError({
      code: `R2_WORKER_REQUEST_FAILED_${response.status}`,
      status: response.status,
      retryable: response.status === 408 || response.status === 429 || response.status >= 500,
      operation: method.toLowerCase(),
      responseReceived: true,
    });
  }
  return response;
}

export function createIntegrationWorkerStorageAdapter(config, manifest) {
  const recordWorkerFailure = (error) => {
    manifest.lastFailure = {
      stage: manifest.diagnosticContext?.stage ?? "unknown",
      operation: manifest.diagnosticContext?.operation ?? "unknown",
      code: error instanceof IntegrationWorkerRequestError ? error.code : "INTEGRATION_WORKER_UNKNOWN_ERROR",
      status: error instanceof IntegrationWorkerRequestError ? error.status : null,
      retryable: error instanceof IntegrationWorkerRequestError ? error.retryable : false,
      errorClass: error instanceof Error ? error.name : "unknown",
      hasStorageKey: Boolean(manifest.diagnosticContext?.hasStorageKey),
      keyFingerprint: manifest.diagnosticContext?.keyFingerprint ?? null,
      fixtureLabel: manifest.diagnosticContext?.fixtureLabel ?? null,
      requestMethod: manifest.diagnosticContext?.requestMethod ?? null,
      responseReceived: error instanceof IntegrationWorkerRequestError ? error.responseReceived : false,
    };
  };

  return {
    async upload(input) {
      try {
        await workerRequest(config, "PUT", input.storageKey, input.bytes, input.mimeType);
        manifest.r2Keys.push(input.storageKey);
      } catch (error) {
        recordWorkerFailure(error);
        throw error;
      }
    },
    async delete(input) {
      try {
        await workerRequest(config, "DELETE", input.storageKey);
        manifest.cleanup.r2ObjectsDeleted += 1;
      } catch (error) {
        recordWorkerFailure(error);
        throw error;
      }
    },
  };
}

export async function objectExists(config, key) {
  try {
    const response = await workerRequest(config, "GET", key);
    await response.arrayBuffer().catch(() => undefined);
    return true;
  } catch (error) {
    if (error instanceof Error && /_404$/.test(error.message)) return false;
    throw error;
  }
}

export async function deleteObjectIfPresent(config, manifest, key) {
  try {
    await workerRequest(config, "DELETE", key);
    manifest.cleanup.r2ObjectsDeleted += 1;
  } catch (error) {
    if (!(error instanceof Error) || !/_404$/.test(error.message)) throw error;
  }
}
