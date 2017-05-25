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
        // Failed
        reject(error)
      } else {
        // Success
        terminal.success(`Built ${project.name}`)
        const server = new WebpackDevServer(compiler, config.devServer)
        server.listen(port, '0.0.0.0', () => {
          terminal.verbose(`${project.name} listening on http://0.0.0.0:${port}`)
        })
        resolve(server)
      }
    })
  })
}
