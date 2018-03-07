const ProjectUtils = require('../../projects')
const TerminalUtils = require('../../terminal')

// :: (Project, DevelopOptions, Watcher) -> DevelopAPI
module.exports = function buildDevelopPlugin(project) {
  return {
    clean: () => {
      TerminalUtils.error('"clean" not supported by "build" plugin')
      process.exit(1)
    },
    build: () => {
      TerminalUtils.error('"build" not supported by "build" plugin')
      process.exit(1)
    },
    develop: () =>
      ProjectUtils.buildProject(project)
        // we ensure that nothing is returned as we won't be resolving a
        // develop instance with kill cmd etc
        .then(() => undefined),
    deploy: () => {
      TerminalUtils.error('"deploy" not supported by "build" plugin')
      process.exit(1)
    },
  }
}
