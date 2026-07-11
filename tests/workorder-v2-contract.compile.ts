import type {
  CreateWorkOrderDraftCommand,
  DecimalString,
  EntityVersion,
  OpaqueCursor,
  RevisionNumber,
  SetRepresentativeImageCommand,
  WorkOrderApiErrorCode,
  WorkOrderId,
  WorkOrderListItem,
  WorkOrderListPage,
} from "@/lib/domain/work-orders/contracts";

type Assert<TValue extends true> = TValue;
type HasKey<TValue, TKey extends PropertyKey> = TKey extends keyof TValue ? true : false;
type Not<TValue extends boolean> = TValue extends true ? false : true;

type CreateCommandHasNoCompanyId = Assert<Not<HasKey<CreateWorkOrderDraftCommand, "companyId">>>;
type ImageCommandHasNoCompanyId = Assert<Not<HasKey<SetRepresentativeImageCommand, "companyId">>>;
type ListItemHasNoImages = Assert<Not<HasKey<WorkOrderListItem, "images">>>;
type ListItemHasNoAttachments = Assert<Not<HasKey<WorkOrderListItem, "attachments">>>;
type ListItemHasNoMaterials = Assert<Not<HasKey<WorkOrderListItem, "materials">>>;
type ConflictCodeExists = Assert<"CONFLICT" extends WorkOrderApiErrorCode ? true : false>;

const sampleListItem = {
  id: "00000000-0000-4000-8000-000000000001" as WorkOrderId,
  productName: "테스트 재킷",
  status: "draft",
  dueDate: null,
  totalQuantity: 30,
  currentRevisionNumber: 0 as RevisionNumber,
  displayDocumentNumber: null,
  representativeThumbnail: null,
  materialSummary: {
    fabricCount: 1,
    accessoryCount: 2,
    requestedCount: 0,
    completedCount: 0,
  },
  readiness: {
    canIssue: false,
    hardBlockers: [],
    warnings: [],
    basedOnVersion: 1 as EntityVersion,
  },
  updatedAt: "2026-07-11T12:00:00+09:00" as WorkOrderListItem["updatedAt"],
  entityVersion: 1 as EntityVersion,
} satisfies WorkOrderListItem;

const samplePage = {
  items: [sampleListItem],
  nextCursor: "opaque-cursor" as OpaqueCursor,
  hasMore: true,
  limit: 30,
} satisfies WorkOrderListPage;

const decimal: DecimalString = "123.45" as DecimalString;
const errorCode: WorkOrderApiErrorCode = "CONFLICT";

void samplePage;
void decimal;
void errorCode;

export type WorkOrderV2CompileAssertions =
  | CreateCommandHasNoCompanyId
  | ImageCommandHasNoCompanyId
  | ListItemHasNoImages
  | ListItemHasNoAttachments
  | ListItemHasNoMaterials
  | ConflictCodeExists;
