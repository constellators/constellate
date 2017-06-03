/* eslint-disable no-use-before-define */

const R = require('ramda')
const TerminalUtils = require('constellate-dev-utils/terminal')
const ProjectUtils = require('../../utils/projects')
const createProjectConductor = require('./createProjectConductor')
const createProjectWatcher = require('./createProjectWatcher')

module.exports = function develop(allProjects, projectsToDevelop) {
  TerminalUtils.info('Press CTRL + C to exit')

  // Represents the current project being built
  let currentBuild = null

  // Represents the build backlog queue. FIFO.
  let buildQueue = []

  // :: Project -> Project -> bool
  const projectHasDependant = R.curry((dependant, project) =>
    R.contains(dependant.name, project.dependants),
  )

  // Firstly clean up shop.
  ProjectUtils.cleanBuild()

  // :: Project -> Array<Project>
  const getProjectDependants = project =>
    project.dependants.map(dependant => projectsToDevelop.find(R.propEq('name', dependant)))

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

  // :: Object<string, ProjectWatcher>
  const watchers = projectsToDevelop.reduce(
    (acc, project) =>
      Object.assign(acc, { [project.name]: createProjectWatcher(onChange(project), project) }),
    {},
  )

  // :: Object<string, ProjectConductor>
  const projectConductors = projectsToDevelop.reduce(
    (acc, project) =>
      Object.assign(acc, {
        [project.name]: createProjectConductor(projectsToDevelop, project, watchers[project.name]),
      }),
    {},
  )

  const queueProjectForBuild = (project) => {
    TerminalUtils.verbose(`Attempting to queue ${project.name} for build`)
    if (currentBuild !== null && projectHasDependant(project /* dependant */, currentBuild)) {
      // Do nothing as the project currently being built will result in this
      // project being built via it's dependancy chain.
      TerminalUtils.verbose(`Skipping queue of ${project.name} as represented by currentBuild`)
    } else if (R.any(projectHasDependant(project), buildQueue)) {
      // Do nothing as one of the queued projectsToDevelop will result in this project
      // getting built via it's dependancy chain.
      TerminalUtils.verbose(`Skipping queue of ${project.name} as represented by buildQueue`)
    } else {
      // Queue the project for building.
      TerminalUtils.verbose(`Queuing ${project.name}`)
      const projectDependants = getProjectDependants(project)
      // We'll assign the project to the build queue, removing any of the
      // project's dependants as they will be represented by the project being
      // added.
      buildQueue = R.without(projectDependants, buildQueue).concat([project])
      TerminalUtils.verbose(`Queue: [${buildQueue.map(x => x.name).join(',')}]`)
    }
  }

  const runBuild = (project) => {
    currentBuild = project
    const projectConductor = projectConductors[project.name]
    if (!projectConductor) {
      TerminalUtils.warn(`Did not run build for ${project.name} as no project conductor registered`)
      return
    }
    projectConductor
      // Kick off the build
      .build()
      // Build succeeded 🎉
      .then(() => ({ success: true }))
      // Build failed 😭
      .catch((err) => {
        TerminalUtils.error(`Please fix the following issue on ${project.name}:`, err)
        return { success: false }
      })
      // Finally...
      .then(({ success }) => {
        // Ensure any current is removed
        currentBuild = null

        // If the build succeeded we will queue dependants
        if (success) {
          TerminalUtils.verbose(
            `Project build successfully ${project.name}, queueing dependants...`,
          )
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
      TerminalUtils.warning(
        'Tried to build next item in queue even though there is an active build running',
      )
      return
    }
    TerminalUtils.verbose('Popping the queue')
    if (buildQueue.length > 0) {
      // Pop the queue.
      const nextToBuild = buildQueue[0]
      buildQueue = buildQueue.slice(1)
      TerminalUtils.verbose(`Popped ${nextToBuild.name}`)
      runBuild(nextToBuild)
    } else {
      TerminalUtils.verbose('Nothing to pop')
    }
  }

  // READY...
  projectsToDevelop.forEach(queueProjectForBuild)

  // SET...
  Object.keys(watchers).forEach(projectName => watchers[projectName].start())

  // GO! 🚀
  buildNextInTheQueue()

  // GRACEFUL SHUTTING DOWN HANDLED BELOW:

  let shuttingDown = false

  function performGracefulShutdown() {
    // Avoid multiple calls (e.g. if ctrl+c pressed multiple times)
    if (shuttingDown) return
    shuttingDown = true

    TerminalUtils.info('Shutting down development environment...')

    // Firstly kill all our watchers.
    Object.keys(watchers).forEach(projectName => watchers[projectName].stop())

    // Then call off the `.kill()` against all our project conductors.
    Promise.all(R.values(projectConductors).map(projectConductor => projectConductor.kill()))
      .catch((err) => {
        TerminalUtils.error(
          'An error occurred whilst shutting down the development environment',
          err,
        )
        process.exit(1)
      })
      .then(() => process.exit(0))

    setTimeout(() => {
      TerminalUtils.verbose('Forcing shutdown after grace period')
      process.exit(0)
    }, 5 * 1000)
  }

  // Ensure that we perform a graceful shutdown when any of the following
  // signals are sent to our process.
  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
      TerminalUtils.verbose(`Received ${signal} termination signal`)
      performGracefulShutdown()
    })
  })

  process.on('exit', () => {
    TerminalUtils.info('Till next time. *kiss*')
  })

  // prevent node process from exiting. (until CTRL + C is pressed at least)
  process.stdin.read()
}
