const R = require('ramda')
const chalk = require('chalk')
const dedent = require('dedent')
const { TerminalUtils, GitUtils, AppUtils } = require('constellate-dev-utils')

module.exports = async function moveToTargetTag({ question }) {
  const appConfig = AppUtils.getConfig()
  const targetBranch = R.path(['publishing', 'gitBranchName'], appConfig)

  // Ensure there are no uncommitted changes.
  if (GitUtils.uncommittedChanges().length > 0) {
    TerminalUtils.error(
      'You have uncommitted changes. Please commit your changes and then try again.',
    )
    process.exit(1)
  }

  // Ensure on correct branch.
  const actualBranch = GitUtils.getCurrentBranch()
  if (targetBranch !== actualBranch) {
    TerminalUtils.error(
      dedent(`
        You are not on the "master" branch (${targetBranch}).

          ${chalk.blue(`git checkout ${targetBranch}`)}
      `),
    )
    process.exit(1)
  }

  // Get the last X versions and display them as options to be published
  const mostRecentVersionTags = AppUtils.getLastXVersionTags(5)
  if (mostRecentVersionTags.length === 0) {
    TerminalUtils.error(
      dedent(`
        You have no published versions. Please publish a version first.

            ${chalk.blue('npx constellate publish')}
      `),
    )
    process.exit(1)
  }

  // Ask the user from which tag version they would like to move to, using the
  // provided question.
  const targetTag = await TerminalUtils.select(question, {
    choices: mostRecentVersionTags.map(tag => ({
      value: tag,
      name: tag,
    })),
  })

  // Checkout target tag
  try {
    GitUtils.checkout(targetTag)
  } catch (err) {
    throw new Error(`Could not checkout target version ${targetTag}`, err)
  }

  return targetTag
}
