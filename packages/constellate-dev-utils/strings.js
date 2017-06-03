const { EOL } = require('os')
const R = require('ramda')
const { removeNil, removeEmpty } = require('./arrays')

// ?string -> Array<string>
const multiLineStringToArray = R.pipe(R.defaultTo(''), x => x.split(EOL), removeNil, removeEmpty)

module.exports = { multiLineStringToArray }
