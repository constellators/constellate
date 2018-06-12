const path = require('path')
const babel = require('babel-core')
const pify = require('pify')
const pLimit = require('p-limit')
const R = require('ramda')
const fs = require('fs-extra')
const globby = require('globby')
const { TerminalUtils } = require('constellate-dev-utils')
const generateConfig = require('./generateConfig')

// Having concurrent babel transpilations seems to break the sourcemap output.
// Incorrect sources get mapped - I wonder if there is a shared global state
// that references the "current" file being transpiled for reference in a
// sourcemap.
const maxConcurrentTranspiles = 1

// :: (..args) => Promise<BabelTransformFileResult>
const transformFile = pify(babel.transformFile)

// :: string -> void
const ensureParentDirectoryExists = filePath => {
  const dir = path.dirname(filePath)
  fs.ensureDirSync(dir)
}

// :: Package, Options -> DevelopAPI
module.exports = function babelBuildPlugin(pkg, options) {
  const buildOutputRoot = path.resolve(
    pkg.paths.root,
    options.outputDir || 'build',
  )
  const patterns = (
    options.inputs || ['**/*.js', '**/*.jsx', '!__tests__', '!test.js']
  ).concat(['!node_modules/**/*', `!${path.basename(buildOutputRoot)}/**/*`])
  const sourceRoot = path.resolve(pkg.paths.root, options.sourceDir || 'src')

  // :: string -> Array<string>
  const getJsFilePaths = () =>
    globby(patterns, {
      cwd: sourceRoot,
    })

  return {
    name: 'constellate-plugin-babel',
    build: () =>
      getJsFilePaths().then(filePaths => {
        // :: Object
        const babelConfig = generateConfig(pkg, options)

        // :: string -> Promise<void>
        const transpileFile = filePath => {
          const writeTranspiledFile = result => {
            const outFile = path.resolve(buildOutputRoot, filePath)
            ensureParentDirectoryExists(outFile)
            fs.writeFileSync(outFile, result.code, { encoding: 'utf8' })
            fs.writeFileSync(`${outFile}.map`, JSON.stringify(result.map), {
              encoding: 'utf8',
            })
          }
          const module = path.resolve(sourceRoot, filePath)
          return transformFile(module, babelConfig).then(writeTranspiledFile)
        }

        const limit = pLimit(maxConcurrentTranspiles)
        const queueTranspile = filePath => limit(() => transpileFile(filePath))
        return Promise.all(R.map(queueTranspile, filePaths))
      }),
    clean: () =>
      new Promise(resolve => {
        if (fs.pathExistsSync(buildOutputRoot)) {
          fs.removeSync(buildOutputRoot)
        }
        resolve()
      }),
    deploy: () => {
      TerminalUtils.error('"deploy" not supported by "babel" plugin')
      process.exit(1)
    },
    develop: () => {
      TerminalUtils.error('"develop" not supported by "babel" plugin')
      process.exit(1)
    },
  }
}
