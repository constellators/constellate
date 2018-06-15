// @flow

import type { Package } from './types'

const { EOL } = require('os')
const R = require('ramda')
const { removeNil, removeEmpty } = require('./arrays')

const multiLineStringToArray = (str: string): Array<string> =>
  R.pipe(
    R.defaultTo(''),
    x => x.split(EOL),
    removeNil,
    removeEmpty,
  )(str)

const packageMsg = (pkg: Package, msg: string) => {
  // const cleanData = data =>
  //   data
  //     .toString()
  //     .replace(/^(\n)+/, '')
  //     .replace(/(\n)+$/, '')

  // const cleaned = cleanData(data)

  const formattedPrefix = pkg.color(
    `${pkg.name.padEnd(pkg.maxPackageNameLength)}|`,
  )

  return `${formattedPrefix} ${(msg || '').replace(
    /\n/gi,
    `\n${formattedPrefix} `,
  )}`
}

module.exports = {
  multiLineStringToArray,
  packageMsg,
}
