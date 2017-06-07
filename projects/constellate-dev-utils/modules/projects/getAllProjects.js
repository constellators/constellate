const fs = require('fs-extra')
const path = require('path')
const toposort = require('toposort')
const R = require('ramda')
const TerminalUtils = require('../terminal')
const AppUtils = require('../app')

let cache = null

const defaultConfig = {
  role: 'library', // server, client
  compiler: 'babel', // 'webpack', 'webpack-node', 'none'
  nodeVersion: process.versions.node,
  allDependencies: [],
  dependencies: [],
  bundledDependencies: [],
}

// :: string -> string -> string
const resolveProjectPath = projectName => relativePath =>
  path.resolve(process.cwd(), `./projects/${projectName}`, relativePath)

// :: string -> Project
const toProject = (projectName) => {
  const appConfig = AppUtils.getConfig()

  const thisProjectPath = resolveProjectPath(projectName)
  // const constellateConfigPath = thisProjectPath('./constellate.js')
  const config = Object.assign(
    {},
    defaultConfig,
    appConfig.projectDefaults || {},
    R.path(['projects', projectName], appConfig) || {},
  )
  const buildRoot = path.resolve(process.cwd(), `./build/${projectName}`)
  return {
    name: projectName,
    config,
    paths: {
      root: thisProjectPath('./'),
      packageJson: thisProjectPath('./package.json'),
      packageLockJson: thisProjectPath('./package-lock.json'),
      nodeModules: thisProjectPath('./node_modules'),
      modules: thisProjectPath('./modules'),
      modulesEntry: thisProjectPath('./modules/index.js'),
      buildRoot,
      buildPackageJson: path.resolve(buildRoot, './package.json'),
      buildModules: path.resolve(buildRoot, './modules'),
      buildModulesEntry: path.resolve(buildRoot, './modules/index.js'),
      buildNodeModules: path.resolve(buildRoot, './node_modules'),
      webpackCache: path.resolve(buildRoot, './.webpackcache'),
    },
  }
}

// :: Array<Project> -> Array<Project>
function orderByAllDependencies(projects) {
  const packageDependencyGraph = project =>
    R.pipe(R.prop('allDependencies'), R.map(dependencyName => [dependencyName, project.name]))(
      project,
    )

  // :: Array<Project> -> Array<Array<string, string>>
  const dependencyGraph = R.chain(packageDependencyGraph)

  // :: Project -> bool
  const hasNoDependencies = ({ allDependencies }) => allDependencies.length === 0

  // :: Array<Project>
  const projectsWithNoDependencies = R.pipe(R.filter(hasNoDependencies), R.map(R.prop('name')))(
    projects,
  )

  // :: string -> Project
  const findProjectByName = R.map(name => R.find(R.propEq('name', name), projects))

  return R.pipe(
    dependencyGraph,
    toposort,
    R.without(projectsWithNoDependencies),
    R.concat(projectsWithNoDependencies),
    findProjectByName,
  )(projects)
}

/**
 * Gets all the projects for the constellate application.
 *
 * The projects are ordered based on their dependency graph.
 * i.e. build them in order.
 *
 * @return {Array<Project>} The project meta object
 */
module.exports = function getAllProjects() {
  if (cache) {
    return cache
  }

  const projectsRoot = path.resolve(process.cwd(), './projects')

  // :: Array<Project>
  const projects = fs
    .readdirSync(projectsRoot)
    // only include directories
    .filter(file => fs.lstatSync(path.join(projectsRoot, file)).isDirectory())
    // convert into a Project
    .map(toProject)

  // :: Project -> Array<string>
  const getDependencies = (project, dependencyType) =>
    project.config[dependencyType].reduce((acc, dependencyName) => {
      const dependency = R.find(R.propEq('name', dependencyName), projects)
      if (!dependency) {
        TerminalUtils.warning(
          `Could not find ${dependencyName} referenced as dependency for ${project.name}`,
        )
        return acc
      }
      return acc.concat([dependencyName])
    }, [])

  // :: Project -> Array<string>
  const getDependants = project =>
    projects.filter(x => R.contains(project.name, x.allDependencies)).map(R.prop('name'))

  cache = R.pipe(
    // The projects this project directly depends on.
    R.map((project) => {
      const dependencies = getDependencies(project, 'dependencies')
      const bundledDependencies = getDependencies(project, 'bundledDependencies')
      return Object.assign(project, {
        dependencies,
        bundledDependencies,
        allDependencies: [...dependencies, ...bundledDependencies],
      })
    }),
    // Projects that directly depend on this project.
    R.map(project =>
      Object.assign(project, {
        dependants: getDependants(project),
      }),
    ),
    R.map(project =>
      Object.assign(project, {
        allDependencies: [...project.dependencies, ...project.bundledDependencies],
      }),
    ),
    // Projects ordered based on their dependencies based order,
    // which mean building them in order should be safe.
    orderByAllDependencies,
  )(projects)

  TerminalUtils.verbose(`Project build order: \n\t- ${cache.map(R.prop('name')).join('\n\t- ')}`)

  return cache
}
