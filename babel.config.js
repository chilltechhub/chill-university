module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Every Text / TextInput in the app follows Settings → Accessibility
    // (text size, bold text, easy-read font). See the plugin's header.
    plugins: ['./scripts/babel-plugin-app-text'],
  };
};
