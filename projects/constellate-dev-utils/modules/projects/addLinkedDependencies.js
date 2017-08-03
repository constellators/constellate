//      

                                       

                                                        

const loadJsonFile = require('load-json-file')
const writeJsonFile = require('write-json-file')

module.exports = function addLinkedDependencies(
  target         ,
  sources                ,
  type                ,
) {
  const pkgJson = loadJsonFile.sync(target.paths.packageJson)

  if (sources.length === 0) {
    return
  }

  const newDeps = Object.assign(
    {},
    // existing deps
    pkgJson[type] ? pkgJson[type] : {},
    // new linked deps
    sources.reduce(
      (acc, cur) =>
        Object.assign(acc, {
          [cur.packageName]: cur.version,
        }),
      {},
    ),
  )

  const sortedNewDeps = Object.keys(newDeps)
    .sort()
    .reduce((acc, cur) => Object.assign(acc, { [cur]: newDeps[cur] }), {})

  const newPkgJson = Object.assign({}, pkgJson, {
    [type]: sortedNewDeps,
  })

  writeJsonFile.sync(target.paths.packageJson, newPkgJson)
}
