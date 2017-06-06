module.exports = {
  projects: {
    constellate: {
      dependencies: ['constellate-dev-utils', 'eslint-config-constellate'],
    },
    'constellate-plugin-compiler-babel': {
      dependencies: ['babel-plugin-inject-source-map-init', 'constellate-dev-utils'],
    },
    'constellate-plugin-compiler-webpack': {
      dependencies: ['constellate-dev-utils'],
    },
    'constellate-plugin-compiler-webpack-node': {
      dependencies: ['constellate-dev-utils'],
    },
    'constellate-plugin-devserver-webpack': {
      dependencies: ['constellate-dev-utils'],
    },
  },
}
