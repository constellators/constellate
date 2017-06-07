const path = require('path')
const dedent = require('dedent')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const linkProject = require('./linkProject')

const executeCompile = (project) => {
  if (project.noCompiler) {
    TerminalUtils.verbose(`Not compiling ${project.name} as no compiler specified`)
    return Promise.resolve()
  }

  const compiler = project.config.compiler
  const pluginName = `constellate-plugin-compiler-${compiler}`
  const pluginPath = path.resolve(process.cwd(), `./node_modules/${pluginName}`)
  let plugin

  try {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    plugin = require(pluginPath)
  } catch (err) {
    throw new Error(
      dedent(
        `Could not resolve "${compiler}" for ${project.name}. Make sure you have the plugin installed:
          npm install ${pluginName}`,
      ),
    )
  }

  TerminalUtils.verbose(`Compiling ${project.name}`)
  return plugin.compile(project)
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
