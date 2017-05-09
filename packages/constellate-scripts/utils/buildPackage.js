const fs = require('fs-extra')
const transpile = require('constellate-babel/transpile')
const bundle = require('constellate-webpack/bundle')

// :: PackageInfo -> Promise<Any>
module.exports = function buildPackage({ packageInfo }) {
  if (fs.existsSync(packageInfo.paths.dist)) {
    fs.removeSync(packageInfo.paths.dist)
  }

  switch (packageInfo.target) {
    case 'browser':
      return bundle({ packageInfo })
    // DEFAULT: BABEL
    default:
      return transpile({ packageInfo })
  }
}
