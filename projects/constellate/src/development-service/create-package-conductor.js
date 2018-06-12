const { TerminalUtils } = require('constellate-dev-utils')

module.exports = function createPackageConductor(pkg, watcher) {
  let runningDevelopInstance

  return {
    // :: void -> Promise
    start: () => {
      TerminalUtils.verbose(`Starting develop implementation for ${pkg.name}`)

      if (!pkg.plugins.developPlugin) {
        throw new Error(
          `Trying to run develop plugin on package without one specified: ${
            pkg.name
          }`,
        )
      }

      return pkg.plugins.developPlugin
        .develop(watcher)
        .then(developInstance => {
          runningDevelopInstance = developInstance
        })
    },

    // :: void -> Promise
    stop: () =>
      runningDevelopInstance
        ? runningDevelopInstance.kill()
        : Promise.resolve(),
  }
}
