const fs = require('fs')
const pathResolve = require('path').resolve
const toposort = require('toposort')
const R = require('ramda')

const defaultConfig = {
  target: 'node',
  role: 'library',
}

// :: string -> string -> string
const resolveProjectPath = projectName => relativePath =>
  pathResolve(process.cwd(), `./projects/${projectName}`, relativePath)

// :: string -> Project
const getProject = (projectName) => {
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
      dist: thisProjectPath('./dist'),
      distEntry: thisProjectPath('./dist/index.js'),
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
  // :: Array<Project>
  const projects = fs.readdirSync(pathResolve(process.cwd(), './projects')).map(getProject)

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

  const getDependants = (project) => {
    // each dep resolve project
    const dependants = projects.filter(({ name }) => R.contains(name, project.dependencies))
    return dependants.concat(dependants.map(getDependants))
  }

  return R.pipe(
    // Attach dependencies to each project
    R.map(project =>
      Object.assign(project, {
        dependencies: getDependencies(project),
        dependants: getDependants(project),
      })
    ),
    // Projects ordered based on their dependencies based order,
    // which mean building them in order would be "safe"/"correct".
    orderProjectsByDependencies
  )(projects)
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
