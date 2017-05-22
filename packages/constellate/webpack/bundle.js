const webpack = require('webpack')

const generateConfig = require('./generateConfig')
const extractError = require('./extractError')

// :: Options -> Promise<void>
module.exports = function bundle(options) {
  return new Promise((resolve, reject) => {
    const { project } = options

    const config = generateConfig(project)
    const compiler = webpack(config)
    compiler.run((err, stats) => {
      const error = extractError(project, err, stats)
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
