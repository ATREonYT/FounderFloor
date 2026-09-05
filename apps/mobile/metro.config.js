// Metro must see the kit and the shared package, which live two levels up
// and are imported as plain TS source (no build step, no publish).
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

config.watchFolders = [path.join(monorepoRoot, "packages")];
config.resolver.nodeModulesPaths = [path.join(projectRoot, "node_modules")];
config.resolver.extraNodeModules = {
  "@founderfloor/ui": path.join(monorepoRoot, "packages/ui/src"),
  "@founderfloor/shared": path.join(monorepoRoot, "packages/shared/src"),
};
// packages/* import react, react-native, expo-image, reanimated, svg from
// the app's node_modules — there is only one copy, here.
config.resolver.disableHierarchicalLookup = true;
module.exports = config;
