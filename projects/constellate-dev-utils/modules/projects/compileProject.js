const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const linkProject = require('./linkProject')

const executeCompile = (project) => {
  if (project.compiler == null) {
    TerminalUtils.verbose(`Not compiling ${project.name} as no compiler specified`)
    return Promise.resolve()
  }

  TerminalUtils.verbose(`Compiling ${project.name}`)
  return project.compiler.compile(project)
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
