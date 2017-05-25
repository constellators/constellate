const fs = require('fs')
const path = require('path')
const toposort = require('toposort')
const R = require('ramda')

const defaultConfig = {
  target: 'node',
  role: 'library',
}

// :: string -> string -> string
const resolveProjectPath = projectName => relativePath =>
  path.resolve(process.cwd(), `./projects/${projectName}`, relativePath)

// :: string -> Project
const toProject = (projectName) => {
  const thisProjectPath = resolveProjectPath(projectName)
  const packageJsonPath = thisProjectPath('./package.json')
  const constellateConfigPath = thisProjectPath('./constellate.js')
  const config = fs.existsSync(constellateConfigPath)
    ? // eslint-disable-next-line global-require, import/no-dynamic-require
      Object.assign({}, defaultConfig, require(constellateConfigPath))
    : defaultConfig
  return {
    name: projectName,
    config,
    paths: {
      root: thisProjectPath('./'),
      constellateConfig: constellateConfigPath,
      packageJson: packageJsonPath,
      nodeModules: thisProjectPath('./node_modules'),
      source: thisProjectPath('./modules'),
      sourceEntry: thisProjectPath('./modules/index.js'),
      build: thisProjectPath('./build'),
      buildEntry: thisProjectPath('./build/index.js'),
      webpackCache: thisProjectPath('./.webpackcache'),
    },
    packageJson: fs.existsSync(packageJsonPath)
      ? // eslint-disable-next-line global-require, import/no-dynamic-require
        JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf8' }))
      : {},
  }
}

// :: Array<Project> -> Array<Project>
function orderProjectsByDependencies(projects) {
  const packageDependencyGraph = project =>
    R.pipe(R.prop('dependencies'), R.map(dependency => [dependency, project.name]))(project)

  // :: Array<Project> -> Array<Array<string, string>>
  const dependencyGraph = R.chain(packageDependencyGraph)

  // :: Project -> bool
  const hasNoDependencies = ({ dependencies }) => dependencies.length === 0

  // :: Array<Project>
  const projectsWithNoDependencies = R.pipe(R.filter(hasNoDependencies), R.map(R.prop('name')))(
    projects
  )

  // :: string -> Project
  const findProjectByName = name => R.find(R.propEq('name', name), projects)

  return R.pipe(
    dependencyGraph,
    toposort,
    R.without(projectsWithNoDependencies),
    R.concat(projectsWithNoDependencies),
    R.map(findProjectByName)
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

  // :: Array<string>
  const projectNames = R.map(R.prop('name'), projects)

  // :: Project -> Array<String>
  const getDependencies = (project) => {
    // :: (string, Project) -> Array<string>
    const readPackageDependencies = dependenciesType =>
      R.pipe(R.path(['packageJson', dependenciesType]), R.defaultTo({}), R.keys)(project)
    const combinedDependencies = R.concat(
      readPackageDependencies('dependencies'),
      readPackageDependencies('devDependencies')
    )
    // :: string -> boolean
    const isContellateProject = R.contains(R.__, projectNames)
    // :: Array<string> -> Array<string>
    const filterToConstellateProjects = R.pipe(R.uniq, R.filter(isContellateProject))
    return filterToConstellateProjects(combinedDependencies)
  }

  // :: Project -> Array<string>
  const getDependants = (project) => {
    // We will recursively resolve the dependants for the project.
    const loop = (targetProject) => {
      const dependants = projects.filter(x => R.contains(targetProject.name, x.dependencies))
      const dependantsDependants = R.chain(loop, dependants)
      return dependants.concat(dependantsDependants)
    }
    return R.pipe(
      // Do the recursive resolve
      loop,
      // Map to name of each project
      R.map(R.prop('name')),
      // Ensure we return unique results
      R.uniq
    )(project)
  }

  const fullyResolvedProjects = R.pipe(
    // Attach dependencies to each project
    R.map(project =>
      Object.assign(project, {
        dependencies: getDependencies(project),
      })
    ),
    // Attach dependants to each project
    R.map(project =>
      Object.assign(project, {
        dependants: getDependants(project),
      })
    ),
    // Projects ordered based on their dependencies based order,
    // which mean building them in order would be "safe"/"correct".
    orderProjectsByDependencies
  )(projects)

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
