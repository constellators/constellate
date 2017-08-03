const flowProjectConfig = {
  build: [
    'flow',
    {
      sourceDir: './src',
      outputDir: './modules',
    },
  ],
}

module.exports = {
  projects: {
    constellate: flowProjectConfig,
    'constellate-dev-utils': flowProjectConfig,
    'constellate-utils': {
      build: [
        'babel',
        {
          nodeVersion: '4.8.3',
          sourceDir: './src',
          outputDir: './modules',
        },
      ],
    },
  },
}
