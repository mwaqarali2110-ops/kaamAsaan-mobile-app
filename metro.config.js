const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.cacheVersion = 'kaamasaan-mobile-android-cta-refresh-20260713';

module.exports = withNativeWind(config, { input: './global.css' });
