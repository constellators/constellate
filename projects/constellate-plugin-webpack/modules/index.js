const fs = require('fs-extra')
const path = require('path')
const { TerminalUtils } = require('constellate-dev-utils')
const bundle = require('./bundle')
const develop = require('./develop')

const defaultOptions = {
  outputDir: './build',
}

// :: Package, Options -> DevelopAPI
module.exports = function webpackBuildPlugin(pkg, options = {}) {
  const defaultedOptions = Object.assign({}, options, defaultOptions)
  const outputDirPath = path.resolve(pkg.paths.root, defaultedOptions.outputDir)

  return {
    name: 'constellate-plugin-webpack',
    build: () => bundle(pkg, defaultedOptions),
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
    develop: watcher => develop(pkg, options, watcher),
  }
}
