#!/usr/bin/env node

const currentNodeVersion = process.versions.node
if (currentNodeVersion.split('.')[0] < 8) {
  // eslint-disable-next-line no-console
  console.error(
    `You are running Node ${currentNodeVersion}.\n` +
      'Constellate requires Node 8 or higher. \n' +
      'Please update your version of Node.',
  )
  process.exit(1)
}
