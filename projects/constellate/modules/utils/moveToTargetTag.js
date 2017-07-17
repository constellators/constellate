const R = require('ramda')
const chalk = require('chalk')
const dedent = require('dedent')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const GitUtils = require('constellate-dev-utils/modules/git')
const AppUtils = require('constellate-dev-utils/modules/app')

module.exports = async function moveToTargetTag({ question }) {
  const appConfig = AppUtils.getConfig()
  const targetBranch = R.path(['masterBranchName'], appConfig)

  // Ensure there are no uncommitted changes.
  if (GitUtils.uncommittedChanges().length > 0) {
    throw new Error('You have uncommitted changes. Please commit your changes and then try again.')
  }

  // Ensure on correct branch.
  const actualBranch = GitUtils.getCurrentBranch()
  if (targetBranch !== actualBranch) {
    throw new Error(
      dedent(`
        You are not on the "master" branch (${targetBranch}).

          ${chalk.blue(`git checkout ${targetBranch}`)}
      `),
    )
  }

  // Get the last X versions and display them as options to be published
  const mostRecentVersionTags = AppUtils.getLastXVersionTags(5)
  if (mostRecentVersionTags.length === 0) {
    throw new Error(
      dedent(`
        You have no tags. Please create a tag first.

            ${chalk.blue('npx constellate tag')}
      `),
    )
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
    throw new Error(`Could not checkout target tag ${targetTag}`, err)
  }

  return targetTag
}
