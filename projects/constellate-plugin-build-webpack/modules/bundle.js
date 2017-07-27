const extractError = require('constellate-dev-utils-webpack/modules/extractError')
const createCompiler = require('./createCompiler')

// :: Options -> Promise<Compiler, Error>
module.exports = function bundle(project) {
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
