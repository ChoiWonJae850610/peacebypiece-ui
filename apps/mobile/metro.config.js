/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const repositoryRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

// Node contracts, Next routes, and React Native execute the same alias-free
// pure domain policy owners from the repository root.
config.watchFolders = Array.from(new Set([...(config.watchFolders ?? []), repositoryRoot]));

module.exports = config;
