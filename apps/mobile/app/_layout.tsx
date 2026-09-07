import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { Dimensions, Platform } from "react-native";

import { WaflRuntimeOrientationPolicyProvider } from "@/application/useWaflRuntimeOrientationPolicy";
import { A2Z_FONT_ASSETS } from "@/constants/fonts";
import {
  resolveWaflMobileDeviceClass,
  resolveWaflRootStackOrientation,
} from "@/domain/mobileOrientationPolicy";

const initialScreen = Dimensions.get("screen");
const mobileDeviceInput = {
  platform: Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web" ? Platform.OS : "other",
  isPad: Platform.OS === "ios" && Platform.isPad,
  screenWidth: initialScreen.width,
  screenHeight: initialScreen.height,
} as const;
const mobileDeviceClass = resolveWaflMobileDeviceClass(mobileDeviceInput);
const rootStackOrientation = resolveWaflRootStackOrientation(mobileDeviceInput);

export default function RootLayout() {
  const [fontsLoaded] = useFonts(A2Z_FONT_ASSETS);

  return (
    <WaflRuntimeOrientationPolicyProvider deviceClass={mobileDeviceClass}>
      {fontsLoaded ? (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#f3eee4" },
            orientation: rootStackOrientation,
          }}
        />
      ) : null}
    </WaflRuntimeOrientationPolicyProvider>
  );
}
