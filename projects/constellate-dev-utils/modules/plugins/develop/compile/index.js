const ProjectUtils = require('../../../projects')

// console.log('POOP', compileProject)

// :: (Project, DevelopOptions, Watcher) -> DevelopAPI
module.exports = function compileDevelop(project, options, watcher) {
  return {
    start: () => {
      console.log('Poop', ProjectUtils)
      return (
        ProjectUtils.compileProject(project)
          // we ensure that nothing is returned as we won't be resolving a
          // develop instance with kill cmd etc
          .then(() => undefined)
      )
    },
  }
}
