const TerminalUtils = require('../terminal')

const defaultOptions = { quiet: false }

const executeBuild = (project) => {
  TerminalUtils.verbose(`Building ${project.name}`)
  return project.buildPlugin(project, project.buildPluginOptions).build()
}

// :: Project -> Promise<BuildResult>
module.exports = function buildProject(project, options = defaultOptions) {
  const { quiet } = Object.assign({}, defaultOptions, options)
  TerminalUtils[quiet ? 'verbose' : 'info'](`Building ${project.name}...`)

  return executeBuild(project)
    .then(() => {
      TerminalUtils.verbose(`Built ${project.name}`)
    })
    .catch((err) => {
      TerminalUtils.error(`Build failed for ${project.name}`)
      throw err
    })
}
