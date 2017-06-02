const R = require('ramda')

/**
 * Filters out all null/undefined items from the given array.
 *
 * @param  {Array} as - the target array
 *
 * @return {Array} The filtered array.
 */
function removeNil(as) {
  return as.filter(a => a != null)
}

function removeEmpty(as) {
  return as.filter(a => R.not(R.isEmpty(a)))
}

module.exports = {
  removeNil,
  removeEmpty,
}
