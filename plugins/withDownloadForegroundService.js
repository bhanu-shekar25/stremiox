const { withAndroidManifest } = require('@expo/config-plugins');

const withDownloadForegroundService = (config) => {
  return withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application[0];
    if (!app.service) app.service = [];
    app.service.push({
      $: {
        'android:name': '.DownloadForegroundService',
        'android:foregroundServiceType': 'dataSync',
        'android:exported': 'false',
      },
    });
    return mod;
  });
};

module.exports = withDownloadForegroundService; 
