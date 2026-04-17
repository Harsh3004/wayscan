// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add .tflite to the list of asset extensions so Metro bundles ML models.
// Also ensure it's NOT in sourceExts (Metro tries to parse source extensions as JS).
config.resolver.assetExts.push('tflite');
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== 'tflite'
);

module.exports = config;
