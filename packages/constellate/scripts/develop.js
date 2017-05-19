const path = require('path')
const spawn = require('cross-spawn')
const chokidar = require('chokidar')
const R = require('ramda')
const terminal = require('constellate-utils/terminal')
const treeKill = require('tree-kill')

const startDevServer = require('../webpack/startDevServer')
const buildProject = require('../projects/buildProject')

const createProjectWatcher = (onChange, project) => {
  terminal.verbose(`Creating watcher for ${project.name}.`)
  const watcher = chokidar.watch(
    // TODO: Add the paths to the dist folders of each of it's dependencies.
    [project.paths.source, path.resolve(project.paths.root, './package.json')],
    { ignoreInitial: true, cwd: project.paths.root, ignorePermissionErrors: true }
  )
  watcher
    .on('add', onChange)
    .on('change', onChange)
    .on('unlink', onChange)
    .on('addDir', onChange)
    .on('unlinkDir', onChange)
  return watcher
}

const createProjectConductor = (project) => {
  let runningServer

  // :: Project -> Promise
  function ensureNodeServerRunningForProject() {
    return new Promise((resolve) => {
      const projectProcess = spawn(
        'node',
        ['--require', 'pretty-error/start', project.paths.distEntry],
        {
          stdio: 'inherit',
        }
      )
      projectProcess.on('close', (code) => {
        terminal.verbose(`Server process ${project.name} stopped (${code})`)
        runningServer = null
      })
      runningServer = {
        process: projectProcess,
        kill: () =>
          new Promise((killResolve) => {
            if (runningServer) {
              terminal.verbose(`Killing ${project.name}`)
              projectProcess.on('close', () => {
                terminal.verbose(`Killed ${project.name}`)
                // Ensure process and it's child processes are killed,
                // avoiding hanging listeners etc.
                killResolve()
              })
              // if (projectProcess.stdin) {
              //   projectProcess.stdin.pause()
              // }
              // // We will send a SIGTERM message to each process.
              // // Hopefully they have a respective handler to do some process
              // // clean up.
              // projectProcess.kill('SIGTERM')
              projectProcess.kill('SIGTERM')
              console.log('Sent the 💩')
            } else {
              terminal.verbose(`No process to kill for ${project.name}`)
              killResolve()
            }
          }),
      }
      resolve()
    }).catch((err) => {
      terminal.error(`Error starting ${project.name}`, err)
    })
  }

  // TODO: On error nullify the server to allow for restart.
  function ensureWebDevServerRunningForProject() {
    runningServer = {
      process: startDevServer({ project }),
      kill: () =>
        new Promise((resolve) => {
          if (runningServer) {
            runningServer.process.close(() => resolve())
          } else {
            resolve()
          }
        }),
    }
  }

  function kill() {
    return runningServer ? runningServer.kill() : Promise.resolve()
  }

  return {
    // :: void -> Promise
    build: () => {
      if (project.config.browser) {
        if (!runningServer) {
          console.log('BOOTING WEBDEVSERVER')
          // We only need one running instance
          ensureWebDevServerRunningForProject()
        }
        return Promise.resolve()
      }
      return kill().then(() => console.log('💩')).then(() => buildProject(project)).then(() => {
        if (project.config.server) {
          return ensureNodeServerRunningForProject()
        }
        return undefined
      })
    },
    // :: void -> Promise
    kill,
  }
}

