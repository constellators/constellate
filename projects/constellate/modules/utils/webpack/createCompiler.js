const webpack = require('webpack')

const generateConfig = require('./generateConfig')

// :: Options -> Promise<Compiler, Error>
module.exports = function createCompiler(project, options) {
  return new Promise((resolve, reject) => {
    const config = generateConfig(project, options)
    try {
      const compiler = webpack(config)
      resolve(compiler)
    } catch (err) {
      reject(err)
    }
  })
}
