const path = require('path')
const R = require('ramda')
const dedent = require('dedent')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')

const executeCompile = (project) => {
  const compiler = project.config.compiler

  // Raw
  if (compiler === 'none' || R.isEmpty(compiler) || R.isNil(compiler)) {
    TerminalUtils.verbose(`Not compiling ${project.name}`)
    return Promise.resolve()
  }

  const pluginName = `constellate-plugin-compiler-${compiler}`
  const pluginPath = path.resolve(process.cwd(), `./node_modules/${pluginName}`)
  let compilerPlugin

  console.log('PATH', pluginPath)
  try {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    compilerPlugin = require(pluginPath)
  } catch (err) {
    console.log(err)
    throw new Error(
      dedent(
        `Could not resolve "${compiler}" for ${project.name}. Make sure you have the plugin installed:
          npm install ${pluginName}`,
      ),
    )
  }

  TerminalUtils.verbose(`Compiling ${project.name}`)
  return compilerPlugin.compile(project)
}

// :: Project -> Promise<BuildResult>
module.exports = function compileProject(project) {
  TerminalUtils.info(`Building ${project.name}...`)
  return executeCompile(project)
    .then(() => {
      TerminalUtils.verbose(`Built ${project.name}`)
    })
    .catch((err) => {
      TerminalUtils.error(`Build failed for ${project.name}`)
      throw err
    })
}
