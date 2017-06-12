const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const linkProject = require('./linkProject')

const executeCompile = (project) => {
  TerminalUtils.verbose(`Compiling ${project.name}`)
  return project.compilerPlugin(project).compile(project)
}

// :: Project -> Promise<BuildResult>
module.exports = function compileProject(project) {
  TerminalUtils.info(`Building ${project.name}...`)

  // Ensure all the links exist for the project.
  linkProject(project)

  return executeCompile(project)
    .then(() => {
      TerminalUtils.verbose(`Built ${project.name}`)
    })
    .catch((err) => {
      TerminalUtils.error(`Build failed for ${project.name}`)
      throw err
    })
}
