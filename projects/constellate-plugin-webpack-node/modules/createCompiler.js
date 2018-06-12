const webpack = require('webpack')
const generateConfig = require('./generateConfig')

// :: Options -> Promise<Compiler, Error>
module.exports = function createCompiler(pkg, options) {
  return new Promise((resolve, reject) => {
    const config = generateConfig(pkg, options)
    try {
      const compiler = webpack(config)
      resolve(compiler)
    } catch (err) {
      reject(err)
    }
  })
}
