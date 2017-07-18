const R = require('ramda')
const ProjectUtils = require('constellate-dev-utils/modules/projects')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')

module.exports = async function linkProjects() {
  TerminalUtils.title('Running linking process...')

  const allProjects = ProjectUtils.getAllProjects()
  const allProjectsArray = R.sortBy(R.prop('name'), ProjectUtils.getAllProjectsArray())

  if (allProjectsArray.length < 2) {
    throw new Error('You need at least 2 projects in order to create a link')
  }

  const projectToLinkTo = await TerminalUtils.select(
    'Which project do you want to add the links to? (i.e. update their dependencies)',
    {
      choices: allProjectsArray.map(p => ({
        value: p.name,
        name: p.name,
      })),
    },
  )

  TerminalUtils.verbose(`Chosen project: ${projectToLinkTo}`)

  const projectsToLink = await TerminalUtils.multiSelect(
    `Which project do you want to add as linked dependencies on ${projectToLinkTo}?`,
    {
      choices: allProjectsArray.filter(p => p.name !== projectToLinkTo).map(p => ({
        value: p.name,
        name: p.name,
      })),
    },
  )

  if (projectsToLink.length === 0) {
    TerminalUtils.info('No projects selected, exiting...')
    process.exit(0)
  }

  TerminalUtils.verbose(`Chosen linked dependencies: [${projectsToLink.join(', ')}]`)

  const dependencyType = await TerminalUtils.select(
    'What type of dependency should we link them as?',
    {
      choices: [
        { value: 'dependencies', name: 'dependencies' },
        { value: 'devDependencies', name: 'devDependencies' },
      ],
    },
  )

  TerminalUtils.verbose(`Chosen dependency type: ${dependencyType}`)

  const targetProject = allProjects[projectToLinkTo]
  const sourceProjects = projectsToLink.map(x => allProjects[x])

  ProjectUtils.addLinkedDependencies(targetProject, sourceProjects, dependencyType)

  // Ensure sym links are created.
  ProjectUtils.linkAllProjects()

  TerminalUtils.success('Done')
}
