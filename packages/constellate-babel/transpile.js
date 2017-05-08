const path = require('path')
const babel = require('babel-core')
const pify = require('pify')
const pLimit = require('p-limit')
const R = require('ramda')
const fs = require('fs-extra')

const generateConfig = require('./generateConfig')

const maxConcurrentTranspiles = 4

// :: (..args) => Promise<BabelTransformFileResult>
const transformFile = pify(babel.transformFile)

// :: Object
const babelConfig = generateConfig()

// :: string -> void
const ensureParentDirectoryExists = (filePath) => {
  const dir = path.dirname(filePath)
  fs.ensureDirSync(dir)
}

// :: (string, Array<string>, string) -> Promise<void>
module.exports = function transpile(srcRootPath, filePaths, destRootPath) {
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
}
