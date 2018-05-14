const fs = require('fs-extra')
const path = require('path')
const { TerminalUtils } = require('constellate-dev-utils')
const bundle = require('./bundle')

const defaultOptions = {
  outputDir: './build',
}

// :: Project, Options -> DevelopAPI
module.exports = function webpackNodeBuildPlugin(project, options = {}) {
  const defaultedOptions = Object.assign({}, options, defaultOptions)
  const outputDirPath = path.resolve(
    project.paths.root,
    defaultedOptions.outputDir,
  )

  return {
    build: () => bundle(project, defaultedOptions),
    clean: () =>
      new Promise(resolve => {
        if (fs.pathExistsSync(outputDirPath)) {
          fs.removeSync(outputDirPath)
        }
        resolve()
      }),
    deploy: () => {
      TerminalUtils.error('"deploy" not supported by "webpack-node" plugin')
      process.exit(1)
    },
    develop: () => {
      TerminalUtils.error(
        '"develop" not supported by "webpack-node" plugin. Why not try the "server" plugin instead.',
      )
      process.exit(1)
    },
  }
}
