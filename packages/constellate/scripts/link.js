const R = require('ramda')
const fs = require('fs-extra')
const path = require('path')
const readPkg = require('read-pkg')
const writePkg = require('write-pkg')
const semver = require('semver')
const terminal = require('constellate-dev-utils/terminal')

module.exports = function link(projects) {
  const createLinksForProject = (project) => {
    const toLink = R.path(['config', 'link'], project)

    if (!toLink || toLink.length === 0) {
      // nada
      return
    }

    toLink.forEach((dependencyName) => {
      // 👀
      const dependency = R.find(R.propEq('name', dependencyName), projects)
      if (!dependency) {
        terminal.warning(`Could not find dependency ${dependencyName} for ${project.name}`)
        return
      }

      // Create a sym link
      const target = path.resolve(project.paths.nodeModules, `./${dependency.name}`)
      if (fs.existsSync(target)) {
        fs.removeSync(target)
      }
      fs.ensureSymlinkSync(dependency.paths.root, target)

      // Update the peer dependencies
      const pkgJson = readPkg.sync(project.paths.packageJson, { normalize: false })
      const dependencyVersion = semver.valid(pkgJson.version)
      if (!dependencyVersion) {
        throw new Error(
          `${dependencyName} does not have a version assigned within it's package.json file.`
        )
      }
      const newPkgJson = Object.assign({}, pkgJson, {
        peerDependencies: Object.assign({}, pkgJson.peerDependencies || {}, {
          [dependencyName]: `~${dependencyVersion}`,
        }),
      })
      writePkg.sync(project.paths.packageJson, newPkgJson)

      // 🎉
      terminal.success(`Linked ${dependencyName} to ${project.name}`)
    })
  }

  projects.forEach(createLinksForProject)
}
