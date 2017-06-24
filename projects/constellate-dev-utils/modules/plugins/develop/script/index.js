const R = require('ramda')
const readPkg = require('read-pkg')
const TerminalUtils = require('../../../terminal')
const ChildProcessUtils = require('../../../childProcess')

// :: (Project, DevelopOptions, Watcher) -> DevelopAPI
module.exports = function scriptDevelop(project, options) {
  if (!options.startScriptName) {
    throw new Error(
      `No startScriptName was provided for the develop configuration of ${project.name}.`,
    )
  }

  const pkgJson = readPkg.sync(project.paths.packageJson)

  const stopScript = () =>
    new Promise((resolve) => {
      const scriptCmd = R.path(['scripts', options.stopScriptName], pkgJson)
      if (!scriptCmd || R.isEmpty(scriptCmd)) {
        return
      }

      TerminalUtils.verbose(`Executing stopScript "${options.stopScriptName}" for ${project.name}`)

      try {
        ChildProcessUtils.execSync('npm', ['run', options.stopScriptName], {
          stdio: 'inherit',
          cwd: project.paths.root,
        })
        TerminalUtils.verbose(`Finished executing stopScript for ${project.name}`)
      } catch (err) {
        TerminalUtils.verbose(`Error running stopScript for ${project.name}`)
        TerminalUtils.verbose(err)
      }

      resolve()
    })

  return {
    start: () =>
      stopScript().then(
        () =>
          new Promise((resolve, reject) => {
            const scriptCmd = R.path(['scripts', options.startScriptName], pkgJson)
            if (!scriptCmd || R.isEmpty(scriptCmd)) {
              throw new Error(
                `Could not resolve a start script named "${options.startScriptName}" on ${project.name}`,
              )
            }

            TerminalUtils.info(
              `Executing startScript "${options.startScriptName}" for ${project.name}`,
            )

            const childProcess = ChildProcessUtils.spawn('npm', ['run', options.startScriptName], {
              stdio: 'inherit',
              cwd: project.paths.root,
            })
            childProcess.catch(err => reject(err))

            // Give the catch above a tick of space, so that it can resolve any
            // error that may have occurred
            process.nextTick(() => {
              childProcess.on('close', () => {
                TerminalUtils.verbose(`"Start" script finished execution for ${project.name}`)
              })
              resolve()
            })
          }),
      ),
  }
}
