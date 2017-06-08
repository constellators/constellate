const webpack = require('webpack')
const generateConfig = require('./generateConfig')

// :: Options -> Promise<Compiler, Error>
module.exports = function createCompiler(project) {
  return new Promise((resolve, reject) => {
    const config = generateConfig(project)
    try {
      const compiler = webpack(config)
      resolve(compiler)
    } catch (err) {
      reject(err)
    }
  })
}
