/* eslint-disable @typescript-eslint/no-require-imports -- Expo config plugins run as CommonJS during prebuild. */
const {
  createRunOncePlugin,
  withAppDelegate,
  withInfoPlist,
  withMainActivity,
} = require("expo/config-plugins");
const { mergeContents } = require("@expo/config-plugins/build/utils/generateCode");

const orientationPolicy = require("../config/waflNativeOrientationPolicy.js");

const IOS_PHONE_ORIENTATIONS = Object.freeze([
  "UIInterfaceOrientationPortrait",
]);

const IOS_TABLET_ORIENTATIONS = Object.freeze([
  "UIInterfaceOrientationPortrait",
  "UIInterfaceOrientationPortraitUpsideDown",
  "UIInterfaceOrientationLandscapeLeft",
  "UIInterfaceOrientationLandscapeRight",
]);

const IOS_APP_DELEGATE_CLASS_ANCHOR = /class AppDelegate:\s*ExpoAppDelegate\s*\{/;

function createWaflIosAppOrientationMaskSource() {
  const threshold = orientationPolicy.iosRegularTabletShortSidePoints;
  return [
    `  private static let waflRegularTabletShortSidePoints: CGFloat = ${threshold}`,
    "",
    "  override func application(",
    "    _ application: UIApplication,",
    "    supportedInterfaceOrientationsFor window: UIWindow?",
    "  ) -> UIInterfaceOrientationMask {",
    "    guard UIDevice.current.userInterfaceIdiom == .pad else {",
    "      return .portrait",
    "    }",
    "",
    "    let screenBounds = window?.windowScene?.screen.bounds ?? UIScreen.main.bounds",
    "    let shortSidePoints = min(screenBounds.width, screenBounds.height)",
    "    guard shortSidePoints >= Self.waflRegularTabletShortSidePoints else {",
    "      return .portrait",
    "    }",
    "",
    "    return super.application(",
    "      application,",
    "      supportedInterfaceOrientationsFor: window",
    "    )",
    "  }",
  ].join("\n");
}

function resolveWaflIosNativeOrientationMask(input) {
  if (!input.isPad) return "portrait";
  const shortSide = Math.min(input.screenWidth, input.screenHeight);
  return Number.isFinite(shortSide)
    && shortSide >= orientationPolicy.iosRegularTabletShortSidePoints
    ? "inherited-default"
    : "portrait";
}

function applyWaflIosAppOrientationMask(contents, language) {
  if (language !== "swift") {
    throw new Error(`Unsupported iOS AppDelegate language: ${language}`);
  }
  return mergeContents({
    src: contents,
    newSrc: createWaflIosAppOrientationMaskSource(),
    tag: "wafl-ios-compact-app-orientation-mask",
    anchor: IOS_APP_DELEGATE_CLASS_ANCHOR,
    offset: 1,
    comment: "  //",
  }).contents;
}

function resolveWaflAndroidNativeOrientationAction(smallestScreenWidthDp) {
  return Number.isFinite(smallestScreenWidthDp)
    && smallestScreenWidthDp >= orientationPolicy.androidTabletSmallestWidthDp
    ? "unrestricted-default"
    : "portrait";
}

function applyWaflIosOrientationPolicy(infoPlist) {
  return {
    ...infoPlist,
    UISupportedInterfaceOrientations: [...IOS_PHONE_ORIENTATIONS],
    "UISupportedInterfaceOrientations~ipad": [...IOS_TABLET_ORIENTATIONS],
  };
}

function createAndroidStartupSource(language) {
  const threshold = orientationPolicy.androidTabletSmallestWidthDp;
  if (language === "java") {
    return [
      `    final int waflSmallestScreenWidthDp = getResources().getConfiguration().smallestScreenWidthDp;`,
      `    if (waflSmallestScreenWidthDp < ${threshold}) {`,
      "      setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);",
      "    }",
    ].join("\n");
  }
  if (language === "kt") {
    return [
      "    val waflSmallestScreenWidthDp = resources.configuration.smallestScreenWidthDp",
      `    if (waflSmallestScreenWidthDp < ${threshold}) {`,
      "      requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT",
      "    }",
    ].join("\n");
  }
  throw new Error(`Unsupported Android MainActivity language: ${language}`);
}

function applyWaflAndroidStartupOrientationPolicy(contents, language) {
  const anchor = language === "java"
    ? /protected void onCreate\(Bundle savedInstanceState\) \{/
    : /override fun onCreate\(savedInstanceState: Bundle\?\) \{/;
  return mergeContents({
    src: contents,
    newSrc: createAndroidStartupSource(language),
    tag: "wafl-native-handset-orientation",
    anchor,
    offset: 1,
    comment: "    //",
  }).contents;
}

function withWaflNativeOrientationPolicy(config) {
  config = withAppDelegate(config, (nextConfig) => {
    nextConfig.modResults.contents = applyWaflIosAppOrientationMask(
      nextConfig.modResults.contents,
      nextConfig.modResults.language,
    );
    return nextConfig;
  });

  config = withInfoPlist(config, (nextConfig) => {
    nextConfig.modResults = applyWaflIosOrientationPolicy(nextConfig.modResults);
    return nextConfig;
  });

  config = withMainActivity(config, (nextConfig) => {
    nextConfig.modResults.contents = applyWaflAndroidStartupOrientationPolicy(
      nextConfig.modResults.contents,
      nextConfig.modResults.language,
    );
    return nextConfig;
  });

  return config;
}

module.exports = createRunOncePlugin(
  withWaflNativeOrientationPolicy,
  "wafl-native-orientation-policy",
  "1.1.0",
);

module.exports.IOS_PHONE_ORIENTATIONS = IOS_PHONE_ORIENTATIONS;
module.exports.IOS_TABLET_ORIENTATIONS = IOS_TABLET_ORIENTATIONS;
module.exports.applyWaflAndroidStartupOrientationPolicy = applyWaflAndroidStartupOrientationPolicy;
module.exports.applyWaflIosAppOrientationMask = applyWaflIosAppOrientationMask;
module.exports.applyWaflIosOrientationPolicy = applyWaflIosOrientationPolicy;
module.exports.createWaflIosAppOrientationMaskSource = createWaflIosAppOrientationMaskSource;
module.exports.resolveWaflIosNativeOrientationMask = resolveWaflIosNativeOrientationMask;
module.exports.resolveWaflAndroidNativeOrientationAction = resolveWaflAndroidNativeOrientationAction;
