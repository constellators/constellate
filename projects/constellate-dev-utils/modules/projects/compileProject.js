const TerminalUtils = require('../terminal')

const defaultOptions = { quiet: false }

const executeCompile = (project) => {
  TerminalUtils.verbose(`Compiling ${project.name}`)
  return project.compilerPlugin(project).compile()
}

// :: Project -> Promise<BuildResult>
module.exports = function compileProject(project, options = defaultOptions) {
  const { quiet } = Object.assign({}, defaultOptions, options)
  TerminalUtils[quiet ? 'verbose' : 'info'](`Building ${project.name}...`)

  return executeCompile(project)
    .then(() => {
      TerminalUtils.verbose(`Built ${project.name}`)
    })
    .catch((err) => {
      TerminalUtils.error(`Build failed for ${project.name}`)
      throw err
    })
}
