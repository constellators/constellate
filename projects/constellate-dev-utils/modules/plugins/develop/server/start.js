const TerminalUtils = require('../../../terminal')
const ChildProcessUtils = require('../../../childProcess')
const ProjectUtils = require('../../../projects')
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

// :: (Project) -> Promise
module.exports = function start(project) {
  return (
    ProjectUtils.compileProject(project)
      // Ensure any existing childProcess is killed
      .then(() => killChildProcessFor(project))
      // Fire up the new childProcess
      .then(
        () =>
          new Promise((resolve, reject) => {
            const childProcess = ChildProcessUtils.spawn(
              // Spawn a node process
              'node',
              // That runs the build entry file
              [project.paths.buildModulesEntry],
              // Ensure that output supports color etc
              // We use pipe for the error so that we can log a header for ther error.
              {
                stdio: [process.stdin, process.stdout, 'pipe'],
                cwd: project.paths.root,
              },
            )
            childProcess.catch((err) => {
              TerminalUtils.verbose(`Error starting ${project.name}`)
              reject(err)
            })

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
                })

                childProcessMap[project.name] = childProcess

                resolve({
                  kill: () => killChildProcessFor(project),
                })
              }
            })
          }),
      )
  )
}
