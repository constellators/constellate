const fs = require('fs-extra')
const path = require('path')
const { TerminalUtils } = require('constellate-dev-utils')
const bundle = require('./bundle')
const develop = require('./develop')

const defaultOptions = {
  outputDir: './dist',
}

// :: Project, Options -> DevelopAPI
module.exports = function webpackBuildPlugin(project, options = {}) {
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
      TerminalUtils.error('"deploy" not supported by "webpack" plugin')
      process.exit(1)
    },
    develop: watcher => develop(project, options, watcher),
  }
}
