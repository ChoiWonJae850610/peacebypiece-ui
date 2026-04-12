import type { WorkorderRepository } from "@/lib/repositories/workorderRepository";
import {
  getDefaultCurrentUserId,
  getDefaultPermissionTargetId,
  getDefaultSelectedId,
  getInitialHistoryLogs,
  getInitialUsers,
  getInitialWorkOrders,
  saveWorkOrders,
} from "@/lib/data/workorderMockData";

const mockWorkorderRepository: WorkorderRepository = {
  getInitialUsers,
  getInitialWorkOrders,
  getInitialHistoryLogs,
  getDefaultSelectedId,
  getDefaultCurrentUserId,
  getDefaultPermissionTargetId,
  saveWorkOrders,
};

export function getMockWorkorderRepository(): WorkorderRepository {
  return mockWorkorderRepository;
}
