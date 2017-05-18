const path = require('path')
const spawn = require('cross-spawn')
const chokidar = require('chokidar')
const R = require('ramda')
const terminal = require('constellate-utils/terminal')

const startDevServer = require('../webpack/startDevServer')
const buildProject = require('../projects/buildProject')

const createProjectWatcher = onChange => (project) => {
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
    return Promise.resolve(runningServer ? runningServer.kill() : '👍').then(() => {
      const projectProcess = spawn.sync('node', [project.paths.distEntry], {
        stdio: 'inherit',
      })
      projectProcess.on('close', (code) => {
        terminal.verbose(`Server process ${project.name} stopped (${code})`)
        runningServer = null
      })
      runningServer = {
        process: projectProcess,
        kill: () =>
          new Promise((resolve) => {
            if (runningServer) {
              terminal.verbose(`Stopping ${project.name}`)
              projectProcess.on('close', () => {
                resolve()
              })
              if (projectProcess.stdin) {
                projectProcess.stdin.pause()
              }
              // We will send a SIGTERM message to each process.
              // Hopefully they have a respective handler to do some process
              // clean up.
              projectProcess.kill('SIGTERM')
            } else {
              resolve()
            }
          }),
      }
    })
  }

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

  return {
    // :: void -> Promise
    build: () => {
      if (project.config.browser) {
        ensureWebDevServerRunningForProject()
        return Promise.resolve()
      }
      return buildProject(project).then(() => {
        if (project.config.server) {
          return ensureNodeServerRunningForProject()
        }
        return undefined
      })
    },
    // :: void -> Promise
    kill: () => (runningServer ? runningServer.kill() : Promise.resolve()),
  }
}

const conductor = (projects) => {
  // Represents the current project being built
  let currentBuild = null

  // Represents the build backlog queue. FIFO.
  let buildQueue = []

  // :: Project -> Project -> bool
  const projectHasDependant = R.curry((dependant, project) =>
    project.dependants.contains(dependant.name)
  )

  // :: Project -> Array<Project>
  const getProjectDependants = project =>
    project.dependants.map(x => projects.find(R.propEq('name', x)))

  // :: Object<string, ProjectConductor>
  const projectConductors = projects.reduce(
    (acc, project) => Object.assign(acc, { [project.name]: createProjectConductor(project) }),
    {}
  )

  /* eslint-disable no-use-before-define */

  const queueProjectForBuild = (project) => {
    if (currentBuild !== null && projectHasDependant(project /* dependant */, currentBuild)) {
      // Do nothing as the project currently being built will result in this
      // project being built via it's dependancy chain.
    } else if (R.any(projectHasDependant(project), buildQueue)) {
      // Do nothing as one of the queued projects will result in this project
      // getting built via it's dependancy chain.
    } else if (currentBuild !== null && buildQueue.length > 0) {
      // Queue the project for building, removing any of this projects
      // dependants from the build queue as they will be built via the
      // project's dependancy chain.
      const projectDependants = getProjectDependants(project)
      buildQueue = R.without(projectDependants, buildQueue)
    } else {
      // We can go ahead and run this project as there is no queued project
      // for build and no project actively being built.
      runBuild(project)
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
      .build()
      .then(() => {
        // Success 🎉
        const projectDependants = getProjectDependants(project)
        if (projectDependants.length > 0) {
          // Queue up the project's dependants for building.
          projectDependants.forEach(queueProjectForBuild)
        } else {
          // No dependants so we'll tell the queue to pop the next item.
          buildNextInTheQueue()
        }
      })
      .catch((err) => {
        terminal.error(`Build failed on ${project.name}. Please fix the issue:`)
        console.log(err)
        // We will still build the next item in the queue as for any item to
        // have been in the queue it could not have been a dependant of this
        // failed project.
        buildNextInTheQueue()
      })
  }

  const buildNextInTheQueue = () => {
    if (buildQueue.length > 0) {
      // Pop the queue.
      const nextToBuild = buildQueue[0]
      buildQueue = buildQueue.slice(1)
      // Go go go
      runBuild(nextToBuild)
    } else {
      // Nothing left to do. 😴
    }
  }

  /* eslint-enable no-use-before-define */

  // eslint-disable-next-line no-unused-vars
  const onChange = project => (changes) => {
    // TODO: Clever "minimal" changes build? Need to pass along some info?
    runBuild(project)
  }

  const watchers = projects
    // We don't want to include watchers on browser types as they will rely
    // on webpack-dev-server for change monitoring.
    .filter(x => !x.config.browser)
    .map(project => createProjectWatcher(onChange(project)))

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
    terminal.log('💀')
    performGracefulShutdown(0)
  })

  // READY. SET. GO. 🚀
  projects.forEach(queueProjectForBuild)
}

module.exports = function develop({ projects }) {
  conductor(projects)
}
