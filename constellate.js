module.exports = {
  publishing: {
    npm: {
      enabled: true,
    },
  },
  projects: {
    'babel-plugin-inject-source-map-init': {
      // no config
    },
    constellate: {
      dependencies: ['constellate-dev-utils'],
    },
    'constellate-dev-utils': {
      // no config
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
    'constellate-plugin-develop-webpack': {
      dependencies: [
        'constellate-plugin-compiler-webpack',
        'constellate-dev-utils-webpack',
        'constellate-dev-utils',
      ],
    },
    'constellate-utils': {
      compiler: 'babel',
      compilerOptions: {
        nodeVersion: '4.8.3',
      },
    },
    'create-constellate-app': {
      // no config
    },
    'eslint-config-constellate': {
      // no config
    },
  },
}
