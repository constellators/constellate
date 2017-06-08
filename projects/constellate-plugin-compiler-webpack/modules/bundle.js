const extractError = require('constellate-dev-utils-webpack/modules/extractError')
const linkBundledDependencies = require('constellate-dev-utils-webpack/modules/linkBundledDependencies')
const createCompiler = require('./createCompiler')

// :: Options -> Promise<Compiler, Error>
module.exports = function bundle(project) {
  // We need to make sure symlinking of the bundled dependencies exist so
  // that bundling will happen correctly.
  linkBundledDependencies(project)

  return createCompiler(project).then(
    compiler =>
      new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
          const error = extractError(project, err, stats)
          if (error) {
            reject(error)
          } else {
            resolve(compiler)
          }
        })
      }),
  )
}
