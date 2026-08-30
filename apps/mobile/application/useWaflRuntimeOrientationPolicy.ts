import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect } from "react";
import { AppState } from "react-native";

import {
  resolveWaflRuntimeOrientationAction,
  type WaflMobileDeviceClass,
  type WaflRuntimeOrientationAction,
} from "@/domain/mobileOrientationPolicy";
import { createWaflRuntimeOrientationCoordinator } from "@/domain/mobileOrientationRuntimeCoordinator";

async function applyWaflRuntimeOrientationAction(action: WaflRuntimeOrientationAction) {
  if (action === "lock-portrait-up") {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    return;
  }
  if (action === "unlock-default") {
    await ScreenOrientation.unlockAsync();
  }
}

export function useWaflRuntimeOrientationPolicy(deviceClass: WaflMobileDeviceClass) {
  const action = resolveWaflRuntimeOrientationAction(deviceClass);

  useEffect(() => {
    if (action === "none") {
      return;
    }

    const coordinator = createWaflRuntimeOrientationCoordinator({
      action,
      initialAppState: AppState.currentState,
      apply: async (nextAction) => {
        try {
          await applyWaflRuntimeOrientationAction(nextAction);
        } catch (error) {
          if (__DEV__) {
            console.warn("WAFL runtime orientation policy could not be applied.", error);
          }
        }
      },
    });

    void coordinator.start();
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      void coordinator.handleAppStateChange(nextAppState);
    });

    return () => {
      coordinator.dispose();
      subscription.remove();
    };
  }, [action]);
}
