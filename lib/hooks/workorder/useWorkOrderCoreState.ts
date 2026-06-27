"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWorkorderRepository } from "@/lib/repositories/WorkorderRepositoryProvider";
import { createRepositoryError, type WorkOrderRepositoryError } from "@/lib/repositories/repositoryErrors";
import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";
import {
  DEFAULT_WORK_ORDER_LIST_SORT,
  DEFAULT_WORK_ORDER_LIST_STATUS_FILTER,
  type WorkOrderListSort,
  type WorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";
import type { AsyncOperationStatus } from "./useWorkOrderActionTypes";
import { buildUserRoleState, ROLE } from "@/lib/constants/roles";
import { DEFAULT_WORKFLOW_STATE } from "@/lib/constants/workorderStates";
import { createStabilizedWorkOrdersSetter, stabilizeWorkOrders } from "@/lib/workorder/reorder/state";
import { normalizeWorkOrderDataList } from "@/lib/workorder/normalization";
import { hasWorkOrderDraftChanges } from "@/lib/workorder/draftState";
import {
  mergeDetailSnapshotIntoWorkOrders,
  replaceWithDetailSnapshot,
} from "@/lib/workorder/workOrderHydration";
import {
  WORKORDER_ATTACHMENT_REFRESH_EVENT,
  isWorkOrderAttachmentRefreshStorageKey,
  readWorkOrderAttachmentRefreshDetail,
  type WorkOrderAttachmentRefreshDetail,
} from "@/lib/workorder/attachments/attachmentRefreshEvents";

const EMPTY_CURRENT_USER: UserProfile = {
  id: "",
  name: "",
  ...buildUserRoleState([]),
};

const createFallbackWorkOrder = (): WorkOrder => ({
  id: "",
  title: "",
  category1: "",
  category2: "",
  category3: "",
  season: "",
  priority: "",
  vendor: "",
  manager: "",
  managerId: null,
  createdById: "",
  createdByRole: ROLE.admin,
  dueDate: "",
  quantity: 0,
  laborCost: 0,
  lossCost: 0,
  orderEntries: [],
  inventoryQuantity: 0,
  inventoryStatus: "unchecked",
  materials: [],
  outsourcing: [],
  attachments: [],
  workflowState: DEFAULT_WORKFLOW_STATE,
  lastSavedAt: "",
  factoryOrderRequest: null,
});

type UseWorkOrderCoreStateOptions = {
  initialWorkOrderId?: string | null;
  initialListStatusFilter?: WorkOrderListStatusFilter;
  initialListSort?: WorkOrderListSort;
  initialSearchQuery?: string;
};


function hasPermissionCodes(user: UserProfile | null | undefined): boolean {
  return Array.isArray(user?.permissionCodes) && user.permissionCodes.length > 0;
}

function findMatchingUserProfile(input: {
  users: UserProfile[];
  currentUser: UserProfile | null | undefined;
  currentUserId: string;
}): UserProfile | null {
  const currentUserId = input.currentUserId.trim();
  const currentCompanyMemberId = input.currentUser?.companyMemberId?.trim() ?? "";
  const currentId = input.currentUser?.id?.trim() ?? "";

  return input.users.find((user) => {
    const userId = user.id.trim();
    const companyMemberId = user.companyMemberId?.trim() ?? "";

    return (
      Boolean(currentId && userId === currentId) ||
      Boolean(currentUserId && userId === currentUserId) ||
      Boolean(currentCompanyMemberId && companyMemberId === currentCompanyMemberId) ||
      Boolean(currentUserId && companyMemberId === currentUserId)
    );
  }) ?? null;
}

function mergeCurrentUserWithDirectoryProfile(input: {
  currentUser: UserProfile;
  users: UserProfile[];
  currentUserId: string;
}): UserProfile {
  const matchedUser = findMatchingUserProfile(input);
  if (!matchedUser) return input.currentUser;

  const baseUser = input.currentUser.id ? input.currentUser : matchedUser;
  const permissionCodes = hasPermissionCodes(input.currentUser)
    ? input.currentUser.permissionCodes
    : matchedUser.permissionCodes ?? [];

  return {
    ...matchedUser,
    ...baseUser,
    companyMemberId: baseUser.companyMemberId ?? matchedUser.companyMemberId ?? null,
    name: baseUser.name || matchedUser.name,
    permissionCodes,
  };
}

function resolveInitialSelectedId(input: {
  requestedId: string | null;
  workOrders: WorkOrder[];
}): string {
  if (input.requestedId && input.workOrders.some((item) => item.id === input.requestedId)) return input.requestedId;
  return "";
}

export function useWorkOrderCoreState(options: UseWorkOrderCoreStateOptions = {}) {
  const repository = useWorkorderRepository();
  const initialUsers = useMemo(() => repository.getInitialUsers(), [repository]);
  const initialWorkOrders = useMemo(() => repository.getInitialWorkOrders(), [repository]);
  const initialHistoryLogs = useMemo(() => repository.getInitialHistoryLogs(), [repository]);
  const initialCurrentUserId = useMemo(() => repository.getDefaultCurrentUserId(), [repository]);
  const initialPermissionTargetUserId = useMemo(() => repository.getDefaultPermissionTargetId(), [repository]);
  const initialCurrentUser = useMemo(
    () => initialUsers.find((user) => user.id === initialCurrentUserId) ?? initialUsers[0] ?? EMPTY_CURRENT_USER,
    [initialCurrentUserId, initialUsers],
  );

  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [currentUserId, setCurrentUserId] = useState(initialCurrentUserId);
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialCurrentUser);
  const [permissionTargetUserId, setPermissionTargetUserId] = useState(initialPermissionTargetUserId);
  const normalizedInitialWorkOrders = useMemo(() => stabilizeWorkOrders(normalizeWorkOrderDataList(initialWorkOrders)), [initialWorkOrders]);
  const [workOrders, setWorkOrdersState] = useState<WorkOrder[]>(normalizedInitialWorkOrders);
  const [persistedWorkOrders, setPersistedWorkOrders] = useState<WorkOrder[]>(normalizedInitialWorkOrders);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(initialHistoryLogs);
  const [selectedId, setSelectedId] = useState(() =>
    resolveInitialSelectedId({ requestedId: options.initialWorkOrderId ?? null, workOrders: normalizedInitialWorkOrders }),
  );
  const [searchQuery, setSearchQuery] = useState(options.initialSearchQuery ?? "");
  const [listStatusFilter, setListStatusFilter] = useState<WorkOrderListStatusFilter>(
    options.initialListStatusFilter ?? DEFAULT_WORK_ORDER_LIST_STATUS_FILTER,
  );
  const [listSort, setListSort] = useState<WorkOrderListSort>(
    options.initialListSort ?? DEFAULT_WORK_ORDER_LIST_SORT,
  );
  const [repositoryStatus, setRepositoryStatus] = useState<AsyncOperationStatus>("loading");
  const [repositoryError, setRepositoryError] = useState<WorkOrderRepositoryError | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    selectedId ? initialWorkOrders.find((item) => item.id === selectedId)?.lastSavedAt ?? null : null,
  );
  const detailLoadInFlightIdsRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      detailLoadInFlightIdsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setRepositoryStatus("loading");
    setRepositoryError(null);

    repository
      .loadWorkspaceStateAsync()
      .then((loadedState) => {
        if (cancelled) return;
        const nextState = loadedState ?? repository.createInitialState();
        setUsers(nextState.users);
        setCurrentUserId(nextState.currentUserId);
        setCurrentUser(nextState.currentUser ?? nextState.users.find((user) => user.id === nextState.currentUserId) ?? nextState.users[0] ?? EMPTY_CURRENT_USER);
        setPermissionTargetUserId(nextState.permissionTargetUserId);
        const normalizedLoadedWorkOrders = stabilizeWorkOrders(normalizeWorkOrderDataList(nextState.workOrders));
        setWorkOrdersState(normalizedLoadedWorkOrders);
        setPersistedWorkOrders(normalizedLoadedWorkOrders);
        setHistoryLogs(nextState.historyLogs);
        const nextSelectedId = resolveInitialSelectedId({
          requestedId: options.initialWorkOrderId ?? null,
          workOrders: normalizedLoadedWorkOrders,
        });
        setSelectedId(nextSelectedId);
        const nextSelected = normalizedLoadedWorkOrders.find((item) => item.id === nextSelectedId) ?? null;
        setLastSavedAt(nextSelected?.lastSavedAt ?? null);
        setRepositoryStatus("ready");
      })
      .catch((error) => {
        if (!isMountedRef.current) return;
        setRepositoryError(createRepositoryError("initialize", error, "Failed to load workorder repository state."));
        setRepositoryStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [options.initialWorkOrderId, repository]);

  useEffect(() => {
    if (repositoryStatus !== "ready" || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    params.set("status", listStatusFilter);
    params.set("sort", listSort);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(window.history.state, "", nextUrl);

    let cancelled = false;
    setRepositoryStatus("loading");
    setRepositoryError(null);
    repository
      .loadWorkspaceStateAsync()
      .then((loadedState) => {
        if (cancelled || !loadedState) return;
        const normalizedLoadedWorkOrders = stabilizeWorkOrders(normalizeWorkOrderDataList(loadedState.workOrders));
        setWorkOrdersState(normalizedLoadedWorkOrders);
        setPersistedWorkOrders(normalizedLoadedWorkOrders);
        const nextSelectedId = normalizedLoadedWorkOrders.some((item) => item.id === selectedId)
          ? selectedId
          : normalizedLoadedWorkOrders[0]?.id ?? "";
        setSelectedId(nextSelectedId);
        setLastSavedAt(normalizedLoadedWorkOrders.find((item) => item.id === nextSelectedId)?.lastSavedAt ?? null);
        setRepositoryStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setRepositoryError(createRepositoryError("initialize", error, "Failed to reload filtered workorders."));
        setRepositoryStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [listSort, listStatusFilter]);

  useEffect(() => {
    if (repositoryStatus !== "ready") return;

    repository
      .saveWorkspaceSessionAsync({
        selectedId,
        currentUserId,
        permissionTargetUserId,
      })
      .catch((error) => {
        setRepositoryError(createRepositoryError("persist", error, "Failed to persist workorder workspace session."));
        setRepositoryStatus("error");
      });
  }, [currentUserId, permissionTargetUserId, repository, repositoryStatus, selectedId]);

  const setWorkOrders = useCallback(createStabilizedWorkOrdersSetter(setWorkOrdersState), []);

  const selectedWorkOrder = useMemo(
    () => (selectedId ? workOrders.find((item) => item.id === selectedId) : null) ?? createFallbackWorkOrder(),
    [workOrders, selectedId],
  );
  const isSelectedWorkOrderDetailLoading = useMemo(
    () => Boolean(selectedId && workOrders.some((item) => item.id === selectedId && !item.hasDetailSnapshot)),
    [selectedId, workOrders],
  );

  const reloadWorkOrderDetail = useCallback((workOrderId: string) => {
    const targetId = workOrderId.trim();
    if (!targetId || detailLoadInFlightIdsRef.current.has(targetId)) return;

    detailLoadInFlightIdsRef.current.add(targetId);

    repository
      .loadWorkOrderDetailAsync(targetId)
      .then((loadedWorkOrder) => {
        if (!isMountedRef.current) return;
        const normalizedDetail = stabilizeWorkOrders(normalizeWorkOrderDataList([{ ...loadedWorkOrder, hasDetailSnapshot: true }]))[0];
        if (!normalizedDetail) return;

        setWorkOrdersState((current) =>
          stabilizeWorkOrders(mergeDetailSnapshotIntoWorkOrders(current, normalizedDetail)),
        );
        setPersistedWorkOrders((current) =>
          stabilizeWorkOrders(replaceWithDetailSnapshot(current, normalizedDetail)),
        );
      })
      .catch((error) => {
        if (!isMountedRef.current) return;
        setRepositoryError(createRepositoryError("initialize", error, "Failed to refresh workorder attachments."));
      })
      .finally(() => {
        detailLoadInFlightIdsRef.current.delete(targetId);
      });
  }, [repository]);

  useEffect(() => {
    if (repositoryStatus !== "ready" || !selectedId || !isSelectedWorkOrderDetailLoading) return;
    reloadWorkOrderDetail(selectedId);
  }, [isSelectedWorkOrderDetailLoading, reloadWorkOrderDetail, repositoryStatus, selectedId]);

  useEffect(() => {
    if (repositoryStatus !== "ready" || typeof window === "undefined") return;

    function refreshFromDetail(detail: WorkOrderAttachmentRefreshDetail | null) {
      if (!detail) return;
      detail.workOrderIds.forEach((workOrderId) => reloadWorkOrderDetail(workOrderId));
    }

    function handleRefresh(event: Event) {
      refreshFromDetail((event as CustomEvent<WorkOrderAttachmentRefreshDetail>).detail ?? null);
    }

    function handleStorage(event: StorageEvent) {
      if (!isWorkOrderAttachmentRefreshStorageKey(event.key)) return;
      refreshFromDetail(readWorkOrderAttachmentRefreshDetail(event.newValue));
    }

    window.addEventListener(WORKORDER_ATTACHMENT_REFRESH_EVENT, handleRefresh);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(WORKORDER_ATTACHMENT_REFRESH_EVENT, handleRefresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, [reloadWorkOrderDetail, repositoryStatus]);

  useEffect(() => {
    const currentSelectedWorkOrder = selectedId ? workOrders.find((item) => item.id === selectedId) ?? null : null;
    const persistedSelectedWorkOrder = selectedId ? persistedWorkOrders.find((item) => item.id === selectedId) ?? null : null;
    const isDirty = hasWorkOrderDraftChanges(currentSelectedWorkOrder, persistedSelectedWorkOrder);

    setSaveStatus((previous) => {
      if (previous === "saving") return previous;
      return isDirty ? "dirty" : "saved";
    });
    setLastSavedAt(persistedSelectedWorkOrder?.lastSavedAt ?? currentSelectedWorkOrder?.lastSavedAt ?? null);
  }, [persistedWorkOrders, selectedId, workOrders]);

  const permissionTargetUser = useMemo(
    () => users.find((user) => user.id === permissionTargetUserId) ?? users[0] ?? EMPTY_CURRENT_USER,
    [users, permissionTargetUserId],
  );

  const effectiveCurrentUser = useMemo(
    () => mergeCurrentUserWithDirectoryProfile({ currentUser, users, currentUserId }),
    [currentUser, currentUserId, users],
  );

  return {
    users,
    setUsers,
    currentUserId,
    setCurrentUserId,
    permissionTargetUserId,
    setPermissionTargetUserId,
    permissionTargetUser,
    workOrders,
    setWorkOrders,
    persistedWorkOrders,
    setPersistedWorkOrders,
    historyLogs,
    setHistoryLogs,
    selectedId,
    setSelectedId,
    selectedWorkOrder,
    isSelectedWorkOrderDetailLoading,
    searchQuery,
    setSearchQuery,
    listStatusFilter,
    setListStatusFilter,
    listSort,
    setListSort,
    saveStatus,
    setSaveStatus,
    lastSavedAt,
    setLastSavedAt,
    currentUser: effectiveCurrentUser,
    repositoryStatus,
    repositoryError,
  };
}
