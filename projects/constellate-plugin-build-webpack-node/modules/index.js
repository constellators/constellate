const fs = require('fs-extra')
const path = require('path')
const bundle = require('./bundle')

const defaultOptions = {
  outputDir: './dist',
}

// :: Project, Options -> DevelopAPI
module.exports = function webpackNodeBuildPlugin(project, options = {}) {
  const defaultedOptions = Object.assign({}, options, defaultOptions)
  const outputDirPath = path.resolve(project.paths.root, defaultedOptions.outputDir)

  return {
    build: () => bundle(project, defaultedOptions),
    clean: () =>
      new Promise((resolve) => {
        if (fs.pathExistsSync(outputDirPath)) {
          fs.removeSync(outputDirPath)
        }
        resolve()
      }),
    outputDir: () => outputDirPath,
  }
}
