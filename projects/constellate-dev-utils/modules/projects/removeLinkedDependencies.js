const loadJsonFile = require('load-json-file')
const writeJsonFile = require('write-json-file')

module.exports = function removeLinkedDependencies(project, deps) {
  const pkgJson = loadJsonFile.sync(project.paths.packageJson)

  const cleanDeps = type =>
    Object.assign(
      {},
      // existing deps
      pkgJson[type] ? pkgJson[type] : {},
      // remove linked deps
      deps.reduce(
        (acc, cur) =>
          Object.assign(acc, {
            [cur.packageName]: undefined,
          }),
        {},
      ),
    )

  const newPkgJson = Object.assign({}, pkgJson, {
    dependencies: pkgJson.dependencies ? cleanDeps('dependencies') : undefined,
    devDependencies: pkgJson.devDependencies ? cleanDeps('devDependencies') : undefined,
  })

  writeJsonFile.sync(project.paths.packageJson, newPkgJson)
}
