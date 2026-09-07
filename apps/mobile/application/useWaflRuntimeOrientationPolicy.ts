import * as ScreenOrientation from "expo-screen-orientation";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import {
  resolveWaflRuntimeOrientationAction,
  type WaflMobileDeviceClass,
  type WaflRuntimeOrientationAction,
  type WaflRuntimeOrientationScope,
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

export function useWaflRuntimeOrientationPolicy(
  deviceClass: WaflMobileDeviceClass,
  scope: WaflRuntimeOrientationScope = "base",
) {
  const action = resolveWaflRuntimeOrientationAction(deviceClass, scope);
  const [coordinator] = useState(() => createWaflRuntimeOrientationCoordinator({
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
  }));

  useEffect(() => {
    void coordinator.start();
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      void coordinator.handleAppStateChange(nextAppState);
    });

    return () => {
      coordinator.dispose();
      subscription.remove();
    };
  }, [coordinator]);

  useEffect(() => {
    void coordinator.updateAction(action);
  }, [action, coordinator]);
}

type RegisterPortraitOnlyScope = () => () => void;

const WaflPortraitOnlyScopeContext = createContext<RegisterPortraitOnlyScope | null>(null);
const WaflMobileDeviceClassContext = createContext<WaflMobileDeviceClass>("other");

export function WaflRuntimeOrientationPolicyProvider(props: Readonly<{
  children: ReactNode;
  deviceClass: WaflMobileDeviceClass;
}>) {
  const [activeScopeCount, setActiveScopeCount] = useState(0);
  const registerPortraitOnlyScope = useCallback<RegisterPortraitOnlyScope>(() => {
    let active = true;
    setActiveScopeCount((current) => current + 1);
    return () => {
      if (!active) return;
      active = false;
      setActiveScopeCount((current) => Math.max(0, current - 1));
    };
  }, []);
  const scope = activeScopeCount > 0 ? "product-sketch" : "base";
  const contextValue = useMemo(() => registerPortraitOnlyScope, [registerPortraitOnlyScope]);
  useWaflRuntimeOrientationPolicy(props.deviceClass, scope);

  return createElement(
    WaflMobileDeviceClassContext.Provider,
    { value: props.deviceClass },
    createElement(WaflPortraitOnlyScopeContext.Provider, { value: contextValue }, props.children),
  );
}

export function useWaflMobileDeviceClass() {
  return useContext(WaflMobileDeviceClassContext);
}

export function useWaflProductSketchOrientationPolicy(active: boolean) {
  const registerPortraitOnlyScope = useContext(WaflPortraitOnlyScopeContext);
  useEffect(() => {
    if (!active || !registerPortraitOnlyScope) return;
    return registerPortraitOnlyScope();
  }, [active, registerPortraitOnlyScope]);
}
