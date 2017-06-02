const createCompiler = require('./createCompiler')
const extractError = require('./extractError')

// :: Options -> Promise<Compiler, Error>
module.exports = function bundle(project, options) {
  return createCompiler(project, options).then(
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
      })
  )
}
