const semver = require('semver')
const { TerminalUtils } = require('constellate-dev-utils')

module.exports = function promptVersion(currentVersion) {
  return new Promise((resolve) => {
    const patch = semver.inc(currentVersion, 'patch')
    const minor = semver.inc(currentVersion, 'minor')
    const major = semver.inc(currentVersion, 'major')
    const prepatch = semver.inc(currentVersion, 'prepatch')
    const preminor = semver.inc(currentVersion, 'preminor')
    const premajor = semver.inc(currentVersion, 'premajor')

    TerminalUtils.select(`Select a new version (currently ${currentVersion})`, {
      choices: [
        { value: patch, name: `Patch (${patch})` },
        { value: minor, name: `Minor (${minor})` },
        { value: major, name: `Major (${major})` },
        { value: prepatch, name: `Prepatch (${prepatch})` },
        { value: preminor, name: `Preminor (${preminor})` },
        { value: premajor, name: `Premajor (${premajor})` },
        { value: 'PRERELEASE', name: 'Prerelease' },
        { value: 'CUSTOM', name: 'Custom' },
      ],
    }).then((choice) => {
      switch (choice) {
        case 'CUSTOM': {
          TerminalUtils.input('Enter a custom version', {
            filter: semver.valid,
            validate: v => v !== null || 'Must be a valid semver version',
          }).then((input) => {
            resolve(input)
          })
          break
        }

        case 'PRERELEASE': {
          const components = semver.prerelease(currentVersion)
          let existingId = null
          if (components && components.length === 2) {
            existingId = components[0]
          }
          const defaultVersion = semver.inc(currentVersion, 'prerelease', existingId)
          const prompt = `(default: ${existingId
            ? `"${existingId}"`
            : 'none'}, yielding ${defaultVersion})`

          TerminalUtils.input(`Enter a prerelease identifier ${prompt}`, {
            filter: (v) => {
              const prereleaseId = v || existingId
              return semver.inc(currentVersion, 'prerelease', prereleaseId)
            },
          }).then((input) => {
            resolve(input)
          })
          break
        }

        default: {
          resolve(choice)
          break
        }
      }
    })
  })
}
