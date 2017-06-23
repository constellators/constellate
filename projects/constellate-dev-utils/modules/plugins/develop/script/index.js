const R = require('ramda')
const readPkg = require('read-pkg')
const TerminalUtils = require('../../../terminal')
const ChildProcessUtils = require('../../../childProcess')
const DevelopPluginUtils = require('../utils')

const childProcessMap = {}

const killChildProcessFor = (project) => {
  const childProcess = childProcessMap[project.name]
  if (!childProcess) {
    TerminalUtils.verbose(`No running child process for ${project.name} to kill`)
    return Promise.resolve()
  }
  return DevelopPluginUtils.killChildProcess(project, childProcess).then(() => {
    TerminalUtils.verbose(`${project.name} killed successfully`)
    if (childProcessMap[project.name]) {
      delete childProcessMap[project.name]
    }
  })
}

// :: (Project, DevelopOptions, Watcher) -> DevelopAPI
module.exports = function scriptDevelop(project, options) {
  if (!options.scriptName) {
    throw new Error(`No script name was provided for the develop configuration of ${project.name}.`)
  }

  return {
    start: () =>
      new Promise((resolve, reject) => {
        const pkgJson = readPkg.sync(project.paths.packageJson)
        const scriptToExec = R.path(['scripts', options.scriptName], pkgJson)
        if (!scriptToExec || R.isEmpty(scriptToExec)) {
          throw new Error(
            `Could not resolve a script by name of ${options.scriptName} on ${project.name}`,
          )
        }

        const childProcess = ChildProcessUtils.spawn(
          'npm',
          ['run', options.scriptName],
          // Ensure that output supports color etc
          // We use pipe for the error so that we can log a header for ther error.
          {
            stdio: 'inherit',
            cwd: project.paths.root,
          },
        )
        childProcess.catch(err => reject(err))

        // Allow the catch a tick to resolve an error
        process.nextTick(() => {
          childProcess.on('close', () => {
            TerminalUtils.verbose(`Server process ${project.name} stopped`)
            if (childProcessMap[project.name]) {
              delete childProcessMap[project.name]
            }
          })

          childProcessMap[project.name] = childProcess

          resolve({
            kill: () => killChildProcessFor(project),
          })
        })
      }),
  }
}
