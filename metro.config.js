const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, '../backend-development/supabase/contracts'),
];

config.cacheVersion = 'kaamasaan-mobile-promo-system-20260725';

module.exports = withNativeWind(config, { input: './global.css' });
