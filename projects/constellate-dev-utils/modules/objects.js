const R = require('ramda')

const ArrayUtils = require('./arrays')

/**
 * Deeply merges a given set of objects together.
 *
 * Objects to the right take priority.
 *
 * @param  {...Object} args - The objects to merge.
 *
 * @return {Object} - The merged object.
 */
function mergeDeep(...args) {
  const filtered = ArrayUtils.removeNil(args)
  if (filtered.length < 1) {
    return {}
  }
  if (filtered.length === 1) {
    return args[0]
  }

  return R.reverse(filtered).reduce((acc, cur) => {
    Object.keys(cur).forEach((key) => {
      if (Array.isArray(acc[key]) && Array.isArray(cur[key])) {
        acc[key] = [...acc[key], ...cur[key]]
      } else if (typeof acc[key] === 'object' && typeof cur[key] === 'object') {
        // eslint-disable-next-line no-param-reassign
        acc[key] = mergeDeep(acc[key], cur[key])
      } else if (typeof cur[key] !== 'undefined') {
        // eslint-disable-next-line no-param-reassign
        acc[key] = cur[key]
      }
    })
    return acc
  }, {})
}

module.exports = {
  mergeDeep,
}
