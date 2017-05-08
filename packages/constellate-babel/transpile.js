const path = require('path')
const babel = require('babel-core')
const pify = require('pify')
const pLimit = require('p-limit')
const R = require('ramda')
const fs = require('fs-extra')
const globby = require('globby')

const generateConfig = require('./generateConfig')

const maxConcurrentTranspiles = 4

// :: (..args) => Promise<BabelTransformFileResult>
const transformFile = pify(babel.transformFile)

// :: string -> void
const ensureParentDirectoryExists = (filePath) => {
  const dir = path.dirname(filePath)
  fs.ensureDirSync(dir)
}

// :: string -> Array<string>
const getJsFilePaths = rootPath => globby(['**/*.js', '!__tests__', '!test.js'], { cwd: rootPath })

// :: Options -> Promise<void>
module.exports = function transpile({ packageInfo }) {
  return getJsFilePaths(packageInfo.paths.modules).then((filePaths) => {
    const srcRootPath = packageInfo.paths.modules
    const destRootPath = packageInfo.paths.dist

    // :: Object
    const babelConfig = generateConfig({ packageInfo })

    // :: string -> Promise<void>
    const transpileFile = (filePath) => {
      const writeTranspiledFile = (result) => {
        const target = path.resolve(destRootPath, filePath)
        ensureParentDirectoryExists(target)
        fs.writeFileSync(target, result.code, { encoding: 'utf8' })
      }
      const source = path.resolve(srcRootPath, filePath)
      return transformFile(source, babelConfig).then(writeTranspiledFile)
    }

    const limit = pLimit(maxConcurrentTranspiles)
    const queueTranspile = filePath => limit(() => transpileFile(filePath))
    return Promise.all(R.map(queueTranspile, filePaths))
  })
}
