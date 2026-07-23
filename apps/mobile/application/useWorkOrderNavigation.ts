import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { AppState } from "react-native";

import type { WorkOrderListItem } from "../domain/mobileContract";

export type WorkOrderNavigationController = {
  readonly selected: WorkOrderListItem | null;
  readonly setSelected: Dispatch<SetStateAction<WorkOrderListItem | null>>;
  readonly selectedWorkOrderId: MutableRefObject<string | null>;
  readonly appLifecycle: "foreground" | "background";
};

export function useWorkOrderNavigation(): WorkOrderNavigationController {
  const [selected, setSelected] = useState<WorkOrderListItem | null>(null);
  const [appLifecycle, setAppLifecycle] = useState<"foreground" | "background">("foreground");
  const selectedWorkOrderId = useRef<string | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setAppLifecycle(state === "active" ? "foreground" : "background");
    });
    return () => subscription.remove();
  }, []);

  return { selected, setSelected, selectedWorkOrderId, appLifecycle };
}
