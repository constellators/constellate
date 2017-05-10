#!/usr/bin/env node
/* eslint-disable no-case-declarations */
/* eslint-disable global-require */

const program = require('commander')
const packageJson = require('../package.json')
const getProjects = require('../utils/getProjects')

function resolveProjects(projectsFilter) {
  // TODO
  return getProjects()
}

function list(val) {
  return val.split('..')
}

program.version(packageJson.version)

program
  .command('build')
  .description('build the projects')
  .option('-p, --projects <projects>', 'specify the projects to build', list)
  .action(({ projects }) => {
    console.log('Building projects')
    const build = require('../scripts/build')
    build({ projects: resolveProjects(projects) })
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
