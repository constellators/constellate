const transpile = require('constellate-babel/transpile')
const bundle = require('constellate-webpack/bundle')

// :: PackageInfo -> Promise<Any>
module.exports = function buildPackage({ packageInfo }) {
  switch (packageInfo.target) {
    case 'browser':
      return bundle({ packageInfo })
    // DEFAULT: BABEL
    default:
      return transpile({ packageInfo })
  }
}
