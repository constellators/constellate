const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')

const terminal = require('constellate-utils/terminal')

const generateConfig = require('./generateConfig')
const extractError = require('./extractError')

// :: (Project, Options) -> Promise<WebpackDevServer, Error>
module.exports = function startDevServer(project, { port }) {
  return new Promise((resolve, reject) => {
    const config = generateConfig(project, { development: true, devServerPort: port })
    const compiler = webpack(config, (err, stats) => {
      const error = extractError(project, err, stats)
      if (error) {
        // We don't pass through the terminal as we want to maintain color.
        reject(error)
      } else {
        const server = new WebpackDevServer(compiler, config.devServer)

        server.listen(port, '0.0.0.0', () => {
          terminal.verbose(`${project.name} listening on http://0.0.0.0:${port}`)
        })

        resolve(server)
      }
    })
  })
}
