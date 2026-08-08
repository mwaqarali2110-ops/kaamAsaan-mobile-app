const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', '.expo/**', '.tmp-package-engine-test/**'],
    // React Native Animated values are intentionally read while composing
    // styles, and this established screen still uses controlled state effects.
    // These React Compiler diagnostics are not actionable runtime lint rules
    // for the current Expo architecture.
    rules: {
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // Reanimated SharedValue.value assignment is its documented animation API.
      'react-hooks/immutability': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
]);
