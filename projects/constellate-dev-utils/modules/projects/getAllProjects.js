//      

                                          

const { EOL } = require('os')
const fs = require('fs-extra')
const path = require('path')
const toposort = require('toposort')
const readPkg = require('read-pkg')
const R = require('ramda')
const TerminalUtils = require('../terminal')
const AppUtils = require('../app')
const ObjectUtils = require('../objects')
const resolveBuildPlugin = require('../plugins/build/resolveBuildPlugin')
const resolveDevelopPlugin = require('../plugins/develop/resolveDevelopPlugin')
const resolveDeployPlugin = require('../plugins/deploy/resolveDeployPlugin')

let cache = null

const defaultProjectConfig = {
  build: null,
  develop: 'build',
  deploy: null,
  nodeVersion: process.versions.node,
  dependencies: [],
}

// :: Project -> Array<string>
const allDeps = project =>
  (project.dependencies || [])
    .concat(project.devDependencies || [])
    .concat(project.softDependencies || [])

// :: Project -> Array<string>
const linkDeps = project => (project.dependencies || []).concat(project.devDependencies || [])

// :: string -> string -> string
const resolveProjectPath = projectName => relativePath =>
  path.resolve(process.cwd(), `./projects/${projectName}`, relativePath)

// :: string -> Project
const toProject = (projectName) => {
  const appConfig = AppUtils.getConfig()

  const thisProjectPath = resolveProjectPath(projectName)

  const config = ObjectUtils.mergeDeep(
    defaultProjectConfig,
    R.path(['projects', projectName], appConfig) || {},
  )

  const packageJsonPath = thisProjectPath('./package.json')

  if (!fs.pathExistsSync(packageJsonPath)) {
    TerminalUtils.error(`No package.json file found for project ${projectName}`)
    process.exit(1)
  }

  const packageJson = readPkg.sync(packageJsonPath, { normalize: false })

  return {
    name: projectName,
    config,
    packageJson,
    packageName: packageJson.name,
    version: packageJson.version || '0.0.0',
    paths: {
      root: thisProjectPath('./'),
      packageJson: packageJsonPath,
      packageLockJson: thisProjectPath('./package-lock.json'),
      nodeModules: thisProjectPath('./node_modules'),
      webpackCache: thisProjectPath('./.webpackcache'),
    },
  }
}

const resolvePlugin = (project, type, resolver) => {
  const pluginDef = project.config[type]
  if (pluginDef == null) {
    return null
  }
  const config = Array.isArray(pluginDef)
    ? {
      name: pluginDef[0],
      options: pluginDef.length > 1 ? pluginDef[1] : {},
    }
    : { name: pluginDef, options: {} }
  const pluginFactory = resolver(config.name)
  return pluginFactory(project, config.options)
}

function getPlugins(project) {
  return {
    buildPlugin: resolvePlugin(project, 'build', resolveBuildPlugin),
    developPlugin: resolvePlugin(project, 'develop', resolveDevelopPlugin),
    deployPlugin: resolvePlugin(project, 'deploy', resolveDeployPlugin),
  }
}

