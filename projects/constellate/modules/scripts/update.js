const path = require('path')
const pSeries = require('p-series')
const ChildProcessUtils = require('constellate-dev-utils/modules/childProcess')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ProjectUtils = require('constellate-dev-utils/modules/projects')

module.exports = async function update() {
  TerminalUtils.title('Running update...')

  const allProjects = ProjectUtils.getAllProjects()

  // Remove sym links projects first as this messes with the package resolving.
  ProjectUtils.unlinkAllProjects()

  const npmCheckPath = path.resolve(process.cwd(), './node_modules/.bin/npm-check')

  // Then run update for each the projects
  await pSeries(
    ProjectUtils.getAllProjectsArray().map(project => () => {
      const linkedDependencies = project.dependencies.map(x => allProjects[x])
      const linkedDevDependencies = project.devDependencies.map(x => allProjects[x])
      const relinkDeps = () => {
        ProjectUtils.addLinkedDependencies(project, linkedDependencies, 'dependencies')
        ProjectUtils.addLinkedDependencies(project, linkedDevDependencies, 'devDependencies')
      }
      ProjectUtils.removeLinkedDependencies(
        project,
        linkedDependencies.concat(linkedDevDependencies),
      )
      try {
        TerminalUtils.info(`Checking for updates on ${project.name}'s dependencies`)
        ChildProcessUtils.execSync(npmCheckPath, ['-u'], {
          cwd: project.paths.root,
          stdio: 'inherit',
        })
      } catch (err) {
        relinkDeps()
        throw err
      }
      relinkDeps()
    }),
  )

  // Link the projects again
  ProjectUtils.linkAllProjects()

  TerminalUtils.success('Done')
}
