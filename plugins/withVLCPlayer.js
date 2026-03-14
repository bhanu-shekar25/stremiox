const { withAppBuildGradle, withPodfile } = require('@expo/config-plugins');

const withVLCPlayer = (config) => {
  // Android: ensure minSdkVersion >= 21 (required by libVLC)
  config = withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = mod.modResults.contents.replace(
      /minSdkVersion\s*=\s*\d+/,
      'minSdkVersion = 21'
    );
    return mod;
  });

  // iOS: disable bitcode (VLC prebuilt frameworks are not bitcode-compatible)
  config = withPodfile(config, (mod) => {
    if (!mod.modResults.contents.includes('ENABLE_BITCODE')) {
      mod.modResults.contents += `
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['ENABLE_BITCODE'] = 'NO'
    end
  end
end`;
    }
    return mod;
  });

  return config;
};

module.exports = withVLCPlayer; 
