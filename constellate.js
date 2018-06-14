const flowProjectConfig = {
  build: 'flow',
}

const packagesConfig = {
  constellate: flowProjectConfig,
  'constellate-dev-utils': flowProjectConfig,
  'constellate-plugin-babel': flowProjectConfig,
  'constellate-plugin-flow': flowProjectConfig,
  'constellate-plugin-now': flowProjectConfig,
  'constellate-plugin-webpack': flowProjectConfig,
  'constellate-plugin-webpack-node': flowProjectConfig,
  'constellate-utils': {
    build: [
      'babel',
      {
        nodeVersion: '4.8.3',
      },
    ],
  },
}

module.exports = {
  packageSources: ['packages/*'],
  packages: packagesConfig,
}
