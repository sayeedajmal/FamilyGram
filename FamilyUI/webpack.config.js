const { withExpoWebpack } = require('@expo/webpack-config');

module.exports = function(env, argv) {
  return withExpoWebpack(env, argv);
};
