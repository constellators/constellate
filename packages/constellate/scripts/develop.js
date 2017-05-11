const path = require('path')
const spawn = require('cross-spawn')
const R = require('ramda')
const chokidar = require('chokidar')
const startDevServer = require('../webpack/startDevServer')
const buildProjects = require('../projects/buildProjects')
const buildProject = require('../projects/buildProject')

process.on('SIGINT', () => {
  // eslint-disable-next-line no-use-before-define
  stopAllServerProjects()
  // eslint-disable-next-line no-use-before-define
  stopAllWebAppProjects()
  // We give a bit of time before calling the process exit.
  setTimeout(() => {
    // console.log('Stopped.')
    process.exit(1)
  }, 5000) // TODO: make grace period configurable
})

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
    console.log(`${project.name} exited with code ${code}`)
  })

  serverProjectMap[project.name] = serverProject
}

// :: string -> void
function stopServerProject({ projectName }) {
  if (serverProjectMap[projectName]) {
    console.log('Stopping', projectName)
    if (serverProjectMap[projectName].stdin) {
      serverProjectMap[projectName].stdin.pause()
    }
    serverProjectMap[projectName].kill('SIGTERM')
  }
}

// :: Project -> void
function reloadServerProject(project) {
  stopServerProject(project.name)
  startServerProject(project)
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
    switch (project.role) {
      case 'server':
        console.log('Reloading server project', project.name)
        buildProject({ project }).then(() => {
          reloadServerProject(project)
        })
        break
      default:
      // do nothing
    }
  }

  projects.forEach((project) => {
    const watcher = chokidar.watch(
      [project.paths.source, path.resolve(project.paths.root, './package.json')],
      { ignoreInitial: true, cwd: project.paths.root, ignorePermissionErrors: true }
    )
    const handleChange = () => reloadProject({ project })
    watcher
      .on('add', handleChange)
      .on('change', handleChange)
      .on('unlink', handleChange)
      .on('addDir', handleChange)
      .on('unlinkDir', handleChange)
  })
}

module.exports = function develop({ projects }) {
  return buildProjects({ projects })
    .then(() => {
      startProjects(projects)
      watchProjects(projects)
    })
    .catch((err) => {
      console.error(err)
      process.exit(2)
    })
}
