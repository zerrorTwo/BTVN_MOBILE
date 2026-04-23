const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Deduplicate React — forces moti/framer-motion to use the root React copy
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...config.resolve.alias,
    react: path.resolve(__dirname, 'node_modules/react'),
    'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    'react-native': path.resolve(__dirname, 'node_modules/react-native'),
  };

  return config;
};
