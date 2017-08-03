const webpack = require('webpack')
const getPort = require('get-port')
const WebpackDevServer = require('webpack-dev-server')
const { TerminalUtils } = require('constellate-dev-utils')
const extractError = require('constellate-dev-utils-webpack/modules/extractError')
const generateConfig = require('constellate-plugin-build-webpack/modules/generateConfig')

const devInstanceMap = {}

const killDevServerFor = (project) => {
  const devInstance = devInstanceMap[project.name]
  if (!devInstance) {
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    devInstance.webpackDevServer.close(() => {
      delete devInstanceMap[project.name]
      resolve()
    })
  })
}

module.exports = function start(project, options, watcher) {
  const devInstance = devInstanceMap[project.name]
  if (devInstance) {
    return Promise.resolve(devInstance.api)
  }

  return getPort()
    .then((port) => {
      TerminalUtils.verbose(`Found free port ${port} for webpack dev server`)
      return new Promise((resolve, reject) => {
        let hasResolved = false
        let showNextSuccess = false

        const config = generateConfig(project, Object.assign({}, options, { devServerPort: port }))
        const compiler = webpack(config)

        const server = new WebpackDevServer(compiler, config.devServer)
        server.listen(port, '0.0.0.0', () => {
          TerminalUtils.verbose(`${project.name} listening on http://0.0.0.0:${port}`)
        })

        TerminalUtils.info(`Building ${project.name}`)

        compiler.plugin('done', (doneStats) => {
          const doneError = extractError(project, null, doneStats)
          if (doneError && hasResolved) {
            TerminalUtils.error(`Please fix the following issue on ${project.name}`, doneError)
            showNextSuccess = hasResolved && true
          } else {
            TerminalUtils[showNextSuccess ? 'success' : 'verbose'](`${project.name} is good again`)
            showNextSuccess = false
          }
          if (!hasResolved) {
            // This can only be the first time the plugin has run, and therefore
            // represents the bootstrapping of the web-dev-server. If it failed
            // then we should kill any running web dev server and reject
            // the promise to ensure that no dependencies get run.
            hasResolved = true
            if (doneError) {
              if (server) {
                try {
                  server.close(() => {
                    reject(doneError)
                  })
                } catch (err) {
                  TerminalUtils.verbose('Could not close existing web-dev-server')
                  TerminalUtils.verbose(err)
                  reject(doneError)
                }
              } else {
                reject(doneError)
              }
            } else {
              resolve(server)
            }
          }
        })
      })
    })
    .then((webpackDevServer) => {
      // No need for the watcher now as webpack-dev-server has an inbuilt
      // watcher.
      watcher.stop()
      return webpackDevServer
    })
    .catch((err) => {
      // Ensure we fire up the watcher again so that we can track when the
      // issue is fixed.
      watcher.start()
      // Throw the error along
      throw err
    })
    .then((webpackDevServer) => {
      const api = {
        kill: () => killDevServerFor(project),
      }
      devInstanceMap[project.name] = {
        api,
        webpackDevServer,
      }
      return api
    })
}
