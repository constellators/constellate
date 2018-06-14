// @flow

import type {
  Package,
  BuildPlugin,
  DevelopPlugin,
} from 'constellate-dev-utils/build/types'

const fs = require('fs-extra')
const { TerminalUtils } = require('constellate-dev-utils')
const bundle = require('./bundle')
const develop = require('./develop')

// :: Package, Options -> DevelopAPI
module.exports = function webpackBuildPlugin(
  pkg: Package,
): BuildPlugin & DevelopPlugin {
  return {
    name: 'constellate-plugin-webpack',
    build: () => bundle(pkg),
    clean: () =>
      new Promise(resolve => {
        if (fs.pathExistsSync(pkg.paths.packageBuildOutput)) {
          fs.removeSync(pkg.paths.packageBuildOutput)
        }
        resolve()
      }),
    deploy: () => {
      TerminalUtils.error('"deploy" not supported by "webpack" plugin')
      process.exit(1)
    },
    develop: watcher => develop(pkg, watcher),
  }
}
