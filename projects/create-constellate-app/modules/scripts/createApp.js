/* eslint-disable no-console */

const fs = require('fs-extra')
const path = require('path')
const dedent = require('dedent')
const pify = require('pify')
const ora = require('ora')
const execa = require('execa')
const chalk = require('chalk')
const copyTemplateDir = pify(require('copy-template-dir'))

module.exports = async function createApp(name, { example }) {
  const srcPath = path.resolve(__dirname, '../templates/blank')
  const targetPath = path.resolve(process.cwd(), name)

  try {
    fs.ensureDirSync(targetPath)
  } catch (err) {
    console.error('Failed to create directory for app at:', targetPath)
    process.exit(1)
  }

  try {
    const copyTemplateDirSpinner = ora('Creating app files').start()
    await copyTemplateDir(srcPath, targetPath, { name })
    copyTemplateDirSpinner.succeed('Files created')

    if (example) {
      // todo
    }

    const initGitSpinner = ora('Initializing git repo').start()
    await execa('git', ['init'], { cwd: targetPath })
    initGitSpinner.succeed('Git repo initialized')

    const installingDepsSpinner = ora('Installing dependencies').start()
    await execa('npm', ['install'], { cwd: targetPath })
    installingDepsSpinner.succeed('Dependencies installed')

    console.log('')
    console.log(
      dedent(`
        ${chalk.bold.green('Your project has been created successfully!')}

        Go to ${name} and then run the following command to create your first project:

          ${chalk.blue('cd')} ${chalk.blue(name)}
          ${chalk.blue('npm run create-project')}
    `),
    )
    console.log('')
  } catch (err) {
    console.error(
      dedent(`
    Oh no! We ran into an error whilst trying to boostrap your application.

    Please feel free to report any issues at:
      https://github.com/constellators/constellate/issues
  `),
    )
    console.error(err)
  }
}
