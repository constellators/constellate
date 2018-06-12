const os = require('os')
const path = require('path')
const pLimit = require('p-limit')
const R = require('ramda')
const fs = require('fs-extra')
const globby = require('globby')
const flowRemoveTypes = require('flow-remove-types')
const { TerminalUtils } = require('constellate-dev-utils')

const maxConcurrentTranspiles = os.cpus().length

// :: string -> void
const ensureParentDirectoryExists = filePath => {
  const dir = path.dirname(filePath)
  fs.ensureDirSync(dir)
}

// :: Package, Options -> DevelopAPI
module.exports = function flowBuildPlugin(pkg, options) {
  const buildOutputRoot = path.resolve(
    pkg.paths.root,
    options.outputDir || 'build',
  )
  const patterns = (
    options.inputs || ['**/*.js', '!__tests__', '!test.js']
  ).concat(['!node_modules/**/*', `!${path.basename(buildOutputRoot)}/**/*`])
  const sourceRoot = path.resolve(pkg.paths.root, options.sourceDir || 'src')

  // :: string -> Array<string>
  const getJsFilePaths = () =>
    globby(patterns, {
      cwd: sourceRoot,
    })

  return {
    name: 'constellate-plugin-flow',
    build: () =>
      getJsFilePaths().then(filePaths => {
        // :: string -> Promise<void>
        const transpileFile = filePath =>
          new Promise(resolve => {
            const module = path.resolve(sourceRoot, filePath)
            const input = fs.readFileSync(module, 'utf8')
            const output = flowRemoveTypes(input)
            const outFile = path.resolve(buildOutputRoot, filePath)
            ensureParentDirectoryExists(outFile)
            fs.writeFileSync(outFile, output.toString(), { encoding: 'utf8' })
            fs.writeFileSync(`${outFile}.flow`, input, { encoding: 'utf8' })
            resolve()
          })

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
      TerminalUtils.error('"deploy" not supported by "flow" plugin')
      process.exit(1)
    },
    develop: () => {
      TerminalUtils.error('"develop" not supported by "flow" plugin')
      process.exit(1)
    },
  }
}
