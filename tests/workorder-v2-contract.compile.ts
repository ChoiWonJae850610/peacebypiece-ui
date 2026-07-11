import type {
  CreateWorkOrderDraftCommand,
  DecimalString,
  OpaqueCursor,
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
  workOrderId: "00000000-0000-4000-8000-000000000001" as WorkOrderId,
  displayDocumentNumber: null,
  productName: "테스트 재킷",
  status: "draft",
  dueDate: null,
  totalQuantity: 30,
  estimatedAmountSummary: {
    currency: "KRW" as WorkOrderListItem["estimatedAmountSummary"]["currency"],
    estimatedTotal: "390000.00" as DecimalString,
  },
  representativeThumbnail: null,
  incompleteMaterialSummary: {
    incompleteFabricCount: 1,
    incompleteAccessoryCount: 2,
  },
  processCount: 3,
  latestDocumentStatus: null,
  updatedAt: "2026-07-11T12:00:00+09:00" as WorkOrderListItem["updatedAt"],
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
