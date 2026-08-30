import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { Dimensions, Platform } from "react-native";

import { useWaflRuntimeOrientationPolicy } from "@/application/useWaflRuntimeOrientationPolicy";
import { A2Z_FONT_ASSETS } from "@/constants/fonts";
import { resolveWaflMobileDeviceClass } from "@/domain/mobileOrientationPolicy";

const initialScreen = Dimensions.get("screen");
const mobileDeviceClass = resolveWaflMobileDeviceClass({
  platform: Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web" ? Platform.OS : "other",
  isPad: Platform.OS === "ios" && Platform.isPad,
  screenWidth: initialScreen.width,
  screenHeight: initialScreen.height,
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts(A2Z_FONT_ASSETS);
  useWaflRuntimeOrientationPolicy(mobileDeviceClass);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#f3eee4" },
      }}
    />
  );
}
