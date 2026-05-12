import { DEFAULT_PLAN_DEFINITIONS } from "./defaultPlans";
import { formatStorageBytes } from "./storageQuotaPolicy";
import type { CompanyPlanAssignment, PlanDefinition } from "./planTypes";

export type CompanyPlanChangeFieldId =
  | "planCode"
  | "storageLimitBytes"
  | "memberLimit"
  | "priceKrw"
  | "effectiveDate"
  | "memo";

export interface CompanyPlanChangeFieldDefinition {
  id: CompanyPlanChangeFieldId;
  label: string;
  value: string;
  statusLabel: string;
  description: string;
}

export interface CompanyPlanChangeValidationItem {
  id: string;
  label: string;
  statusLabel: string;
  description: string;
}

export interface CompanyPlanChangePreview {
  companyId: string;
  companyName: string;
  currentPlanLabel: string;
  nextPlanLabel: string;
  storageChangeLabel: string;
  memberChangeLabel: string;
  priceChangeLabel: string;
  effectiveDateLabel: string;
  policySourceLabel: string;
}

export interface CompanyPlanChangeDraft {
  companyId: string;
  companyName: string;
  currentAssignment: CompanyPlanAssignment;
  nextPlanCode: string;
  storageLimitBytesOverride: number | null;
  memberLimitOverride: number | null;
  priceKrwOverride: number | null;
  effectiveDate: string;
  memo: string;
}

function findPlanById(planId: string): PlanDefinition {
  return DEFAULT_PLAN_DEFINITIONS.find((plan) => plan.id === planId) ?? DEFAULT_PLAN_DEFINITIONS[0];
}

function findPlanByCode(planCode: string): PlanDefinition {
  return DEFAULT_PLAN_DEFINITIONS.find((plan) => plan.code === planCode) ?? DEFAULT_PLAN_DEFINITIONS[0];
}

function formatKrw(value: number): string {
  return `${value.toLocaleString("ko-KR")}원 / 월`;
}

function formatMemberLimit(value: number): string {
  return `${value.toLocaleString("ko-KR")}명`;
}

export function getCompanyPlanChangePreview(draft: CompanyPlanChangeDraft): CompanyPlanChangePreview {
  const currentPlan = findPlanById(draft.currentAssignment.planId);
  const nextPlan = findPlanByCode(draft.nextPlanCode);
  const nextStorageLimitBytes = draft.storageLimitBytesOverride ?? nextPlan.storage.includedStorageBytes;
  const nextMemberLimit = draft.memberLimitOverride ?? nextPlan.members.includedMembers;
  const nextPriceKrw = draft.priceKrwOverride ?? nextPlan.priceKrw;

  return {
    companyId: draft.companyId,
    companyName: draft.companyName,
    currentPlanLabel: `${currentPlan.name} (${currentPlan.code})`,
    nextPlanLabel: `${nextPlan.name} (${nextPlan.code})`,
    storageChangeLabel: `${formatStorageBytes(currentPlan.storage.includedStorageBytes)} → ${formatStorageBytes(nextStorageLimitBytes)}`,
    memberChangeLabel: `${formatMemberLimit(currentPlan.members.includedMembers)} → ${formatMemberLimit(nextMemberLimit)}`,
    priceChangeLabel: `${formatKrw(currentPlan.priceKrw)} → ${formatKrw(nextPriceKrw)}`,
    effectiveDateLabel: draft.effectiveDate,
    policySourceLabel: draft.storageLimitBytesOverride || draft.memberLimitOverride || draft.priceKrwOverride
      ? "요금제 + 고객사 override"
      : "요금제 기본값",
  };
}

export function getCompanyPlanChangeFields(draft: CompanyPlanChangeDraft): CompanyPlanChangeFieldDefinition[] {
  const preview = getCompanyPlanChangePreview(draft);
  return [
    {
      id: "planCode",
      label: "변경 요금제",
      value: preview.nextPlanLabel,
      statusLabel: "필수",
      description: "company_plan_assignments.plan_id에 저장될 대상 요금제입니다.",
    },
    {
      id: "storageLimitBytes",
      label: "저장공간 한도",
      value: preview.storageChangeLabel,
      statusLabel: draft.storageLimitBytesOverride ? "override" : "plan",
      description: "고객사별 예외 용량이 있으면 override 값으로 저장합니다.",
    },
    {
      id: "memberLimit",
      label: "멤버 한도",
      value: preview.memberChangeLabel,
      statusLabel: draft.memberLimitOverride ? "override" : "plan",
      description: "승인된 company_members 수 기준의 운영 한도입니다.",
    },
    {
      id: "priceKrw",
      label: "월 이용료",
      value: preview.priceChangeLabel,
      statusLabel: draft.priceKrwOverride ? "override" : "plan",
      description: "실제 결제 자동화 전까지 운영자가 관리하는 계약 금액입니다.",
    },
    {
      id: "effectiveDate",
      label: "적용 시작일",
      value: draft.effectiveDate,
      statusLabel: "예약 가능",
      description: "즉시 변경 또는 예정 변경을 같은 assignment 구조로 처리합니다.",
    },
    {
      id: "memo",
      label: "변경 메모",
      value: draft.memo,
      statusLabel: "감사 로그 후보",
      description: "시스템관리자 변경 사유를 audit log와 함께 남길 수 있게 준비합니다.",
    },
  ];
}

export function getCompanyPlanChangeValidationItems(draft: CompanyPlanChangeDraft): CompanyPlanChangeValidationItem[] {
  const nextPlan = findPlanByCode(draft.nextPlanCode);
  const nextStorageLimitBytes = draft.storageLimitBytesOverride ?? nextPlan.storage.includedStorageBytes;
  const nextMemberLimit = draft.memberLimitOverride ?? nextPlan.members.includedMembers;

  return [
    {
      id: "storage-max",
      label: "저장공간 상한",
      statusLabel: nextPlan.storage.maxStorageBytes && nextStorageLimitBytes > nextPlan.storage.maxStorageBytes ? "확인 필요" : "통과",
      description: nextPlan.storage.maxStorageBytes
        ? `요금제 상한 ${formatStorageBytes(nextPlan.storage.maxStorageBytes)} 이내인지 확인합니다.`
        : "Business 이상은 별도 상한 없이 운영자 override를 허용합니다.",
    },
    {
      id: "member-max",
      label: "멤버 상한",
      statusLabel: nextPlan.members.maxMembers && nextMemberLimit > nextPlan.members.maxMembers ? "확인 필요" : "통과",
      description: nextPlan.members.maxMembers
        ? `요금제 상한 ${formatMemberLimit(nextPlan.members.maxMembers)} 이내인지 확인합니다.`
        : "Business 이상은 별도 멤버 상한 없이 운영자 override를 허용합니다.",
    },
    {
      id: "permission",
      label: "변경 권한",
      statusLabel: "후속 검증",
      description: "system.billing.manage 또는 동등한 시스템 권한 검증을 API에 연결해야 합니다.",
    },
    {
      id: "audit-log",
      label: "감사 로그",
      statusLabel: "후속 연결",
      description: "plan 변경 전후 값과 변경 사유를 system audit log로 기록합니다.",
    },
  ];
}
