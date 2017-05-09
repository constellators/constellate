const buildAllPackages = require('../utils/buildAllPackages')

buildAllPackages().then(() => console.log('Build complete')).catch(err => console.error(err))
