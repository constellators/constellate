//      

                                       

const writeJsonFile = require('write-json-file')

module.exports = function removeLinkedDependencies(project         , deps                )       {
  const cleanDeps = type =>
    Object.assign(
      {},
      // existing deps
      project.packageJson[type] ? project.packageJson[type] : {},
      // remove linked deps
      deps.reduce(
        (acc, cur) =>
          Object.assign(acc, {
            [cur.packageName]: undefined,
          }),
        {},
      ),
    )

  const newPkgJson = Object.assign({}, project.packageJson, {
    dependencies: project.packageJson.dependencies ? cleanDeps('dependencies') : undefined,
    devDependencies: project.packageJson.devDependencies ? cleanDeps('devDependencies') : undefined,
  })

  writeJsonFile.sync(project.paths.packageJson, newPkgJson)
}
