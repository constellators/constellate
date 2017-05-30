const fs = require('fs')
const path = require('path')
const toposort = require('toposort')
const R = require('ramda')
const terminal = require('constellate-dev-utils/terminal')
const getAppConfig = require('../app/getAppConfig')

const defaultConfig = {
  target: 'node',
  role: 'library',
  compiler: 'babel',
}

// :: string -> string -> string
const resolveProjectPath = projectName => relativePath =>
  path.resolve(process.cwd(), `./projects/${projectName}`, relativePath)

// :: string -> Project
const toProject = (projectName) => {
  const appConfig = getAppConfig()

  const thisProjectPath = resolveProjectPath(projectName)
  const constellateConfigPath = thisProjectPath('./constellate.js')
  const config = Object.assign(
    {},
    defaultConfig,
    appConfig.projectDefaults || {},
    // eslint-disable-next-line global-require, import/no-dynamic-require
    fs.existsSync(constellateConfigPath) ? require(constellateConfigPath) : {}
  )
  const buildRoot = path.resolve(process.cwd(), `./build/${projectName}`)
  return {
    name: projectName,
    config,
    paths: {
      root: thisProjectPath('./'),
      constellateConfig: constellateConfigPath,
      packageJson: thisProjectPath('./package.json'),
      nodeModules: thisProjectPath('./node_modules'),
      modules: thisProjectPath('./modules'),
      modulesEntry: thisProjectPath('./modules/index.js'),
      buildRoot,
      buildModules: path.resolve(buildRoot, './modules'),
      buildModulesEntry: path.resolve(buildRoot, './modules/index.js'),
      webpackCache: path.resolve(buildRoot, './.webpackcache'),
    },
  }
}

// :: Array<Project> -> Array<Project>
function orderByLinkedDependencies(projects) {
  const packageDependencyGraph = project =>
    R.pipe(R.prop('dependencies'), R.map(dependencyName => [dependencyName, project.name]))(project)

  // :: Array<Project> -> Array<Array<string, string>>
  const dependencyGraph = R.chain(packageDependencyGraph)

  // :: Project -> bool
  const hasNoDependencies = ({ dependencies }) => dependencies.length === 0

  // :: Array<Project>
  const projectsWithNoDependencies = R.pipe(R.filter(hasNoDependencies), R.map(R.prop('name')))(
    projects
  )

  // :: string -> Project
  const findProjectByName = R.map(name => R.find(R.propEq('name', name), projects))

  return R.pipe(
    dependencyGraph,
    toposort,
    R.without(projectsWithNoDependencies),
    R.concat(projectsWithNoDependencies),
    findProjectByName
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
function getAllProjects() {
  const projectsRoot = path.resolve(process.cwd(), './projects')

  // :: Array<Project>
  const projects = fs
    .readdirSync(projectsRoot)
    // only include directories
    .filter(file => fs.lstatSync(path.join(projectsRoot, file)).isDirectory())
    // convert into a Project
    .map(toProject)

  // :: Project -> Array<string>
  const getConfiguredDependencies = project => R.path(['config', 'dependencies'], project) || []

  // :: Project -> Array<string>
  const getDependencies = project =>
    getConfiguredDependencies(project).reduce((acc, dependencyName) => {
      const dependency = R.find(R.propEq('name', dependencyName), projects)
      if (!dependency) {
        terminal.warning(
          `Could not find ${dependencyName} referenced as dependency for ${project.name}`
        )
        return acc
      }
      return acc.concat([dependencyName])
    }, [])

  // :: Project -> Array<string>
  const getDependants = project =>
    projects.filter(x => R.contains(project.name, getConfiguredDependencies(x))).map(R.prop('name'))

  const fullyResolvedProjects = R.pipe(
    // The projects this project directly depends on.
    R.map(project =>
      Object.assign(project, {
        dependencies: getDependencies(project),
      })
    ),
    // Projects that directly depend on this project.
    R.map(project =>
      Object.assign(project, {
        dependants: getDependants(project),
      })
    ),
    // Projects ordered based on their dependencies based order,
    // which mean building them in order should be safe.
    orderByLinkedDependencies
  )(projects)

  terminal.verbose(
    `Project build order: \n\t- ${fullyResolvedProjects.map(R.prop('name')).join('\n\t- ')}`
  )

  return fullyResolvedProjects
}

/**
 * Resolves the projects for the Constellate application.
 *
 * @param  {Array}  [projectFilters=[]]
 *         The names of the projects to resolve. If none is specified then
 *         all of them are resolved.
 *
 * @return {Promise} The resolved projects
 */
module.exports = function resolveProjects(projectFilters = []) {
  return new Promise((resolve, reject) => {
    const allProjects = getAllProjects()
    if (allProjects.length === 0) {
      reject(new Error('Could not find any projects.'))
    } else if (projectFilters.length === 0) {
      resolve(allProjects)
    } else {
      const allProjectNames = allProjects.map(R.prop('name'))
      const invalidFilters = R.without(allProjectNames, projectFilters)
      if (invalidFilters.length > 0) {
        reject(new Error(`The following projects could not be resolved:\n[${invalidFilters}]`))
      }
      const findProject = name => R.find(p => p.name === name, allProjects)
      resolve(projectFilters.map(findProject))
    }
  })
}
