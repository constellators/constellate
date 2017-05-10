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
      Object.assign({}, defaultConfig, require(constellateConfigPath)())
    : defaultConfig
  return {
    name: projectName,
    config,
    paths: {
      root: thisProjectPath('./'),
      constellateConfig: constellateConfigPath,
      packageJson: packageJsonPath,
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

// :: (string, Project) -> Array<string>
const getDependencies = (dependenciesType, project) =>
  R.pipe(R.path(['packageJson', dependenciesType]), R.defaultTo({}), R.keys)(project)

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

  // :: Array<String>
  const projectNames = R.map(R.prop('name'), projects)

  // :: String -> Boolean
  const containsProjectName = R.contains(R.__, projectNames)

  // :: Project -> Array<String>
  const getProjectDependencies = (project) => {
    const combinedDependencies = R.concat(
      getDependencies('dependencies', project),
      getDependencies('devDependencies', project)
    )
    return R.pipe(R.uniq, R.filter(containsProjectName))(combinedDependencies)
  }

  // Attach dependencies to each project
  projects.map(info =>
    Object.assign(info, {
      dependencies: getProjectDependencies(info),
    })
  )

  // We return the projects ordered based on their dependencies based order,
  // which mean building them in order would be "safe"/"correct".
  return orderProjectsByDependencies(projects)
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
