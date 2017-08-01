module.exports = {
  projects: {
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
