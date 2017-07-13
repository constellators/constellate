const ChildProcessUtils = require('constellate-dev-utils/modules/childProcess')

module.exports = function installDeps(project) {
  ChildProcessUtils.execSync('npm', ['install'], { cwd: project.paths.root })
}
