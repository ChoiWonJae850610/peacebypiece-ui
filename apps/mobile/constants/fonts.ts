import a2zBlack from "../assets/fonts/a2z/A2Z-Black.ttf";
import a2zBold from "../assets/fonts/a2z/A2Z-Bold.ttf";
import a2zExtraBold from "../assets/fonts/a2z/A2Z-ExtraBold.ttf";
import a2zExtraLight from "../assets/fonts/a2z/A2Z-ExtraLight.ttf";
import a2zLight from "../assets/fonts/a2z/A2Z-Light.ttf";
import a2zMedium from "../assets/fonts/a2z/A2Z-Medium.ttf";
import a2zRegular from "../assets/fonts/a2z/A2Z-Regular.ttf";
import a2zSemiBold from "../assets/fonts/a2z/A2Z-SemiBold.ttf";
import a2zThin from "../assets/fonts/a2z/A2Z-Thin.ttf";

export const WAFL_FONTS = {
  thin: "A2Z-Thin",
  extraLight: "A2Z-ExtraLight",
  light: "A2Z-Light",
  regular: "A2Z-Regular",
  medium: "A2Z-Medium",
  semibold: "A2Z-SemiBold",
  bold: "A2Z-Bold",
  extraBold: "A2Z-ExtraBold",
  black: "A2Z-Black",
  body: "A2Z-Regular"
} as const;

export const A2Z_FONT_ASSETS = {
  [WAFL_FONTS.thin]: a2zThin,
  [WAFL_FONTS.extraLight]: a2zExtraLight,
  [WAFL_FONTS.light]: a2zLight,
  [WAFL_FONTS.regular]: a2zRegular,
  [WAFL_FONTS.medium]: a2zMedium,
  [WAFL_FONTS.semibold]: a2zSemiBold,
  [WAFL_FONTS.bold]: a2zBold,
  [WAFL_FONTS.extraBold]: a2zExtraBold,
  [WAFL_FONTS.black]: a2zBlack
};
