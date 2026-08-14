const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Bump when a dependency/config change requires invalidating the Metro cache.
config.cacheVersion = 'kaamasaan-mobile-contracts-in-repo-20260811';

module.exports = withNativeWind(config, { input: './global.css' });
