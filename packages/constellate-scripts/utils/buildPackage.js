const globby = require('globby')
const babelTranspile = require('constellate-babel/transpile')

// :: string -> Array<string>
const getJsFilePaths = rootPath => globby(['**/*.js', '!__tests__', '!test.js'], { cwd: rootPath })

// :: PackageInfo -> Promise<Any>
const webpackBundle = packageInfo =>
  new Promise((resolve) => {
    console.log('Webpack bundling', packageInfo.name)
    resolve()
  })

// :: PackageInfo -> Promise<Any>
module.exports = function buildPackage(packageInfo) {
  switch (packageInfo.type) {
    case 'browser':
      return webpackBundle(packageInfo)
    // DEFAULT: BABEL
    default:
      return getJsFilePaths(packageInfo.paths.modules).then(jsFiles =>
        babelTranspile(packageInfo.paths.modules, jsFiles, packageInfo.paths.dist)
      )
  }
}
