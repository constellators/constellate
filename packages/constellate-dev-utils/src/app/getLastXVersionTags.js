const GitUtils = require('../git')
const TerminalUtils = require('../terminal')

module.exports = function getLastXVersionTags(num) {
  if (num == null || num < 1) {
    throw new Error('You must provide a number')
  }

  const result = []
  let prevTag = null

  for (let x = 0; x < num; x += 1) {
    const lastTagInfo = prevTag
      ? GitUtils.getLastAnnotatedTagInfoSince(`${prevTag}^`)
      : GitUtils.getLastAnnotatedTagInfo()
    if (lastTagInfo) {
      const { tag } = lastTagInfo
      TerminalUtils.verbose(`Resolved ${tag} as a version for the application`)
      prevTag = tag
      result.push(tag)
    } else {
      break
    }
  }

  return result
}
