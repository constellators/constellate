const TerminalUtils = require('../../terminal')
const develop = require('./develop')

// :: (Project, DevelopOptions, Watcher) -> DevelopAPI
module.exports = function serverDevelop(project, options) {
  if (!project.packageJson.main) {
    TerminalUtils.error(
      `You must provide a "main" within your package.json when using the "server" develop plugin. See the configuration for ${
        project.name
      }`,
    )
    process.exit(1)
  }

  return {
    build: () => {
      TerminalUtils.error('"build" not supported by "server" plugin')
      process.exit(1)
    },
    clean: () => {
      TerminalUtils.error('"clean" not supported by "server" plugin')
      process.exit(1)
    },
    develop: watcher => develop(project, options, watcher),
    deploy: () => {
      TerminalUtils.error('"deploy" not supported by "server" plugin')
      process.exit(1)
    },
  }
}
