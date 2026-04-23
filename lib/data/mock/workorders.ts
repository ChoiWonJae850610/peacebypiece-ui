import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { INVENTORY_CHANGE_TYPE, INVENTORY_STATUS, MATERIAL_KIND } from "@/lib/constants/workorderDomain";
import { ROLE } from "@/lib/constants/roles";
import { getFixtureI18n } from "@/lib/data/mock/fixtureI18n";
import type { HistoryLog, WorkOrder } from "@/types/workorder";
import type { MockWorkOrderSource } from "@/lib/data/mock/types";

const placeholderImage = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80";
const placeholderPdf = "about:blank";

export function buildWorkOrderSeedSource(locale: Locale = DEFAULT_LOCALE): MockWorkOrderSource {
  const fixture = getFixtureI18n(locale);
  const users = fixture.users;
  const { wo1, wo2, wo3 } = fixture.workorders;
  const history = fixture.history;

  const workOrders: WorkOrder[] = [
    {
      id: "wo-1",
      title: wo1.title,
      baseTitle: wo1.title,
      reorderGroupId: "wo-1",
      reorderRound: 1,
      category1: wo1.category1,
      category2: wo1.category2,
      category3: wo1.category3,
      season: "SS 2026",
      priority: wo1.priority,
      vendor: wo1.vendor,
      manager: users.managerA,
      managerId: null,
      createdById: "user-designer",
      createdByRole: ROLE.designer,
      dueDate: "03/29",
      quantity: 20,
      laborCost: 18000,
      lossCost: 6000,
      orderEntries: [
        { id: "ord-1", targetType: "factory", type: wo1.orderType, factory: wo1.vendor, dueDate: "03/29", quantity: 20, laborCost: 18000, lossCost: 6000, priority: wo1.priority },
      ],
      inventoryQuantity: 12,
      inventoryStatus: INVENTORY_STATUS.shortage,
      memo: wo1.memo,
      workflowState: "review_requested",
      lastSavedAt: "03-26 21:48",
      materials: [
        { id: "m-1", type: MATERIAL_KIND.fabric, name: wo1.materials.fabricMain, vendor: wo1.materials.vendorA, quantity: 12, unit: "yd", unitCost: 3500, totalCost: 42000, status: wo1.materials.statusOrdered },
        { id: "m-2", type: MATERIAL_KIND.fabric, name: wo1.materials.lining, vendor: wo1.materials.vendorB, quantity: 8, unit: "yd", unitCost: 2200, totalCost: 17600, status: wo1.materials.statusReceived },
        { id: "m-3", type: MATERIAL_KIND.subsidiary, name: wo1.materials.button, vendor: wo1.materials.vendorC, quantity: 40, unit: wo1.materials.unitEach, unitCost: 120, totalCost: 4800, status: wo1.materials.statusOrdered },
        { id: "m-4", type: MATERIAL_KIND.subsidiary, name: wo1.materials.careLabel, vendor: wo1.materials.vendorLabel, quantity: 20, unit: wo1.materials.unitEach, unitCost: 150, totalCost: 3000, status: wo1.materials.statusPreparing },
      ],
      outsourcing: [
        { id: "o-1", process: wo1.outsourcing.cutting, vendor: wo1.vendor, quantity: 20, unitType: wo1.outsourcing.unitPerPiece, unitCost: 1800, totalCost: 36000, status: wo1.outsourcing.statusInProgress },
        { id: "o-2", process: wo1.outsourcing.sewing, vendor: wo1.outsourcing.vendorSewing, quantity: 20, unitType: wo1.outsourcing.unitPerPiece, unitCost: 5200, totalCost: 104000, status: wo1.outsourcing.statusInProgress },
        { id: "o-3", process: wo1.outsourcing.print, vendor: wo1.outsourcing.vendorPrint, quantity: 20, unitType: wo1.outsourcing.unitPerPiece, unitCost: 5300, totalCost: 106000, status: wo1.outsourcing.statusWaiting },
      ],
      attachments: [
        { id: "att-1", name: wo1.attachments.mainSample,
          type: "image", url: placeholderImage, scope: "official", ownerId: "user-designer", ownerName: users.designer },
        { id: "att-2", name: wo1.attachments.workorderSheet,
          type: "pdf", url: placeholderPdf, scope: "official", ownerId: "user-admin", ownerName: users.admin },
        { id: "att-3", name: wo1.attachments.swatch,
          type: "image", url: placeholderImage, scope: "memo", linkedThreadId: "memo-1", ownerId: null, ownerName: users.legacyAttachmentOwner },
        { id: "att-4", name: wo1.attachments.sizeSpec,
          type: "pdf", url: placeholderPdf, scope: "memo", linkedReplyId: "reply-1", ownerId: null, ownerName: users.legacyAttachmentOwner },
      ],
      memoThreads: [
        {
          id: "memo-1",
          authorId: "user-designer",
          authorName: users.designer,
          authorRole: ROLE.designer,
          content: wo1.memoThread.content,
          createdAt: "03-26 19:20",
          attachmentIds: ["att-3"],
          replies: [
            {
              id: "reply-1",
              authorId: "user-admin",
              authorName: users.admin,
              authorRole: ROLE.admin,
              content: wo1.memoThread.reply,
              createdAt: "03-26 19:42",
              attachmentIds: ["att-4"],
            },
          ],
        },
      ],
    },
    {
      id: "wo-2",
      title: wo2.title,
      baseTitle: wo2.title,
      reorderGroupId: "wo-2",
      reorderRound: 1,
      category1: wo2.category1,
      category2: wo2.category2,
      category3: wo2.category3,
      season: "FW 2026",
      priority: wo2.priority,
      vendor: wo2.vendor,
      manager: users.admin,
      managerId: "user-admin",
      createdById: "user-admin",
      createdByRole: ROLE.admin,
      dueDate: "04/02",
      quantity: 30,
      laborCost: 24000,
      lossCost: 9000,
      orderEntries: [
        { id: "ord-21", targetType: "factory", type: wo2.orderTypeMain, factory: wo2.vendor, dueDate: "04/02", quantity: 20, laborCost: 16000, lossCost: 5000, priority: wo2.priority, inspectionStatus: "inspection_pending" },
        { id: "ord-22", targetType: "factory", type: wo2.orderTypeMain, factory: wo2.outsourcing.vendorWashing, dueDate: "04/05", quantity: 10, laborCost: 8000, lossCost: 4000, priority: wo2.priority, inspectionStatus: "inspection_pending" },
      ],
      inventoryQuantity: 28,
      inventoryStatus: INVENTORY_STATUS.normal,
      memo: wo2.memo,
      workflowState: "inspection",
      lastSavedAt: "03-26 18:10",
      materials: [
        { id: "m-21", type: MATERIAL_KIND.fabric, name: wo2.materials.denim, vendor: wo2.materials.vendorBlue, quantity: 18, unit: "yd", unitCost: 4700, totalCost: 84600, status: wo2.materials.statusReceived },
        { id: "m-22", type: MATERIAL_KIND.subsidiary, name: wo2.materials.rivet, vendor: wo2.materials.vendorMetal, quantity: 60, unit: wo2.materials.unitEach, unitCost: 300, totalCost: 18000, status: wo2.materials.statusOrdered },
      ],
      outsourcing: [
        { id: "o-21", process: wo2.outsourcing.washing, vendor: wo2.outsourcing.vendorWashing, quantity: 30, unitType: wo2.outsourcing.unitPerPiece, unitCost: 2500, totalCost: 75000, status: wo2.outsourcing.statusInProgress },
      ],
      attachments: [],
      memoThreads: [
        {
          id: "memo-21",
          authorId: "user-admin",
          authorName: users.admin,
          authorRole: ROLE.admin,
          content: wo2.memoThread.content,
          createdAt: "03-25 10:10",
          replies: [
            {
              id: "reply-21",
              authorId: "user-qc",
              authorName: users.inspector,
              authorRole: ROLE.inspector,
              content: wo2.memoThread.reply,
              createdAt: "03-25 11:10",
            },
          ],
        },
      ],
    },
    {
      id: "wo-3",
      title: wo3.title,
      baseTitle: wo3.title,
      reorderGroupId: "wo-3",
      reorderRound: 1,
      category1: wo3.category1,
      category2: wo3.category2,
      category3: wo3.category3,
      season: "ALL",
      priority: wo3.priority,
      vendor: wo3.vendor,
      manager: users.inspector,
      managerId: "user-qc",
      createdById: "user-admin",
      createdByRole: ROLE.admin,
      dueDate: "03/18",
      quantity: 10,
      orderEntries: [
        { id: "ord-31", targetType: "factory", type: wo3.orderType, factory: wo3.vendor, dueDate: "03/18", quantity: 10, laborCost: 0, lossCost: 0, priority: wo3.priority, inspectionStatus: "inspection_completed" },
      ],
      inventoryQuantity: 10,
      inventoryStatus: INVENTORY_STATUS.normal,
      memo: wo3.memo,
      workflowState: "completed",
      lastSavedAt: "03-26 16:02",
      materials: [
        { id: "m-31", type: MATERIAL_KIND.fabric, name: wo3.materials.leather, vendor: wo3.materials.vendorLeather, quantity: 5, unit: "yd", unitCost: 6800, totalCost: 34000, status: wo3.materials.statusReceived },
      ],
      outsourcing: [
        { id: "o-31", process: wo3.outsourcing.stitching, vendor: wo3.vendor, quantity: 10, unitType: wo3.outsourcing.unitPerPiece, unitCost: 4000, totalCost: 40000, status: wo3.outsourcing.statusCompleted },
      ],
      attachments: [
        { id: "att-31", name: wo3.attachments.completedImage,
          type: "image", url: placeholderImage, scope: "official", ownerId: "user-qc", ownerName: users.inspector },
        { id: "att-32", name: wo3.attachments.checklist,
          type: "pdf", url: placeholderPdf, scope: "official", ownerId: null, ownerName: users.legacyAttachmentOwner },
        { id: "att-33", name: wo3.attachments.materialSpec,
          type: "pdf", url: placeholderPdf, scope: "memo", linkedThreadId: "memo-31", ownerId: null, ownerName: users.legacyAttachmentOwner },
      ],
      memoThreads: [
        {
          id: "memo-31",
          authorId: "user-qc",
          authorName: users.inspector,
          authorRole: ROLE.inspector,
          content: wo3.memoThread.content,
          createdAt: "03-24 15:30",
          attachmentIds: ["att-33"],
          replies: [],
        },
      ],
    },
  ];

  const historyLogs: HistoryLog[] = [
    {
      id: "h-1",
      workOrderId: "wo-1",
      category: "work",
      action: history.common.statusChangedAction,
      message: history.common.statusChangedMessage,
      user: users.designer,
      time: "03-26 21:22",
      tone: "violet",
      summary: history.h1.summary,
      transition: { from: history.h1.from, to: history.h1.to },
      detailLines: [{ label: history.common.changeLabel, value: history.h1.detailValue }],
    },
    {
      id: "h-2",
      workOrderId: "wo-1",
      category: "inventory",
      action: INVENTORY_CHANGE_TYPE.inbound,
      message: history.common.inventoryMessage,
      user: users.admin,
      time: "03-26 20:10",
      tone: "emerald",
      summary: history.h2.summary,
      detailLines: [
        { label: history.common.changeLabel, value: history.h2.changeValue },
        { label: history.common.memoLabel, value: history.h2.memoValue },
      ],
    },
    {
      id: "h-3",
      workOrderId: "wo-1",
      category: "work",
      action: history.common.updatedAction,
      message: history.common.updatedMessage,
      user: users.designer,
      time: "03-26 19:48",
      tone: "stone",
      summary: history.h3.summary,
      detailLines: [
        { label: history.common.updatedFieldLabel, value: history.h3.fieldValue },
        { label: history.common.detailLabel, value: history.h3.detailValue },
      ],
    },
    {
      id: "h-3a",
      workOrderId: "wo-1",
      category: "attachment",
      action: history.common.attachmentChangedAction,
      message: history.common.attachmentChangedMessage,
      user: users.admin,
      time: "03-26 19:10",
      tone: "stone",
      summary: history.h3a.summary,
      detailLines: [{ label: history.common.addLabel, value: history.h3a.addValue }],
    },
    {
      id: "h-4",
      workOrderId: "wo-1",
      category: "inventory",
      action: history.h4.action,
      message: history.common.inventoryMessage,
      user: users.inspector,
      time: "03-26 18:30",
      tone: "amber",
      summary: history.h4.summary,
      detailLines: [
        { label: history.common.changeLabel, value: history.h4.changeValue },
        { label: history.common.memoLabel, value: history.h4.memoValue },
      ],
    },
    {
      id: "h-5",
      workOrderId: "wo-2",
      category: "work",
      action: history.common.statusChangedAction,
      message: history.common.statusChangedMessage,
      user: users.admin,
      time: "03-25 14:20",
      tone: "violet",
      summary: history.h5.summary,
      transition: { from: history.h5.from, to: history.h5.to },
      detailLines: [{ label: history.common.changeLabel, value: history.h5.detailValue }],
    },
    {
      id: "h-6",
      workOrderId: "wo-2",
      category: "inventory",
      action: INVENTORY_CHANGE_TYPE.deduction,
      message: history.common.inventoryMessage,
      user: users.inspector,
      time: "03-25 11:00",
      tone: "rose",
      summary: history.h6.summary,
      detailLines: [
        { label: history.common.changeLabel, value: history.h6.changeValue },
        { label: history.common.memoLabel, value: history.h6.memoValue },
      ],
    },
    {
      id: "h-7",
      workOrderId: "wo-3",
      category: "work",
      action: history.common.statusChangedAction,
      message: history.common.statusChangedMessage,
      user: users.inspector,
      time: "03-24 17:40",
      tone: "violet",
      summary: history.h7.summary,
      transition: { from: history.h7.from, to: history.h7.to },
      detailLines: [{ label: history.common.changeLabel, value: history.h7.detailValue }],
    },
  ];

  return {
    workOrders,
    historyLogs,
    defaultSelectedId: workOrders[0]?.id ?? "",
  };
}

export const WORKORDER_SEED_SOURCE: MockWorkOrderSource = buildWorkOrderSeedSource();
export const WORKORDER_SEED_WORK_ORDERS = WORKORDER_SEED_SOURCE.workOrders;
export const MOCK_WORK_ORDERS = WORKORDER_SEED_WORK_ORDERS;
export const WORKORDER_SEED_HISTORY_LOGS = WORKORDER_SEED_SOURCE.historyLogs;
export const MOCK_HISTORY_LOGS = WORKORDER_SEED_HISTORY_LOGS;
export const DEFAULT_SELECTED_WORK_ORDER_ID = WORKORDER_SEED_SOURCE.defaultSelectedId;
