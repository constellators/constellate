const deepMerge = require('deepmerge')

/**
 * Deeply merges a given set of objects together.
 *
 * Objects to the right take priority.
 *
 * @param  {...Object} args - The objects to merge.
 *
 * @return {Object} - The merged object.
 */
function mergeDeep(left, right) {
  return deepMerge(left, right)
}

module.exports = {
  mergeDeep,
}
