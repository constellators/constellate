// @flow

import type { Project } from '../types'

const ChildProcessUtils = require('../childProcess')

module.exports = function installDeps(project: Project): void {
  ChildProcessUtils.execSync('npm', ['install'], { cwd: project.paths.root })
}
