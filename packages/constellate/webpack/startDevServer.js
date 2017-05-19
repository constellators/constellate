const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')

const terminal = require('constellate-utils/terminal')

const generateConfig = require('./generateConfig')
const extractError = require('./extractError')

// TODO: Need more thought process on the initial compiler error.
// TODO: Wrap the result into something like { success: true, server }
// :: Options -> Server
module.exports = function startDevServer(project) {
  const config = generateConfig({ project, development: true })
  const compiler = webpack(config, (err, stats) => {
    const error = extractError(project, err, stats)
    if (error) {
      // We don't pass through the terminal as we want to maintain color.
      console.log(error)
    }
  })

  const server = new WebpackDevServer(compiler, config.devServer)

  const port = project.config.browser.develop.port
  server.listen(port, '0.0.0.0', () => {
    terminal.info(`${project.name} listening on http://0.0.0.0:${port}`)
  })

  return server
}
