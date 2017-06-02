const { EOL } = require('os')
const R = require('ramda')
const { removeNil, removeEmpty } = require('./arrays')

const multiLineStringToArray = R.pipe(x => x.split(EOL), removeNil, removeEmpty)

module.exports = { multiLineStringToArray }
