const flowProjectConfig = {
  build: 'flow',
}

const packagesConfig = {
  constellate: flowProjectConfig,
  'constellate-dev-utils': flowProjectConfig,
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
  // packages: ['projects/*'],
  // projects: packagesConfig,

  packageSources: ['projects/*'],
  packages: packagesConfig,
}
