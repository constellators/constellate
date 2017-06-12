const webpack = require('webpack')
const getPort = require('get-port')
const WebpackDevServer = require('webpack-dev-server')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const { throttle } = require('constellate-dev-utils/modules/fns')
const extractError = require('constellate-dev-utils-webpack/modules/extractError')
const linkBundledDependencies = require('constellate-dev-utils-webpack/modules/linkBundledDependencies')
const generateConfig = require('constellate-plugin-compiler-webpack/modules/generateConfig')

// :: (Project, Options) -> Promise<WebpackDevServer, Error>
module.exports = function createDevServer(project) {
  return getPort().then((port) => {
    TerminalUtils.verbose(`Found free port ${port} for webpack dev server`)
    return new Promise((resolve, reject) => {
      const hasResolved = false

      // We need to make sure symlinking of the bundled dependencies exist so
      // that bundling will happen correctly.
      linkBundledDependencies(project)

      const config = generateConfig(project, { devServerPort: port })
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
  })
}
