import { useFonts } from "expo-font";
import { Stack } from "expo-router";

import { A2Z_FONT_ASSETS } from "@/constants/fonts";

export default function RootLayout() {
  const [fontsLoaded] = useFonts(A2Z_FONT_ASSETS);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#f3eee4" }
      }}
    />
  );
}
