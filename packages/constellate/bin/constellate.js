#!/usr/bin/env node
/* eslint-disable no-case-declarations */
/* eslint-disable global-require */

const program = require('commander')
const terminal = require('constellate-utils/terminal')
const packageJson = require('../package.json')
const resolveProjects = require('../utils/resolveProjects')

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
      text: 'Building projects',
    })
  })

program
  .command('develop')
  .description('run development servers for the projects')
  .option('-p, --projects <projects>', 'specify the projects to develop', list)
  .action(({ projects }) => {
    console.log('Running development servers')
    const develop = require('../scripts/develop')
    develop({ projects: resolveProjects(projects) })
  })

program.parse(process.argv)
