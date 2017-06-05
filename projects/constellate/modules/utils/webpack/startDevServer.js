const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const { throttle } = require('constellate-dev-utils/modules/fns')
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
      TerminalUtils.verbose(`${project.name} listening on http://0.0.0.0:${port}`)
    })

    TerminalUtils.info(`Building ${project.name}`)

    compiler.plugin(
      'done',
      throttle(500, (doneStats) => {
        const doneError = extractError(project, null, doneStats)
        if (doneError) {
          TerminalUtils.error(`Please fix the following issue on ${project.name}`, doneError)
        } else {
          TerminalUtils.verbose(`Built ${project.name}`)
        }
        if (!hasResolved) {
          if (doneError) {
            reject(doneError)
          } else {
            resolve(server)
          }
        }
      }),
    )
  })
}
