const TerminalUtils = require('../../terminal')
const develop = require('./develop')

// :: (Package, DevelopOptions, Watcher) -> DevelopAPI
module.exports = function serverPlugin(pkg, options) {
  if (!pkg.packageJson.main) {
    TerminalUtils.error(
      `You must provide a "main" within your package.json when using the "server" develop plugin. See the configuration for ${
        pkg.name
      }`,
    )
    process.exit(1)
  }

  return {
    name: 'constellate-core-plugin/sever',
    build: () => {
      TerminalUtils.error('"build" not supported by "server" plugin')
      process.exit(1)
    },
    clean: () => {
      TerminalUtils.error('"clean" not supported by "server" plugin')
      process.exit(1)
    },
    develop: watcher => develop(pkg, options, watcher),
    deploy: () => {
      TerminalUtils.error('"deploy" not supported by "server" plugin')
      process.exit(1)
    },
  }
}
