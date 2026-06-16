import { ATTACHMENT_SCOPE, isDesignAttachmentScope } from "@/lib/constants/workorderIdentity";
import { MATERIAL_TYPE } from "@/lib/constants/material";
import { getOrderSubmissionSnapshot } from "@/lib/workorder/orderSubmission";
import type { WorkOrder } from "@/types/workorder";

export type WorkflowValidationIssueLevel = "blocking" | "warning";

export type WorkflowValidationIssue = {
  id: string;
  level: WorkflowValidationIssueLevel;
  message: string;
};

export type WorkflowValidationIssueText = {
  missingDesign: string;
  missingAttachment: string;
  missingFabric: string;
  missingSubsidiary: string;
  zeroAmount: string;
};

function hasPrimaryDesignAttachment(workOrder: WorkOrder): boolean {
  return (workOrder.attachments ?? []).some((attachment) => {
    if (!isDesignAttachmentScope(attachment.scope)) return false;
    return attachment.isPrimary === true || attachment.type === "image";
  });
}

function hasOfficialAttachment(workOrder: WorkOrder): boolean {
  return (workOrder.attachments ?? []).some((attachment) => {
    const scope = attachment.scope ?? ATTACHMENT_SCOPE.attachment;
    return !isDesignAttachmentScope(scope);
  });
}

function hasMaterialType(workOrder: WorkOrder, type: typeof MATERIAL_TYPE.fabric | typeof MATERIAL_TYPE.subsidiary): boolean {
  return (workOrder.materials ?? []).some((material) => material.type === type && String(material.name ?? "").trim().length > 0);
}

function hasZeroOrderAmount(workOrder: WorkOrder): boolean {
  const { laborCost, lossCost } = getOrderSubmissionSnapshot(workOrder);
  const materialTotal = (workOrder.materials ?? []).reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
  const outsourcingTotal = (workOrder.outsourcing ?? []).reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
  const orderTotal = (Number(laborCost) || 0) + (Number(lossCost) || 0) + materialTotal + outsourcingTotal;
  return orderTotal === 0;
}

export function getWorkflowValidationIssues(workOrder: WorkOrder, text: WorkflowValidationIssueText): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];

  if (!hasPrimaryDesignAttachment(workOrder)) {
    issues.push({
      id: "missing_design",
      level: "blocking",
      message: text.missingDesign,
    });
  }

  if (!hasOfficialAttachment(workOrder)) {
    issues.push({
      id: "missing_attachment",
      level: "warning",
      message: text.missingAttachment,
    });
  }

  if (!hasMaterialType(workOrder, MATERIAL_TYPE.fabric)) {
    issues.push({
      id: "missing_fabric",
      level: "warning",
      message: text.missingFabric,
    });
  }

  if (!hasMaterialType(workOrder, MATERIAL_TYPE.subsidiary)) {
    issues.push({
      id: "missing_subsidiary",
      level: "warning",
      message: text.missingSubsidiary,
    });
  }

  if (hasZeroOrderAmount(workOrder)) {
    issues.push({
      id: "zero_amount",
      level: "warning",
      message: text.zeroAmount,
    });
  }

  return issues;
}

export function hasBlockingWorkflowValidationIssue(issues: WorkflowValidationIssue[]): boolean {
  return issues.some((issue) => issue.level === "blocking");
}
