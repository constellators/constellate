const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ChildProcessUtils = require('constellate-dev-utils/modules/childProcess')
const ProjectUtils = require('constellate-dev-utils/modules/projects')
// const WebpackUtils = require('../../utils/webpack')

module.exports = function createProjectConductor(project, watcher) {
  let runningServer

  // :: Project -> Promise
  function ensureNodeServerRunning() {
    return new Promise((resolve) => {
      const projectProcess = ChildProcessUtils.spawn(
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
      projectProcess.stderr.on('data', (data) => {
        TerminalUtils.error(`Runtime error in ${project.name}`, data.toString())
      })
      projectProcess.on('close', () => {
        TerminalUtils.verbose(`Server process ${project.name} stopped`)
        runningServer = null
      })
      runningServer = {
        process: projectProcess,
        kill: () =>
          new Promise((killResolve) => {
            if (runningServer) {
              TerminalUtils.verbose(`Killing ${project.name}`)

              projectProcess
                .then(() => {
                  TerminalUtils.verbose(`Killed ${project.name}`)
                  killResolve()
                })
                .catch(() => {
                  TerminalUtils.verbose(`Killed ${project.name}`)
                  killResolve()
                })

              projectProcess.kill('SIGTERM')
            } else {
              TerminalUtils.verbose(`No process to kill for ${project.name}`)
              killResolve()
            }
          }),
      }
      resolve()
    }).catch((err) => {
      TerminalUtils.error(`Error starting ${project.name}`, err)
    })
  }

  /*
  function ensureWebDevServerRunning() {
    return getPort()
      .then((port) => {
        TerminalUtils.verbose(`Found free port ${port} for webpack dev server`)
        return WebpackUtils.startDevServer(project, { port })
          .then((webpackDevServer) => {
            // No need for the watcher now as webpack-dev-server has an inbuilt
            // watcher.
            watcher.stop()
            return webpackDevServer
          })
          .catch((err) => {
            // Ensure we fire up a watcher so that we can track when the issue
            // is fixed.
            watcher.start()
            // Throw the error along
            throw err
          })
      })
      .then((webpackDevServer) => {
        runningServer = {
          process: webpackDevServer,
          kill: () =>
            new Promise((killResolve) => {
              if (webpackDevServer) {
                webpackDevServer.close(() => killResolve())
              } else {
                killResolve()
              }
            }),
        }
      })
  }
  */

  function kill() {
    return runningServer ? runningServer.kill() : Promise.resolve()
  }

  return {
    // :: void -> Promise
    build: () => {
      // Just in case a custom process is run we will link our project here.
      ProjectUtils.linkProject(project)

      /*
      if (project.config.role === 'client') {
        if (runningServer) {
          // We only need one running instance.
          return Promise.resolve()
        }
        TerminalUtils.verbose(`Starting a webpack-dev-server for ${project.name}`)
        return ensureWebDevServerRunning()
      }
      */

      // else is targetting node

      return ProjectUtils.compileProject(project).then(() =>
        kill().then(() => {
          if (project.config.role === 'server') {
            return ensureNodeServerRunning()
          }
          return undefined
        }),
      )
    },
    // :: void -> Promise
    kill,
  }
}
