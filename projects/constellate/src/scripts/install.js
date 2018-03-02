const execa = require('execa')
const { TerminalUtils } = require('constellate-dev-utils')

module.exports = async function install() {
  TerminalUtils.title('Running install...')

  try {
    execa.sync('yarn', ['install'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    })
  } catch (err) {
    if (err.stderr) {
      console.log(err.stderr)
    }
    TerminalUtils.verbose(err)
  }

  TerminalUtils.success('Done')
}
