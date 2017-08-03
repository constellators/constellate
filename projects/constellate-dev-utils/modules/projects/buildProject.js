//      

                                       

const TerminalUtils = require('../terminal')

                
                  
 

const defaultOptions = { quiet: false }

const executeBuild = (project) => {
  TerminalUtils.verbose(`Building ${project.name}`)
  return project.plugins.buildPlugin ? project.plugins.buildPlugin.build() : Promise.resolve()
}

module.exports = async function buildProject(
  project         ,
  options           = {},
)                {
  const { quiet } = Object.assign({}, defaultOptions, options)
  TerminalUtils[quiet ? 'verbose' : 'info'](`Building ${project.name}...`)

  try {
    await executeBuild(project)
    TerminalUtils.verbose(`Built ${project.name}`)
  } catch (err) {
    TerminalUtils.error(`Build failed for ${project.name}`)
    throw err
  }
}
