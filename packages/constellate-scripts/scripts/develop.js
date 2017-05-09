const path = require('path')
const spawn = require('cross-spawn')
const R = require('ramda')
const chokidar = require('chokidar')
const startDevServer = require('constellate-webpack/startDevServer')
const getPackages = require('../utils/getPackages')
const buildAllPackages = require('../utils/buildAllPackages')
const buildPackage = require('../utils/buildPackage')

process.on('SIGINT', () => {
  // eslint-disable-next-line no-use-before-define
  stopAllServerPackages()
  // eslint-disable-next-line no-use-before-define
  stopAllWebAppPackages()
  // We give a bit of time before calling the process exit.
  setTimeout(() => {
    // console.log('Stopped.')
    process.exit(1)
  }, 5000) // TODO: make grace period configurable
})

const packages = getPackages()

// Used to track running server processes.
const serverProcessMap = {}

// Used to track running webapp processes.
const webAppProcessMap = {}

const isServerPackage = ({ role }) => role === 'server'
const isWebAppPackage = ({ role }) => role === 'webapp'

// :: PackageInfo -> void
function startServerPackage(packageInfo) {
  const serverProcess = spawn('node', [packageInfo.paths.distEntry], {
    stdio: 'inherit',
  })

  console.log(Object.keys(serverProcess))

  serverProcess.on('close', (code) => {
    if (serverProcessMap[packageInfo.name] === serverProcess) {
      delete serverProcessMap[packageInfo.name]
    }
    console.log(`${packageInfo.name} exited with code ${code}`)
  })

  serverProcessMap[packageInfo.name] = serverProcess
}

function stopServerProcess(processName) {
  if (serverProcessMap[processName]) {
    console.log('Stopping', processName)
    if (serverProcessMap[processName].stdin) {
      serverProcessMap[processName].stdin.pause()
    }
    serverProcessMap[processName].kill('SIGTERM')
  }
}

// :: PackageInfo -> void
function reloadServerPackage(packageInfo) {
  stopServerProcess(packageInfo.name)
  startServerPackage(packageInfo)
}

// :: void -> void
function stopAllServerPackages() {
  Object.keys(serverProcessMap).forEach(stopServerProcess)
}

// :: void -> void
function startWebAppPackage(packageInfo) {
  const webAppServer = startDevServer({ packageInfo })
  webAppProcessMap[packageInfo.name] = webAppServer
}

function stopWebAppProcess(processName) {
  if (webAppProcessMap[processName]) {
    console.log('Stopping', processName)
    webAppProcessMap[processName].close(() => undefined)
  }
}

// :: void -> void
function stopAllWebAppPackages() {
  Object.keys(webAppProcessMap).forEach(stopWebAppProcess)
}

// :: void -> void
function startPackages() {
  const serverPackages = R.filter(isServerPackage, packages)
  const webAppPackages = R.filter(isWebAppPackage, packages)
  serverPackages.forEach(startServerPackage)
  webAppPackages.forEach(startWebAppPackage)
}

// :: void -> void
function watchPackages() {
  const reloadPackage = ({ packageInfo }) => {
    switch (packageInfo.role) {
      case 'server':
        console.log('Reloading server package', packageInfo.name)
        buildPackage({ packageInfo }).then(() => {
          reloadServerPackage(packageInfo)
        })
        break
      default:
      // do nothing
    }
  }

  packages.forEach((packageInfo) => {
    const watcher = chokidar.watch(
      [packageInfo.paths.source, path.resolve(packageInfo.paths.root, './package.json')],
      { ignoreInitial: true, cwd: packageInfo.paths.root, ignorePermissionErrors: true }
    )
    const handleChange = () => reloadPackage({ packageInfo })
    watcher
      .on('add', handleChange)
      .on('change', handleChange)
      .on('unlink', handleChange)
      .on('addDir', handleChange)
      .on('unlinkDir', handleChange)
  })
}

buildAllPackages()
  .then(() => {
    startPackages()
    watchPackages()
  })
  .catch((err) => {
    console.error(err)
    process.exit(2)
  })
