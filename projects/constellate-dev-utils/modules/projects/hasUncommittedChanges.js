//      

                                       

const GitUtils = require('../git')

module.exports = function hasUncommittedChanges(project         )          {
  const uncommitedFiles = GitUtils.uncommittedChangesIn(project.paths.root)
  return uncommitedFiles.length > 0
}
