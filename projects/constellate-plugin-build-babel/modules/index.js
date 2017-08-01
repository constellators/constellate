const path = require('path')
const babel = require('babel-core')
const pify = require('pify')
const pLimit = require('p-limit')
const R = require('ramda')
const fs = require('fs-extra')
const globby = require('globby')
const generateConfig = require('./generateConfig')

// Having concurrent babel transpilations seems to break the sourcemap output.
// Incorrect sources get mapped - I wonder if there is a shared global state
// that references the "current" file being transpiled for reference in a
// sourcemap.
const maxConcurrentTranspiles = 1

// :: (..args) => Promise<BabelTransformFileResult>
const transformFile = pify(babel.transformFile)

// :: string -> void
const ensureParentDirectoryExists = (filePath) => {
  const dir = path.dirname(filePath)
  fs.ensureDirSync(dir)
}

// :: Project, Options -> DevelopAPI
module.exports = function babelBuildPlugin(project, options) {
  const buildOutputRoot = path.resolve(project.paths.root, options.outputDir || './dist')

  // :: string -> Array<string>
  const getJsFilePaths = () =>
    globby((options.inputs || ['!__tests__', '!test.js', '**/*.jsx?']).concat(['!node_modules']), {
      cwd: project.paths.root,
    })

  return {
    build: () =>
      getJsFilePaths().then((filePaths) => {
        // :: Object
        const babelConfig = generateConfig(project, options)

        // :: string -> Promise<void>
        const transpileFile = (filePath) => {
          const writeTranspiledFile = (result) => {
            const outFile = path.resolve(buildOutputRoot, filePath)
            ensureParentDirectoryExists(outFile)
            fs.writeFileSync(outFile, result.code, { encoding: 'utf8' })
            fs.writeFileSync(`${outFile}.map`, JSON.stringify(result.map), { encoding: 'utf8' })
          }
          const module = path.resolve(project.paths.root, filePath)
          return transformFile(module, babelConfig).then(writeTranspiledFile)
        }

        const limit = pLimit(maxConcurrentTranspiles)
        const queueTranspile = filePath => limit(() => transpileFile(filePath))
        return Promise.all(R.map(queueTranspile, filePaths))
      }),
    clean: () =>
      new Promise((resolve) => {
        if (fs.pathExistsSync(buildOutputRoot)) {
          fs.removeSync(buildOutputRoot)
        }
        resolve()
      }),
    outputDir: () => buildOutputRoot,
  }
}
