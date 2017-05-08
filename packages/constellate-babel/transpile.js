const os = require('os')
const path = require('path')
const babel = require('babel-core')
const pify = require('pify')
const pLimit = require('p-limit')
const R = require('ramda')
const fs = require('fs-extra')

const generateConfig = require('./generateConfig')

// :: (..args) => Promise<BabelTransformFileResult>
const transformFile = pify(babel.transformFile)

// :: int
const cpuCount = os.cpus().length

const babelConfig = generateConfig()

const ensureParentDirectoryExists = (filePath) => {
  const dir = path.dirname(filePath)
  fs.ensureDirSync(dir)
}

module.exports = function transpile(srcRootPath, filePaths, destRootPath) {
  const limit = pLimit(cpuCount)

  // :: string -> Promise<BabelTransformFileResult>
  const transpileFile = (filePath) => {
    const writeTranspiledFile = (result) => {
      const target = path.resolve(destRootPath, filePath)
      ensureParentDirectoryExists(target)
      fs.writeFileSync(target, result.code, { encoding: 'utf8' })
    }
    const source = path.resolve(srcRootPath, filePath)
    return transformFile(source, babelConfig).then(writeTranspiledFile)
  }

  const queueTranspile = filePath => limit(() => transpileFile(filePath))

  return Promise.all(R.map(queueTranspile, filePaths))
}
