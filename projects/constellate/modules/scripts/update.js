const pSeries = require('p-series')
const ChildProcessUtils = require('constellate-dev-utils/modules/childProcess')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')

module.exports = function update(projects) {
  // Then run update for each the projects
  return pSeries(
    projects.map(project => () => {
      TerminalUtils.info(`Checking for updates on ${project.name}'s dependencies`)
      ChildProcessUtils.execSync('npm-check', ['-u'], {
        cwd: project.paths.root,
        stdio: 'inherit',
      })
    }),
  )
}
