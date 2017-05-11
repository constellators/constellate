#!/usr/bin/env node
/* eslint-disable no-case-declarations */
/* eslint-disable global-require */

const program = require('commander')
const terminal = require('constellate-utils/terminal')
const packageJson = require('../package.json')
const resolveProjects = require('../projects/resolveProjects')

function list(val) {
  return val.split('..')
}

program.version(packageJson.version)

program
  .command('build')
  .description('build the projects')
  .option('-p, --projects <projects>', 'specify the projects to build', list)
  .action(({ projects }) => {
    terminal.unitOfWork({
      work: () => {
        const build = require('../scripts/build')
        return resolveProjects(projects).then(resolved => build({ projects: resolved }))
      },
      text: 'Running build...',
      successText: 'Build succeeded',
      errorText: 'Build failed',
      exitOnError: true,
    })
  })

program
  .command('develop')
  .description('run development servers for the projects')
  .option('-p, --projects <projects>', 'specify the projects to develop', list)
  .action(({ projects }) => {
    terminal.info('Starting development environment...')
    const develop = require('../scripts/develop')
    resolveProjects(projects).then(resolved => develop({ projects: resolved }))
  })

program.parse(process.argv)
