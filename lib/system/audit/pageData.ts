import "server-only";

import {
  applySystemAuditLogFilterAction,
  buildSystemAuditLogViewModels,
} from "@/lib/system/audit/actionFlow";
import { listSystemAuditLogs } from "@/lib/system/audit/repository";
import type {
  ListSystemAuditLogsInput,
  SystemAuditLogFilter,
  SystemAuditLogRecord,
  SystemAuditLogViewModel,
} from "@/lib/system/audit/types";

export type SystemAuditLogPageListInput = {
  listInput?: ListSystemAuditLogsInput;
  filter?: SystemAuditLogFilter;
};

export type SystemAuditLogPageData = {
  records: SystemAuditLogRecord[];
  viewModels: SystemAuditLogViewModel[];
};

export async function listSystemAuditLogRecordsForPage(
  input: SystemAuditLogPageListInput = {},
): Promise<SystemAuditLogRecord[]> {
  const records = await listSystemAuditLogs(input.listInput || {});
  return applySystemAuditLogFilterAction({
    records,
    filter: input.filter,
  });
}

export async function getSystemAuditLogPageData(
  input: SystemAuditLogPageListInput = {},
): Promise<SystemAuditLogPageData> {
  const records = await listSystemAuditLogRecordsForPage(input);

  return {
    records,
    viewModels: buildSystemAuditLogViewModels(records),
  };
}