// :: Array<Project> -> Array<Project>
function orderByDependencies(projects) {
  const packageDependencyGraph = project =>
    R.pipe(allDeps, R.map(dependencyName => [dependencyName, project.name]))(project)

  // :: Array<Project> -> Array<Array<string, string>>
  const dependencyGraph = R.chain(packageDependencyGraph)

  // :: Project -> bool
  const hasNoDependencies = ({ dependencies }) => dependencies.length === 0

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
module.exports = function getAllProjects(skipCache          )             {
  if (!skipCache && cache) {
    return cache
  }

  TerminalUtils.verbose('Resolving project data from disk')

  const projectsRoot = path.resolve(process.cwd(), './projects')

  // :: Array<Project>
  const projects = fs
    .readdirSync(projectsRoot)
    // only include directories
    .filter(file => fs.lstatSync(path.join(projectsRoot, file)).isDirectory())
    // convert into a Project
    .map(toProject)

  // :: Project -> Array<string>
  const getSoftDependencies = project =>
    (project.config.softDependencies || []).reduce((acc, dependencyName) => {
      const dependency = R.find(R.propEq('name', dependencyName), projects)
      if (!dependency) {
        TerminalUtils.warning(
          `Could not find ${dependencyName} referenced as soft dependency for ${project.name}`,
        )
        return acc
      }
      return acc.concat([dependencyName])
    }, [])

  // :: (Project, string) -> Array<string>
  const getDependencies = (allProjects, project, dependencyType) => {
    const targetDependencies = R.path(['packageJson', dependencyType], project)
    if (!targetDependencies) {
      return []
    }
    return Object.keys(targetDependencies).reduce((acc, cur) => {
      const match = allProjects.find(x => x.packageName === cur)
      return match ? [...acc, match.name] : acc
    }, [])
  }

  // :: -> Array<string>
  const getDependants = (allProjects, project) =>
    allProjects.filter(x => R.contains(project.name, allDeps(x))).map(R.prop('name'))

  // :: -> Array<string>
  const getLinkedDependants = (allProjects, project) =>
    allProjects.filter(x => R.contains(project.name, linkDeps(x))).map(R.prop('name'))

  // TODO: getAllDependants and getAllLinkedDependants can be generalised.

  // :: -> Array<string>
  const getAllDependants = (allProjects, project) => {
    const findProject = name => R.find(R.propEq('name', name), allProjects)

    // :: String -> Array<String>
    const resolveDependants = (dependantName) => {
      const dependant = findProject(dependantName)
      return [
        dependant.name,
        ...dependant.dependants,
        ...R.map(resolveDependants, dependant.dependants),
      ]
    }

    const allDependants = R.chain(resolveDependants, project.dependants)

    // Let's get a sorted version of allDependants by filtering allProjects
    // which will already be in a safe build order.
    return allProjects.filter(x => !!R.find(R.equals(x.name), allDependants)).map(R.prop('name'))
  }

  // :: -> Array<string>
  const getAllLinkedDependants = (allProjects, project) => {
    const findProject = name => R.find(R.propEq('name', name), allProjects)

    // :: String -> Array<String>
    const resolveLinkedDependants = (dependantName) => {
      const dependant = findProject(dependantName)
      return [
        dependant.name,
        ...dependant.linkedDependants,
        ...R.map(resolveLinkedDependants, dependant.linkedDependants),
      ]
    }

    const allLinkedDependants = R.chain(resolveLinkedDependants, project.linkedDependants)

    // Let's get a sorted version of allDependants by filtering allProjects
    // which will already be in a safe build order.
    return allProjects
      .filter(x => !!R.find(R.equals(x.name), allLinkedDependants))
      .map(R.prop('name'))
  }

  cache = R.pipe(
    // The projects this project directly depends on.
    allProjects =>
      R.map((project) => {
        const dependencies = getDependencies(allProjects, project, 'dependencies')
        const devDependencies = getDependencies(allProjects, project, 'devDependencies')
        const softDependencies = getSoftDependencies(project)
        return Object.assign({}, project, {
          dependencies,
          devDependencies,
          softDependencies,
        })
      })(allProjects),
    // Projects that directly depend (via link) on this project.
    allProjects =>
      R.map(project =>
        Object.assign({}, project, {
          linkedDependants: getLinkedDependants(allProjects, project),
        }),
      )(allProjects),
    // Projects that directly depend (via link or soft dep) on this project.
    allProjects =>
      R.map(project =>
        Object.assign({}, project, {
          dependants: getDependants(allProjects, project),
        }),
      )(allProjects),
    // Projects ordered based on their dependencies (via link or soft dep)
    // based order, which mean building them in order should be safe.
    orderByDependencies,
    // Add the FULL linked dependant tree
    allProjects =>
      R.map(project =>
        Object.assign(project, {
          allLinkedDependants: getAllLinkedDependants(allProjects, project),
        }),
      )(allProjects),
    // Add the FULL dependant tree
    allProjects =>
      R.map(project =>
        Object.assign(project, {
          allDependants: getAllDependants(allProjects, project),
        }),
      )(allProjects),
    // Attach Plugins
    allProjects =>
      R.map(project =>
        Object.assign(project, {
          plugins: getPlugins(project),
        }),
      )(allProjects),
    // Verbose logging
    R.map((project) => {
      TerminalUtils.verbose(
        `Resolved project ${project.name}:${EOL}${JSON.stringify(project, null, 2)}`,
      )
      return project
    }),
    // Convert into an object map
    R.reduce((acc, cur) => Object.assign(acc, { [cur.name]: cur }), {}),
  )(projects)

  TerminalUtils.verbose(
    `Project build order: \n\t- ${R.values(cache).map(R.prop('name')).join(`${EOL}\t- `)}`,
  )

  return cache
}
