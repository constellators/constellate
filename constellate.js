module.exports = {
  projects: {
    constellate: {
      dependencies: ['constellate-dev-utils'],
    },
    'constellate-dev-utils-webpack': {
      dependencies: ['constellate-dev-utils'],
    },
    'constellate-plugin-compiler-babel': {
      dependencies: ['babel-plugin-inject-source-map-init', 'constellate-dev-utils'],
    },
    'constellate-plugin-compiler-webpack': {
      dependencies: ['constellate-dev-utils', 'constellate-dev-utils-webpack'],
    },
    'constellate-plugin-compiler-webpack-node': {
      dependencies: ['constellate-dev-utils', 'constellate-dev-utils-webpack'],
    },
    'constellate-utils': {
      compiler: 'babel',
      compilerOptions: {
        nodeVersion: '4.8.3',
      },
    },
  },
}
