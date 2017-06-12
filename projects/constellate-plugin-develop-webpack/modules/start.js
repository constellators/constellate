const createDevServer = require('./createDevServer')

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

module.exports = function start(project, watcher) {
  const devInstance = devInstanceMap[project.name]
  if (devInstance) {
    return Promise.resolve(devInstance.api)
  }

  return createDevServer(project)
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
