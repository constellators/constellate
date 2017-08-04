//      

                                       

const fs = require('fs-extra')
const path = require('path')
const TerminalUtils = require('../terminal')
const getAllProjects = require('./getAllProjects')

module.exports = function linkProject(project         )       {
  const allProjects = getAllProjects()

  // Sym link each of the project's dependencies into the node_modules directory
  // for the project.
  ;[...project.dependencies, ...project.devDependencies].forEach((dependencyName) => {
    const target = path.resolve(
      project.paths.nodeModules,
      `./${allProjects[dependencyName].packageName}`,
    )
    if (fs.existsSync(target)) {
      fs.removeSync(target)
    }
    fs.ensureSymlinkSync(allProjects[dependencyName].paths.root, target)
    TerminalUtils.verbose(`Linked ${dependencyName} to ${project.name}`)
  })
}
