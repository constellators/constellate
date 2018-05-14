// @flow

import type { Project } from '../types'

const GitUtils = require('../git')

module.exports = function hasUncommittedChanges(project: Project): boolean {
  const uncommitedFiles = GitUtils.uncommittedChangesIn(project.paths.root)
  return uncommitedFiles.length > 0
}
