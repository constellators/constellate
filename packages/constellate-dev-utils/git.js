/**
 * Tons of inspiration taken from the amazing Lerna project.
 * https://github.com/lerna/lerna
 * ❤️
 */

const ChildProcessUtils = require('./childProcess')
const { multiLineStringToArray } = require('./strings')
const TerminalUtils = require('./terminal')

// Get all tags along with commit ids.
// git show-ref --tags

function isInitialized() {
  let initialized

  try {
    // we only want the return code, so ignore stdout/stderr
    ChildProcessUtils.execSync('git', ['rev-parse'], {
      stdio: 'ignore',
    })
    initialized = true
  } catch (err) {
    initialized = false
  }

  return initialized
}

function checkout(target) {
  try {
    ChildProcessUtils.execSync('git', ['checkout', target])
    return true
  } catch (err) {
    TerminalUtils.verbose(`Failed to checkout ${target}`)
    TerminalUtils.verbose(err)
    return false
  }
}

function getLastCommitIn(location) {
  return ChildProcessUtils.execSync('git', ['log', '-n', '1', '--pretty=format:%H', '--', location])
}

function getCurrentBranch() {
  return ChildProcessUtils.execSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
}

function getLastAnnotatedTagInfoSince(since) {
  try {
    const [tag, numCommitsSinceTag] = ChildProcessUtils.execSync('git', [
      'describe',
      '--',
      since,
    ]).split('-')
    return { tag, numCommitsSinceTag: numCommitsSinceTag || 0 }
  } catch (e) {
    return undefined
  }
}

function getLastAnnotatedTagInfo() {
  try {
    const [tag, numCommitsSinceTag] = ChildProcessUtils.execSync('git', ['describe']).split('-')
    return { tag, numCommitsSinceTag: numCommitsSinceTag || 0 }
  } catch (e) {
    return undefined
  }
}

function uncommittedChangesIn(location) {
  return multiLineStringToArray(
    ChildProcessUtils.execSync('git', ['diff', '--name-only', '--', location])
  )
}

function changedFilesSinceIn(since, location) {
  return multiLineStringToArray(
    ChildProcessUtils.execSync('git', ['diff', '--name-only', since, '--', location])
  )
}

function addAnnotatedTag(tag, opts) {
  ChildProcessUtils.execSync('git', ['tag', '-a', tag, '-m', tag], opts)
}

function pushWithTags(remote, tags, opts) {
  const branch = getCurrentBranch(opts)
  ChildProcessUtils.execSync('git', ['push', remote, branch], opts)
  ChildProcessUtils.execSync('git', ['push', remote].concat(tags), opts)
}

module.exports = {
  addAnnotatedTag,
  changedFilesSinceIn,
  checkout,
  getCurrentBranch,
  getLastAnnotatedTagInfo,
  getLastAnnotatedTagInfoSince,
  getLastCommitIn,
  isInitialized,
  uncommittedChangesIn,
  pushWithTags,
}
