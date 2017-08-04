//      

                                       

const ChildProcessUtils = require('../childProcess')

module.exports = function installDeps(project         )       {
  ChildProcessUtils.execSync('npm', ['install'], { cwd: project.paths.root })
}
