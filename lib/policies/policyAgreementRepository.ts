import "server-only";

import { randomUUID } from "crypto";

import { queryDb } from "@/lib/db/client";
import { CUSTOMER_POLICY_DOCUMENTS, type CustomerPolicyDocument } from "@/lib/policies/customerPolicyDocuments";

export type PolicyAgreementDocument = {
  documentKey: string;
  title: string;
  category: string;
  versionId: string;
  versionLabel: string;
  requiredForApproval: boolean;
  requiresReagreement: boolean;
  agreedAt: string | null;
};

export type PolicyAgreementStatus = {
  documents: PolicyAgreementDocument[];
  requiredCount: number;
  agreedRequiredCount: number;
  allRequiredAgreed: boolean;
};

type CurrentPolicyVersionRow = {
  document_key: string;
  title: string;
  category: string;
  version_id: string;
  version_label: string;
  is_required_for_approval: boolean;
  requires_reagreement: boolean;
  agreed_at: Date | string | null;
};

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeEffectiveDateLabel(document: CustomerPolicyDocument): string {
  const label = document.effectiveDateLabel.trim();
  return label.length > 0 ? label : "시행 준비 중";
}

async function upsertPolicyDocument(document: CustomerPolicyDocument): Promise<string> {
  const result = await queryDb<{ id: string }>(
    `INSERT INTO policy_documents (
       id,
       document_key,
       title,
       category,
       is_customer_visible,
       created_at,
       updated_at
     ) VALUES ($1, $2, $3, $4, true, now(), now())
     ON CONFLICT (document_key) DO UPDATE SET
       title = EXCLUDED.title,
       category = EXCLUDED.category,
       is_customer_visible = EXCLUDED.is_customer_visible,
       updated_at = now()
     RETURNING id`,
    [randomUUID(), document.id, document.title, document.category],
  );

  const row = result.rows[0];
  if (!row) throw new Error("POLICY_DOCUMENT_UPSERT_FAILED");
  return row.id;
}

async function upsertPolicyVersion(document: CustomerPolicyDocument, policyDocumentId: string): Promise<void> {
  await queryDb(
    `INSERT INTO policy_versions (
       id,
       policy_document_id,
       version_label,
       effective_date_label,
       is_current,
       is_required_for_approval,
       requires_reagreement,
       content_snapshot,
       published_at,
       created_at,
       updated_at
     ) VALUES ($1, $2, $3, $4, true, $5, false, $6::jsonb, NULL, now(), now())
     ON CONFLICT (policy_document_id, version_label) DO UPDATE SET
       effective_date_label = EXCLUDED.effective_date_label,
       is_current = EXCLUDED.is_current,
       is_required_for_approval = EXCLUDED.is_required_for_approval,
       content_snapshot = EXCLUDED.content_snapshot,
       updated_at = now()`,
    [
      randomUUID(),
      policyDocumentId,
      document.versionLabel,
      normalizeEffectiveDateLabel(document),
      document.requiredForApproval,
      JSON.stringify(document),
    ],
  );
}

export async function syncCustomerPolicyDocumentsFromCode(): Promise<void> {
  for (const document of CUSTOMER_POLICY_DOCUMENTS) {
    const policyDocumentId = await upsertPolicyDocument(document);
    await upsertPolicyVersion(document, policyDocumentId);
  }
}

export async function listCurrentPolicyAgreementStatus(input: {
  companyId: string;
  userId: string;
}): Promise<PolicyAgreementStatus> {
  await syncCustomerPolicyDocumentsFromCode();

  const result = await queryDb<CurrentPolicyVersionRow>(
    `SELECT
       document.document_key,
       document.title,
       document.category,
       version.id AS version_id,
       version.version_label,
       version.is_required_for_approval,
       version.requires_reagreement,
       agreement.agreed_at
     FROM policy_documents document
     INNER JOIN policy_versions version
       ON version.policy_document_id = document.id
      AND version.is_current = true
     LEFT JOIN policy_agreements agreement
       ON agreement.policy_version_id = version.id
      AND agreement.company_id = $1
      AND agreement.user_id = $2
     WHERE document.is_customer_visible = true
     ORDER BY document.created_at ASC, document.document_key ASC`,
    [input.companyId, input.userId],
  );

  const documents = result.rows.map((row) => ({
    documentKey: row.document_key,
    title: row.title,
    category: row.category,
    versionId: row.version_id,
    versionLabel: row.version_label,
    requiredForApproval: row.is_required_for_approval,
    requiresReagreement: row.requires_reagreement,
    agreedAt: row.agreed_at ? toIsoString(row.agreed_at) : null,
  }));
  const requiredCount = documents.filter((document) => document.requiredForApproval).length;
  const agreedRequiredCount = documents.filter((document) => document.requiredForApproval && document.agreedAt).length;

  return {
    documents,
    requiredCount,
    agreedRequiredCount,
    allRequiredAgreed: requiredCount > 0 && agreedRequiredCount === requiredCount,
  };
}

export async function agreeToCurrentRequiredPolicies(input: {
  companyId: string;
  userId: string;
  agreementSource: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<PolicyAgreementStatus> {
  await syncCustomerPolicyDocumentsFromCode();

  await queryDb(
    `INSERT INTO policy_agreements (
       id,
       policy_version_id,
       company_id,
       user_id,
       agreement_scope,
       agreement_source,
       ip_address,
       user_agent,
       agreed_at,
       created_at
     )
     SELECT
       gen_random_uuid()::text,
       version.id,
       $1,
       $2,
       'user',
       $3,
       $4,
       $5,
       now(),
       now()
     FROM policy_documents document
     INNER JOIN policy_versions version
       ON version.policy_document_id = document.id
      AND version.is_current = true
     WHERE document.is_customer_visible = true
       AND version.is_required_for_approval = true
     ON CONFLICT (policy_version_id, user_id) DO UPDATE SET
       agreement_source = EXCLUDED.agreement_source,
       ip_address = EXCLUDED.ip_address,
       user_agent = EXCLUDED.user_agent,
       agreed_at = EXCLUDED.agreed_at`,
    [input.companyId, input.userId, input.agreementSource, input.ipAddress ?? null, input.userAgent ?? null],
  );

  return listCurrentPolicyAgreementStatus({ companyId: input.companyId, userId: input.userId });
}