const conductor = (projects) => {
  // Represents the current project being built
  let currentBuild = null

  // Represents the build backlog queue. FIFO.
  let buildQueue = []

  // :: Project -> Project -> bool
  const projectHasDependant = R.curry((dependant, project) =>
    R.contains(dependant.name, project.dependants)
  )

  // :: Project -> Array<Project>
  const getProjectDependants = project =>
    project.dependants.map(dependant => projects.find(R.propEq('name', dependant)))

  // :: Object<string, ProjectConductor>
  const projectConductors = projects.reduce(
    (acc, project) => Object.assign(acc, { [project.name]: createProjectConductor(project) }),
    {}
  )

  /* eslint-disable no-use-before-define */

  const queueProjectForBuild = (project) => {
    terminal.verbose(`Attempting to queue ${project.name} for build`)
    if (currentBuild !== null && projectHasDependant(project /* dependant */, currentBuild)) {
      // Do nothing as the project currently being built will result in this
      // project being built via it's dependancy chain.
      terminal.verbose(`Skipping queue of ${project.name} as represented by currentBuild`)
    } else if (R.any(projectHasDependant(project), buildQueue)) {
      // Do nothing as one of the queued projects will result in this project
      // getting built via it's dependancy chain.
      terminal.verbose(`Skipping queue of ${project.name} as represented by buildQueue`)
    } else {
      // Queue the project for building.
      terminal.verbose(`Queuing ${project.name}`)
      const projectDependants = getProjectDependants(project)
      // We'll assign the project to the build queue, removing any of the
      // project's dependants as they will be represented by the project being
      // added.
      buildQueue = R.without(projectDependants, buildQueue).concat([project])
      terminal.verbose(`Queue: [${buildQueue.map(x => x.name).join(',')}]`)
    }
  }

  const runBuild = (project) => {
    currentBuild = project
    const projectConductor = projectConductors[project.name]
    if (!projectConductor) {
      terminal.warn(`Did not run build for ${project.name} as no project conductor registered`)
      return
    }
    projectConductor
      // Kick off the build
      .build()
      // Build succeeded 🎉
      .then(() => ({ success: true }))
      // Build failed 😭
      .catch((err) => {
        terminal.error(`Build failed on ${project.name}. Please fix the issue:`)
        console.log(err)
        return { success: false }
      })
      // Finally...
      .then(({ success }) => {
        // Ensure any current is removed
        currentBuild = null

        // If the build succeeded we will queue dependants
        if (success) {
          terminal.verbose(`Project build successfully ${project.name}, queueing dependants...`)
          const projectDependants = getProjectDependants(project)
          projectDependants.forEach(queueProjectForBuild)
        }

        // We will call off the next build despite a failure to build this
        // project as any items still in the queue likely aren't dependants
        // of this project due to the logic contained within the queueing process.
        buildNextInTheQueue()
      })
  }

  const buildNextInTheQueue = () => {
    if (currentBuild) {
      terminal.warning(
        'Tried to build next item in queue even though there is an active build running'
      )
      return
    }
    terminal.verbose('Popping the queue')
    if (buildQueue.length > 0) {
      // Pop the queue.
      const nextToBuild = buildQueue[0]
      buildQueue = buildQueue.slice(1)
      terminal.verbose(`Popped ${nextToBuild.name}`)
      runBuild(nextToBuild)
    } else {
      terminal.verbose('Nothing to pop')
    }
  }

  /* eslint-enable no-use-before-define */

  // eslint-disable-next-line no-unused-vars
  const onChange = project => (changes) => {
    // TODO: Clever "minimal" changes build? Need to pass along some info?
    queueProjectForBuild(project)
    // If no active build running then we will call off to run next item in
    // the queue.
    if (!currentBuild) {
      buildNextInTheQueue()
    }
  }

  const watchers = projects
    // We don't want to include watchers on browser types as they will rely
    // on webpack-dev-server for change monitoring.
    .filter(x => !x.config.browser)
    .map(project => createProjectWatcher(onChange(project), project))

  let shuttingDown = false

  function performGracefulShutdown(exitCode = 1) {
    // Avoid multiple calls (e.g. if ctrl+c pressed multiple times)
    if (shuttingDown) return
    shuttingDown = true

    terminal.info('Shutting down development environment...')

    // Firstly shut down all our file watchers.
    watchers.forEach(watcher => watcher.close())

    // Then call off the `.kill()` against all our project conductors.
    Promise.all(R.values(projectConductors).map(projectConductor => projectConductor.kill()))
      .then(
        () =>
          // We provide a grace period before doing a hard process exit on
          // THIS master process.
          new Promise((resolve) => {
            setTimeout(() => {
              resolve()
              process.exit(exitCode)
            }, 5000) // TODO: make grace period configurable
          })
      )
      .then(() => terminal.info('Development environment shut down'))
      .catch((err) => {
        terminal.error('An error occurred whilst shutting down the development environment')
        console.log(err)
      })
  }

  process.on('SIGINT', () => {
    terminal.info('💀')
    performGracefulShutdown(0)
  })

  // READY. SET.
  projects.forEach(queueProjectForBuild)

  // GO! 🚀
  buildNextInTheQueue()
}

module.exports = function develop({ projects }) {
  conductor(projects)

  // We create this interval to prevent the script from stopping.
  // User needs to CTRL + C to stop.
  setInterval(() => {}, 1000)
}
