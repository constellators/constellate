const ChildProcessUtils = require('./childProcess')
const StringUtils = require('./strings')
const TerminalUtils = require('./terminal')

function addAnnotatedTag(tag) {
  ChildProcessUtils.execSync('git', ['tag', '-a', tag, '-m', tag])
}

function changedFilesSinceIn(since, location) {
  return StringUtils.multiLineStringToArray(
    ChildProcessUtils.execSync('git', [
      'diff',
      '--name-only',
      since,
      '--',
      location,
    ]),
  )
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

function clearAllChanges() {
  ChildProcessUtils.execSync('git', ['checkout', '.'])
}

function commit(message) {
  ChildProcessUtils.execSync('git', ['commit', '-m', message])
}

function doesRemoteExist(remote) {
  try {
    ChildProcessUtils.execSync('git', ['remote', 'get-url', remote])
    return true
  } catch (err) {
    return false
  }
}

function getCurrentBranch() {
  return ChildProcessUtils.execSync('git', [
    'rev-parse',
    '--abbrev-ref',
    'HEAD',
  ])
}

function getLastAnnotatedTagInfo() {
  try {
    const [tag, numCommitsSinceTag] = ChildProcessUtils.execSync('git', [
      'describe',
    ]).split('-')
    return { tag, numCommitsSinceTag: numCommitsSinceTag || 0 }
  } catch (e) {
    return undefined
  }
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

function getLastCommitIn(location) {
  return ChildProcessUtils.execSync('git', [
    'log',
    '-n',
    '1',
    '--pretty=format:%H',
    '--',
    location,
  ])
}

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

function isUpToDateWithRemote(remote) {
  const currentBranch = getCurrentBranch()
  const details = ChildProcessUtils.execSync('git', [
    'ls-remote',
    '-h',
    remote,
    currentBranch,
  ])
  TerminalUtils.verbose(`Remote head info for ${remote}: ${details}`)
  const commitSHA = details.match(/(\w+)\s/i)[1]
  TerminalUtils.verbose(`Remote head SHA: ${commitSHA}`)
  try {
    ChildProcessUtils.execSync('git', ['branch', '--contains', commitSHA])
    return true
  } catch (err) {
    TerminalUtils.verbose(err)
    return false
  }
}

function pushWithTags(remote, tags) {
  const branch = getCurrentBranch()
  ChildProcessUtils.execSync('git', ['push', remote, branch])
  ChildProcessUtils.execSync('git', ['push', remote].concat(tags))
}

function resetHead() {
  ChildProcessUtils.execSync('git', ['reset', 'HEAD'])
}

function removeTag(tag) {
  ChildProcessUtils.execSync('git', ['tag', '-d', tag])
}

function stageAllChanges() {
  ChildProcessUtils.execSync('git', ['add', '.'])
}

function undoPreviousCommit() {
  ChildProcessUtils.execSync('git', ['reset', '--hard', 'HEAD~'])
}

function uncommittedChanges() {
  return StringUtils.multiLineStringToArray(
    ChildProcessUtils.execSync('git', ['diff', '--name-only']),
  )
}

function uncommittedChangesIn(location) {
  return StringUtils.multiLineStringToArray(
    ChildProcessUtils.execSync('git', ['diff', '--name-only', '--', location]),
  )
}

module.exports = {
  addAnnotatedTag,
  changedFilesSinceIn,
  checkout,
  clearAllChanges,
  commit,
  doesRemoteExist,
  getCurrentBranch,
  getLastAnnotatedTagInfo,
  getLastAnnotatedTagInfoSince,
  getLastCommitIn,
  isInitialized,
  isUpToDateWithRemote,
  pushWithTags,
  removeTag,
  resetHead,
  stageAllChanges,
  uncommittedChanges,
  uncommittedChangesIn,
  undoPreviousCommit,
}
