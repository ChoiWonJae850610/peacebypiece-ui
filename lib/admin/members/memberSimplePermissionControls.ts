import {
  DEFAULT_MEMBER_BASE_READ_PERMISSION_CODES,
  MEMBER_PERMISSION_CODE,
  type MemberPermissionCode,
} from "@/lib/permissions";

export type SimplePermissionControl = {
  id:
    | "workorderManage"
    | "workorderReview"
    | "workorderOrderDirect"
    | "materialOrderRequest"
    | "materialOrderPlace"
    | "partnerManage"
    | "standardsManage";
  labelKey: string;
  fallbackLabel: string;
  descriptionKey: string;
  fallbackDescription: string;
  permissionCodes: readonly MemberPermissionCode[];
  readPermissionCodes?: readonly MemberPermissionCode[];
};

export const MEMBER_BASE_READ_PERMISSION_CODES: readonly MemberPermissionCode[] =
  DEFAULT_MEMBER_BASE_READ_PERMISSION_CODES;

export const SIMPLE_PERMISSION_CONTROLS: readonly SimplePermissionControl[] = [
  {
    id: "workorderManage",
    labelKey: "memberManagement.detailModal.simplePermissions.workorderManage.label",
    fallbackLabel: "작업지시서 관리",
    descriptionKey: "memberManagement.detailModal.simplePermissions.workorderManage.description",
    fallbackDescription:
      "해제하면 본인 담당 작업지시서 조회만 가능하고, 선택하면 생성·수정·삭제·검토요청이 가능합니다.",
    readPermissionCodes: [MEMBER_PERMISSION_CODE.workorderRead],
    permissionCodes: [
      MEMBER_PERMISSION_CODE.workorderCreate,
      MEMBER_PERMISSION_CODE.workorderUpdate,
      MEMBER_PERMISSION_CODE.workorderDelete,
      MEMBER_PERMISSION_CODE.workorderStatusReview,
    ],
  },
  {
    id: "workorderReview",
    labelKey: "memberManagement.detailModal.simplePermissions.workorderReview.label",
    fallbackLabel: "검수 가능",
    descriptionKey: "memberManagement.detailModal.simplePermissions.workorderReview.description",
    fallbackDescription: "선택하면 담당 작업지시서의 검수 상태를 변경할 수 있습니다.",
    permissionCodes: [MEMBER_PERMISSION_CODE.workorderStatusInspect],
  },
  {
    id: "workorderOrderDirect",
    labelKey: "memberManagement.detailModal.simplePermissions.workorderOrderDirect.label",
    fallbackLabel: "작업지시서 발주 가능",
    descriptionKey: "memberManagement.detailModal.simplePermissions.workorderOrderDirect.description",
    fallbackDescription: "선택하면 작업지시서 발주 요청과 발주 상태 변경을 진행할 수 있습니다.",
    permissionCodes: [MEMBER_PERMISSION_CODE.workorderStatusOrder],
  },
  {
    id: "materialOrderRequest",
    labelKey: "memberManagement.detailModal.simplePermissions.materialOrderRequest.label",
    fallbackLabel: "원단·부자재 주문 가능",
    descriptionKey: "memberManagement.detailModal.simplePermissions.materialOrderRequest.description",
    fallbackDescription:
      "선택하면 담당 작업지시서에서 원단·부자재 주문 요청을 등록하거나 수정할 수 있습니다.",
    permissionCodes: [MEMBER_PERMISSION_CODE.materialOrderRequest],
  },
  {
    id: "materialOrderPlace",
    labelKey: "memberManagement.detailModal.simplePermissions.materialOrderPlace.label",
    fallbackLabel: "원단·부자재 발주 가능",
    descriptionKey: "memberManagement.detailModal.simplePermissions.materialOrderPlace.description",
    fallbackDescription: "선택하면 원단·부자재 발주 처리와 발주 상태 변경을 진행할 수 있습니다.",
    permissionCodes: [MEMBER_PERMISSION_CODE.materialOrderPlace],
  },
  {
    id: "partnerManage",
    labelKey: "memberManagement.detailModal.simplePermissions.partnerManage.label",
    fallbackLabel: "협력업체 관리",
    descriptionKey: "memberManagement.detailModal.simplePermissions.partnerManage.description",
    fallbackDescription:
      "해제하면 협력업체 조회만 가능하고, 선택하면 등록·수정·비활성·삭제 요청이 가능합니다.",
    readPermissionCodes: [MEMBER_PERMISSION_CODE.partnerRead],
    permissionCodes: [
      MEMBER_PERMISSION_CODE.partnerCreate,
      MEMBER_PERMISSION_CODE.partnerUpdate,
      MEMBER_PERMISSION_CODE.partnerDelete,
      MEMBER_PERMISSION_CODE.partnerManage,
    ],
  },
  {
    id: "standardsManage",
    labelKey: "memberManagement.detailModal.simplePermissions.standardsManage.label",
    fallbackLabel: "기준정보 관리",
    descriptionKey: "memberManagement.detailModal.simplePermissions.standardsManage.description",
    fallbackDescription:
      "해제하면 기준정보 조회만 가능하고, 선택하면 등록·수정·비활성·삭제 요청이 가능합니다.",
    readPermissionCodes: [MEMBER_PERMISSION_CODE.standardsRead],
    permissionCodes: [
      MEMBER_PERMISSION_CODE.standardsCreate,
      MEMBER_PERMISSION_CODE.standardsUpdate,
      MEMBER_PERMISSION_CODE.standardsDelete,
      MEMBER_PERMISSION_CODE.standardsManage,
    ],
  },
] as const;

