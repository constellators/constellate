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
 * Gets the projects for a project ordered based on their dependency graph.
 * i.e. build in order.
 *
 * @return {Array<Project>} The project meta object
 */
module.exports = function getProjects() {
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
