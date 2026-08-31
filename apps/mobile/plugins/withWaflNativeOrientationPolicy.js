/* eslint-disable @typescript-eslint/no-require-imports -- Expo config plugins run as CommonJS during prebuild. */
const { createRunOncePlugin, withInfoPlist, withMainActivity } = require("expo/config-plugins");
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
  "1.0.0",
);

module.exports.IOS_PHONE_ORIENTATIONS = IOS_PHONE_ORIENTATIONS;
module.exports.IOS_TABLET_ORIENTATIONS = IOS_TABLET_ORIENTATIONS;
module.exports.applyWaflAndroidStartupOrientationPolicy = applyWaflAndroidStartupOrientationPolicy;
module.exports.applyWaflIosOrientationPolicy = applyWaflIosOrientationPolicy;
module.exports.resolveWaflAndroidNativeOrientationAction = resolveWaflAndroidNativeOrientationAction;
