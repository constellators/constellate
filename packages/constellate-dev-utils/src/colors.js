// @flow

import type { Chalk } from 'chalk'

const chalk = require('chalk')

const foreground = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'gray',
  'redBright',
  'greenBright',
  'yellowBright',
  'blueBright',
  'magentaBright',
  'cyanBright',
  'whiteBright',
]

const background = [
  'bgBlack',
  'bgRed',
  'bgGreen',
  'bgYellow',
  'bgBlue',
  'bgMagenta',
  'bgCyan',
  'bgWhite',
  'bgBlackBright',
  'bgRedBright',
  'bgGreenBright',
  'bgYellowBright',
  'bgBlueBright',
  'bgMagentaBright',
  'bgCyanBright',
  'bgWhiteBright',
]

let bgIndex = 0
let fgIndex = -1

const nextColorPair = (): Chalk => {
  let nextFgIndex = fgIndex + 1
  if (nextFgIndex === bgIndex) {
    nextFgIndex += 1
  }
  if (nextFgIndex + 1 > foreground.length) {
    fgIndex = -1
    bgIndex += 1
    if (bgIndex + 1 > background.length) {
      bgIndex = 0
    }
    return nextColorPair()
  }
  return chalk[background[bgIndex]][foreground[fgIndex]]
}

module.exports = {
  nextColorPair,
}
