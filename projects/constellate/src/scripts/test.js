const path = require('path')
const pify = require('pify')
const fs = pify(require('fs-extra'))
const R = require('ramda')
const execa = require('execa')
const { TerminalUtils, AppUtils } = require('constellate-dev-utils')

module.exports = async function test({ watch, passThroughArgs }) {
  TerminalUtils.title('Running test...')

  const jestPath = path.resolve(process.cwd(), './node_modules/.bin/jest')
  const jestExists = await fs.pathExists(jestPath)
  if (!jestExists) {
    throw new Error('Could not find Jest. You may need to reinstall your dependencies.')
  }

  const appConfig = AppUtils.getConfig()
  const preTestHook = R.path(['commands', 'test', 'pre'], appConfig)
  const postTestHook = R.path(['commands', 'test', 'pre'], appConfig)

  if (preTestHook) {
    TerminalUtils.info('Running the pre test hook')
    await preTestHook()
  }

  const args = watch ? ['--watch'] : passThroughArgs
  const cmd = `${jestPath} ${args.join(' ')}`
  TerminalUtils.verbose(`Executing jest with args: [${args.join(', ')}]`)

  try {
    await execa.shell(cmd, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    })
  } catch (err) {
    TerminalUtils.verbose(console.error(err))
  }

  if (postTestHook) {
    TerminalUtils.info('Running the post test hook')
    await postTestHook()
  }
}
