/* eslint-disable no-use-before-define */

const R = require('ramda')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const AppUtils = require('constellate-dev-utils/modules/app')
const ProjectUtils = require('constellate-dev-utils/modules/projects')
const createProjectDevelopConductor = require('./createProjectDevelopConductor')
const createProjectWatcher = require('./createProjectWatcher')
const gracefulShutdownManager = require('./gracefulShutdownManager')

module.exports = async function develop() {
  const appConfig = AppUtils.getConfig()
  const preDevelopHook = R.path(['commands', 'develop', 'pre'], appConfig)

  if (preDevelopHook) {
    TerminalUtils.info('Running the pre develop hook')
    await preDevelopHook()
  }

  const allProjects = ProjectUtils.getAllProjects()
  const allProjectsArray = ProjectUtils.getAllProjectsArray()

  // Firstly clean up shop.
  ProjectUtils.cleanBuild()

  // Then ensure all the projects are linked
  ProjectUtils.linkAllProjects()

  // Represents the current project being built
  let currentlyProcessing = null

  // Represents the build backlog queue. FIFO.
  let toProcessQueue = []

  // :: Project -> Project -> bool
  const projectHasDependant = R.curry((dependant, project) =>
    R.contains(dependant.name, project.dependants),
  )

  // :: Project -> Array<Project>
  const getProjectDependants = project => project.dependants.map(name => allProjects[name])

  // :: Project -> void -> void
  const onChange = project => () => {
    queueProjectForProcessing(project)
    // If no active build running then we will call off to run next item in
    // the queue.
    if (!currentlyProcessing) {
      processNextInTheQueue()
    }
  }

  // :: Object<string, ProjectWatcher>
  const projectWatchers = allProjectsArray.reduce(
    (acc, project) =>
      Object.assign(acc, { [project.name]: createProjectWatcher(onChange(project), project) }),
    {},
  )

  // :: Object<string, ProjectDevelopConductor>
  const projectDevelopConductors = allProjectsArray.reduce(
    (acc, project) =>
      Object.assign(acc, {
        [project.name]: createProjectDevelopConductor(project, projectWatchers[project.name]),
      }),
    {},
  )

  const queueProjectForProcessing = (projectToQueue) => {
    TerminalUtils.verbose(`Attempting to queue ${projectToQueue.name}`)
    if (currentlyProcessing !== null && projectHasDependant(projectToQueue, currentlyProcessing)) {
      // Do nothing as the project currently being built will result in this
      // project being built via it's dependancy chain.
      TerminalUtils.verbose(
        `Skipping queue of ${projectToQueue.name} as represented by the project currently being processed`,
      )
    } else if (R.any(projectHasDependant(projectToQueue), toProcessQueue)) {
      // Do nothing as one of the queued projectsToDevelop will result in this project
      // getting built via it's dependancy chain.
      TerminalUtils.verbose(
        `Skipping queue of ${projectToQueue.name} as represented by the items within the queue`,
      )
    } else {
      // Queue the project for building.
      TerminalUtils.verbose(`Queuing ${projectToQueue.name}`)
      const projectDependants = getProjectDependants(projectToQueue)
      // We'll assign the project to the build queue, removing any of the
      // project's dependants as they will be represented by the project being
      // added.
      toProcessQueue = R.without(projectDependants, toProcessQueue).concat([projectToQueue])
      TerminalUtils.verbose(`Queue: [${toProcessQueue.map(x => x.name).join(',')}]`)
    }
  }

  const processProject = (project) => {
    currentlyProcessing = project
    const projectDevelopConductor = projectDevelopConductors[project.name]
    if (!projectDevelopConductor) {
      TerminalUtils.error(
        `Did not run develop process for ${project.name} as there is no project develop conductor registered for it`,
      )
      return
    }
    projectDevelopConductor
      // Kick off the develop of the project
      .start()
      // Develop kickstart succeeded 🎉
      .then(() => ({ success: true }))
      // Or, failed 😭
      .catch((err) => {
        TerminalUtils.error(`Please fix the following issue on ${project.name}:`, err)
        return { success: false }
      })
      // Finally...
      .then(({ success }) => {
        // Ensure any current is removed
        currentlyProcessing = null

        // If the build succeeded we will queue dependants
        if (success) {
          TerminalUtils.verbose(
            `Develop process ran successfully for ${project.name}, queueing dependants...`,
          )
          const projectDependants = getProjectDependants(project)
          projectDependants.forEach(queueProjectForProcessing)
        }

        // We will call off the next item to be processe even if a failure
        // occurred. This is because any items in the queue likely are not
        // dependants of this failed project (due to the logic contained within
        // the queueing function).
        processNextInTheQueue()
      })
  }

  const processNextInTheQueue = () => {
    if (currentlyProcessing) {
      TerminalUtils.error(
        `Tried to process the next Project in the queue even though there is a Project being processed: ${currentlyProcessing}`,
      )
      return
    }
    TerminalUtils.verbose('Popping the queue')
    if (toProcessQueue.length > 0) {
      // Pop the queue.
      const nextToProcess = toProcessQueue[0]
      toProcessQueue = toProcessQueue.slice(1)
      TerminalUtils.verbose(`Popped ${nextToProcess.name}`)
      processProject(nextToProcess)
    } else {
      TerminalUtils.verbose('Nothing to pop')
    }
  }

  // READY...
  allProjectsArray.forEach(queueProjectForProcessing)

  // SET...
  Object.keys(projectWatchers).forEach(projectName => projectWatchers[projectName].start())

  // GO! 🚀
  processNextInTheQueue()

  // Ensure graceful shutting down:
  gracefulShutdownManager(projectDevelopConductors, projectWatchers)

  // prevent node process from exiting. (until CTRL + C is pressed at least)
  TerminalUtils.info('Press CTRL + C to exit')
  return new Promise(() => {
    // NEVER RESOLVE
  })
}
