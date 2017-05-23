#!/usr/bin/env node
/* eslint-disable no-case-declarations */
/* eslint-disable global-require */

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
  throw err
})

const program = require('commander')
const terminal = require('constellate-utils/terminal')

const packageJson = require('../package.json')
const resolveProjects = require('../projects/resolveProjects')

function list(val) {
  return val.split('..')
}

console.log(`\nConstellate v${packageJson.version}\n`)

program.version(packageJson.version)

program
  .command('build')
  .description('build the projects')
  .option('-p, --projects <projects>', 'specify the projects to build', list)
  .action(({ projects }) => {
    terminal.info('Running build')
    const build = require('../scripts/build')
    return resolveProjects(projects)
      .then(resolved => build({ projects: resolved }))
      .then(() => terminal.success('Build succeeded'), err => terminal.error('Build failed', err))
  })

program
  .command('develop')
  .description('run development servers for the projects')
  .option('-p, --projects <projects>', 'specify the projects to develop', list)
  .action(({ projects }) => {
    terminal.info('Starting develop mode')
    const develop = require('../scripts/develop')
    resolveProjects(projects).then(develop)
  })

program.parse(process.argv)
