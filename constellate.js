module.exports = {
  projects: {
    constellate: {
      compiler: 'babel',
      dependencies: ['constellate-dev-utils', 'eslint-config-constellate'],
    },
    'constellate-dev-utils': {
      compiler: 'babel',
    },
    'create-constellate-app': {
      compiler: 'babel',
    },
    'eslint-config-constellate': {
      compiler: 'babel',
    },
  },
}
