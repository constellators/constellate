const { EOL } = require('os')
const path = require('path')
const fs = require('fs-extra')
const ObjectUtils = require('../objects')
const TerminalUtils = require('../terminal')

const defaultAppConfig = {
  publishing: {
    branchName: 'master',
    customRegistry: null,
  },
  releasing: {
    branchName: 'master',
    remoteName: 'origin',
    enableRemotePush: true,
  },
}

let cache

module.exports = function getConfig() {
  if (cache) {
    return cache
  }

  const configPath = path.resolve(process.cwd(), './constellate.js')

  if (!fs.existsSync(configPath)) {
    TerminalUtils.error('No constellate.js config was found. Please make sure this file exists.')
    process.exit(1)
  }

  cache = ObjectUtils.mergeDeep(
    {},
    defaultAppConfig,
    // eslint-disable-next-line global-require,import/no-dynamic-require
    require(configPath),
  )

  TerminalUtils.verbose(`Using app config:${EOL}${JSON.stringify(cache, null, 2)}`)

  return cache
}
