const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .sql to the list of asset extensions so Metro bundles migration files
config.resolver.assetExts.push('sql');

module.exports = config; 
