const createCompiler = require('./createCompiler')
const extractError = require('./extractError')

// :: Options -> Promise<Compiler, Error>
module.exports = function bundle(package, options) {
  return createCompiler(package, options).then(
    compiler =>
      new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
          const error = extractError(package, err, stats)
          if (error) {
            reject(error)
          } else {
            resolve(compiler)
          }
        })
      }),
  )
}
