const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const terminal = require('constellate-utils/terminal')
const throttle = require('constellate-utils/fns/throttle')
const generateConfig = require('./generateConfig')
const extractError = require('./extractError')

// :: (Project, Options) -> Promise<WebpackDevServer, Error>
module.exports = function startDevServer(project, { port }) {
  return new Promise((resolve, reject) => {
    const config = generateConfig(project, { development: true, devServerPort: port })
    const compiler = webpack(config, (err, stats) => {
      const error = extractError(project, err, stats)
      if (error) {
        // Failed
        reject(error)
      } else {
        // Success
        const server = new WebpackDevServer(compiler, config.devServer)
        server.listen(port, '0.0.0.0', () => {
          terminal.verbose(`${project.name} listening on http://0.0.0.0:${port}`)
        })
        terminal.success(`Built ${project.name}`)
        let showNextSuccess = false
        compiler.plugin(
          'done',
          throttle(500, (doneStats) => {
            const doneError = extractError(project, null, doneStats)
            if (doneError) {
              // Failed
              terminal.error(
                `Error! Please fix the following issue with ${project.name}`,
                doneError
              )
              showNextSuccess = true
            } else if (showNextSuccess) {
              terminal.success(`Built ${project.name}`)
              showNextSuccess = false
            }
          })
        )
        resolve(server)
      }
    })
  })
}
