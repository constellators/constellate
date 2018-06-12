const webpack = require('webpack')
const generateConfig = require('./generateConfig')

// :: Options -> Promise<Compiler, Error>
module.exports = function createCompiler(package, options) {
  return new Promise((resolve, reject) => {
    const config = generateConfig(package, options)
    try {
      const compiler = webpack(config)
      resolve(compiler)
    } catch (err) {
      reject(err)
    }
  })
}
