const flowProjectConfig = {
  build: [
    'flow',
    {
      sourceDir: './src',
      outputDir: './build',
    },
  ],
}

const packagesConfig = {
  constellate: flowProjectConfig,
  'constellate-dev-utils': flowProjectConfig,
  'constellate-utils': {
    build: [
      'babel',
      {
        nodeVersion: '4.8.3',
        sourceDir: './src',
        outputDir: './build',
      },
    ],
  },
}

module.exports = {
  packages: ['projects/*'],
  projects: packagesConfig,

  // packageSources: ['projects/*'],
  // packages: packagesConfig,
}