export function hasEverySimplePermissionCode(
  permissionCodes: readonly MemberPermissionCode[],
  nextPermissionCodes: readonly MemberPermissionCode[],
): boolean {
  return nextPermissionCodes.every((code) => permissionCodes.includes(code));
}

export function hasSomeSimplePermissionCode(
  permissionCodes: readonly MemberPermissionCode[],
  nextPermissionCodes: readonly MemberPermissionCode[],
): boolean {
  return nextPermissionCodes.some((code) => permissionCodes.includes(code));
}

export function normalizeSimplePermissionCodes(
  permissionCodes: readonly MemberPermissionCode[],
): MemberPermissionCode[] {
  return Array.from(new Set([...MEMBER_BASE_READ_PERMISSION_CODES, ...permissionCodes])).sort();
}

export function mergeSimplePermissionCodes(
  permissionCodes: readonly MemberPermissionCode[],
  nextPermissionCodes: readonly MemberPermissionCode[],
): MemberPermissionCode[] {
  return normalizeSimplePermissionCodes([...permissionCodes, ...nextPermissionCodes]);
}

export function removeSimplePermissionCodes(
  permissionCodes: readonly MemberPermissionCode[],
  nextPermissionCodes: readonly MemberPermissionCode[],
): MemberPermissionCode[] {
  const removalSet = new Set(nextPermissionCodes);
  return normalizeSimplePermissionCodes(
    permissionCodes.filter((code) => !removalSet.has(code)),
  );
}

export function toggleSimplePermissionControl(
  permissionCodes: readonly MemberPermissionCode[],
  control: SimplePermissionControl,
): MemberPermissionCode[] {
  return hasSomeSimplePermissionCode(permissionCodes, control.permissionCodes)
    ? removeSimplePermissionCodes(permissionCodes, control.permissionCodes)
    : mergeSimplePermissionCodes(permissionCodes, [
        ...(control.readPermissionCodes ?? []),
        ...control.permissionCodes,
      ]);
}

export function countVisibleSimplePermissionControls(
  permissionCodes: readonly MemberPermissionCode[],
): number {
  return SIMPLE_PERMISSION_CONTROLS.filter((control) =>
    hasSomeSimplePermissionCode(permissionCodes, control.permissionCodes),
  ).length;
}
