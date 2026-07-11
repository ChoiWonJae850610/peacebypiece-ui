import type { IsoDate, IsoDateTime, OpaqueCursor } from "@/lib/domain/work-orders/contracts/primitives";
import type { TrashScope, WorkOrderStatus } from "@/lib/domain/work-orders/contracts/enums";

export const WORK_ORDER_LIST_DEFAULT_LIMIT = 30;
export const WORK_ORDER_LIST_MAX_LIMIT = 50;

export type WorkOrderListSort = "updated_desc" | "due_date_asc";

export type WorkOrderListFilter = {
  readonly statuses?: readonly WorkOrderStatus[];
  readonly dueDateFrom?: IsoDate | null;
  readonly dueDateTo?: IsoDate | null;
  readonly updatedFrom?: IsoDateTime | null;
  readonly updatedTo?: IsoDateTime | null;
  readonly productQuery?: string | null;
  readonly partnerQuery?: string | null;
  readonly materialQuery?: string | null;
  readonly trashScope?: TrashScope;
};

export type WorkOrderListQuery = {
  readonly cursor?: OpaqueCursor | null;
  readonly limit?: number;
  readonly sort?: WorkOrderListSort;
  readonly filter?: WorkOrderListFilter;
};

export type CursorPage<TItem> = {
  readonly items: readonly TItem[];
  readonly nextCursor: OpaqueCursor | null;
  readonly hasMore: boolean;
  readonly limit: number;
};
