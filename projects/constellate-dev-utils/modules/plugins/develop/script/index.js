const R = require('ramda')
const readPkg = require('read-pkg')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ChildProcessUtils = require('../../../childProcess')

const childProcessMap = {}

const killChildProcessFor = (project) => {
  const childProcess = childProcessMap[project.name]
  if (!childProcess) {
    TerminalUtils.verbose(`No running child process for ${project.name} to kill`)
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    TerminalUtils.verbose(`Killing ${project.name}`)
    childProcess
      .then(() => {
        TerminalUtils.verbose(`Killed ${project.name}`)
        resolve()
      })
      .catch(() => {
        TerminalUtils.verbose(`Killed ${project.name}`)
        resolve()
      })

    childProcess.kill('SIGTERM')
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
            stdio: [process.stdin, process.stdout, 'pipe'],
            cwd: project.paths.root,
          },
        )
        childProcess.catch(err => reject(err))

        // Allow the catch a tick to resolve an error
        process.nextTick(() => {
          if (!childProcess.stderr) {
            TerminalUtils.verbose(
              'Not resolving server as childProcess was not created properly. An error probably occurred.',
            )
            reject(new Error(`${project.name} has problems. Please fix`))
          } else {
            childProcess.stderr.on('data', (data) => {
              TerminalUtils.error(`Runtime error in ${project.name}`, data.toString())
            })

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
          }
        })
      }),
  }
}
