const createCompiler = require('./createCompiler')
const extractError = require('./extractError')

// :: Options -> Promise<Compiler, Error>
module.exports = function bundle(pkg, options) {
  return createCompiler(pkg, options).then(
    compiler =>
      new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
          const error = extractError(pkg, err, stats)
          if (error) {
            reject(error)
          } else {
            resolve(compiler)
          }
        })
      }),
  )
}
