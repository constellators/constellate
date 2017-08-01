const fs = require('fs-extra')
const path = require('path')
const bundle = require('./bundle')

// :: Project, Options -> DevelopAPI
module.exports = function webpackNodeBuildPlugin(project, options) {
  const outputDirPath = path.resolve(project.paths.root, options.outputDir)

  return {
    build: () => bundle(project, options),
    clean: () =>
      new Promise((resolve) => {
        if (fs.pathExistsSync(outputDirPath)) {
          fs.removeSync(outputDirPath)
        }
        resolve()
      }),
  }
}
