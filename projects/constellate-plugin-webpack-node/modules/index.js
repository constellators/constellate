const fs = require('fs-extra')
const path = require('path')
const { TerminalUtils } = require('constellate-dev-utils')
const bundle = require('./bundle')

const defaultOptions = {
  outputDir: './build',
}

// :: Package, Options -> DevelopAPI
module.exports = function webpackNodeBuildPlugin(pkg, options = {}) {
  const defaultedOptions = Object.assign({}, options, defaultOptions)
  const outputDirPath = path.resolve(pkg.paths.root, defaultedOptions.outputDir)

  return {
    name: 'constellate-plugin-webpack-node',
    build: () => bundle(pkg, defaultedOptions),
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
