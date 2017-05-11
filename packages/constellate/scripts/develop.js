const path = require('path')
const spawn = require('cross-spawn')
const R = require('ramda')
const chokidar = require('chokidar')
const terminal = require('constellate-utils/terminal')
const startDevServer = require('../webpack/startDevServer')
const buildProjects = require('../projects/buildProjects')
const buildProject = require('../projects/buildProject')

// Used to track running server processes.
const serverProjectMap = {}

// Used to track running webapp processes.
const webAppProjectMap = {}

const isServerProject = project => project.config.role === 'server'
const isWebAppProject = project => project.config.role === 'webapp'

// :: Project -> void
function startServerProject(project) {
  const serverProject = spawn('node', [project.paths.distEntry], {
    stdio: 'inherit',
  })

  serverProject.on('close', (code) => {
    if (serverProjectMap[project.name] === serverProject) {
      delete serverProjectMap[project.name]
    }
    terminal.verbose(`${project.name} exited with code ${code}`)
  })

  serverProjectMap[project.name] = serverProject
}

// :: string -> Promise
function stopServerProject(projectName) {
  return new Promise((resolve) => {
    const serverProcess = serverProjectMap[projectName]
    if (serverProcess) {
      terminal.verbose(`Stopping ${projectName}`)
      serverProcess.on('close', () => {
        resolve()
      })
      if (serverProcess.stdin) {
        serverProcess.stdin.pause()
      }
      serverProcess.kill('SIGTERM')
    } else {
      resolve()
    }
  })
}

// :: Project -> void
function reloadServerProject(project) {
  stopServerProject(project.name).then(() => buildProject({ project })).then(() => {
    startServerProject(project)
  })
}

// :: void -> void
function stopAllServerProjects() {
  Object.keys(serverProjectMap).forEach(projectName => stopServerProject({ projectName }))
}

// :: void -> void
function startWebAppProject(project) {
  const webAppServer = startDevServer({ project })
  webAppProjectMap[project.name] = webAppServer
}

// :: string -> void
function stopWebAppProject(projectName) {
  if (webAppProjectMap[projectName]) {
    console.log('Stopping', projectName)
    webAppProjectMap[projectName].close(() => undefined)
  }
}

// :: void -> void
function stopAllWebAppProjects() {
  Object.keys(webAppProjectMap).forEach(stopWebAppProject)
}

// :: void -> void
function startProjects(projects) {
  const serverProjects = R.filter(isServerProject, projects)
  const webAppProjects = R.filter(isWebAppProject, projects)
  serverProjects.forEach(startServerProject)
  webAppProjects.forEach(startWebAppProject)
}

// :: void -> void
function watchProjects(projects) {
  const reloadProject = (project) => {
    terminal.verbose(`Handling change in ${project.name}`)
    switch (project.config.role) {
      case 'server':
        terminal.verbose('Reloading server project', project.name)
        reloadServerProject(project)
        break
      default:
        terminal.verbose(
          `No reload strategy exists for type ${project.name} (${project.config.role})`
        )
    }
  }

  projects.filter(x => !isWebAppProject(x)).forEach((project) => {
    terminal.verbose(`Setting up watcher for ${project.name}`)
    const watcher = chokidar.watch(
      [project.paths.source, path.resolve(project.paths.root, './package.json')],
      { ignoreInitial: true, cwd: project.paths.root, ignorePermissionErrors: true }
    )
    const handleChange = () => reloadProject(project)
    watcher
      .on('add', handleChange)
      .on('change', handleChange)
      .on('unlink', handleChange)
      .on('addDir', handleChange)
      .on('unlinkDir', handleChange)
  })
}

let shuttingDown = false

function performGracefulShutdown(exitCode = 1) {
  // Avoid multiple calls (e.g. if ctrl+c pressed multiple times)
  if (shuttingDown) return
  shuttingDown = true
  // Perform the shutdown process...
  terminal.unitOfWork({
    work: () =>
      new Promise((resolve) => {
        stopAllServerProjects()
        stopAllWebAppProjects()
        // We give a bit of time before calling the process exit.
        setTimeout(() => {
          resolve()
          // console.log('Stopped.')
          process.exit(exitCode)
        }, 5000) // TODO: make grace period configurable
      }),
    text: 'Shutting down development environment...',
    successText: 'Development environment shut down',
    errorText: 'Failed to shut down development environment',
    logError: true,
  })
}

process.on('SIGINT', () => {
  performGracefulShutdown(0)
})

module.exports = function develop({ projects }) {
  return buildProjects({ projects })
    .then(() => {
      startProjects(projects)
      watchProjects(projects)
    })
    .catch((err) => {
      console.error(err)
      performGracefulShutdown(2)
    })
}
