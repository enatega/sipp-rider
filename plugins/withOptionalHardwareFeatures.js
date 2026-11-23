const { withAndroidManifest } = require('expo/config-plugins');

// Google Play treats some hardware features as required even though nothing declares them, and hides the app from
// devices without them:
// - android.hardware.screen.portrait comes from the portrait-only orientation (app.config.js `orientation`).
// - android.hardware.wifi comes from the ACCESS_WIFI_STATE permission that @react-native-community/netinfo merges in.
// Neither is essential: the app still runs in portrait and checks the network the same way. Declaring them with
// required="false" keeps Play from excluding devices that lack them (TVs, car displays, devices without Wi-Fi).
const OPTIONAL_FEATURES = ['android.hardware.screen.portrait', 'android.hardware.wifi'];

/** Edits the parsed AndroidManifest in place. Exported so it can be tested without a build. */
function applyOptionalFeatures(manifest, features = OPTIONAL_FEATURES) {
  manifest['uses-feature'] ??= [];
  for (const name of features) {
    const existing = manifest['uses-feature'].find((item) => item.$['android:name'] === name);
    if (existing) existing.$['android:required'] = 'false';
    else manifest['uses-feature'].push({ $: { 'android:name': name, 'android:required': 'false' } });
  }
  return manifest;
}

/** `extraFeatures` adds app-specific features, e.g. the camera ones the CAMERA permission makes Play require. */
module.exports = function withOptionalHardwareFeatures(config, { extraFeatures = [] } = {}) {
  return withAndroidManifest(config, (result) => {
    applyOptionalFeatures(result.modResults.manifest, [...OPTIONAL_FEATURES, ...extraFeatures]);
    return result;
  });
};
module.exports.applyOptionalFeatures = applyOptionalFeatures;
module.exports.OPTIONAL_FEATURES = OPTIONAL_FEATURES;
