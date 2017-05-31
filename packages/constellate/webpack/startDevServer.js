const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const terminal = require('constellate-dev-utils/terminal')
const throttle = require('constellate-dev-utils/fns/throttle')
const generateConfig = require('./generateConfig')
const extractError = require('./extractError')

// :: (Project, Options) -> Promise<WebpackDevServer, Error>
module.exports = function startDevServer(project, { port }) {
  return new Promise((resolve, reject) => {
    const hasResolved = false

    const config = generateConfig(project, { development: true, devServerPort: port })
    const compiler = webpack(config)
    const server = new WebpackDevServer(compiler, config.devServer)
    server.listen(port, '0.0.0.0', () => {
      terminal.verbose(`${project.name} listening on http://0.0.0.0:${port}`)
    })

    terminal.info(`Building ${project.name}`)

    compiler.plugin(
      'done',
      throttle(500, (doneStats) => {
        const doneError = extractError(project, null, doneStats)
        if (doneError) {
          terminal.error(`Error! Please fix the following issue with ${project.name}`, doneError)
        } else {
          terminal.verbose(`Built ${project.name}`)
        }
        if (!hasResolved) {
          if (doneError) {
            reject(doneError)
          } else {
            resolve(server)
          }
        }
      })
    )
  })
}
