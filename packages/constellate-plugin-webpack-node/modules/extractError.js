/**
 * Extracts the webpack callback error.
 *
 * @param  {Project} project The project being bundled.
 * @param  {Error} err     The error from the webpack callback.
 * @param  {WebpackStats} stats   The stats from the webpack callback.
 *
 * @return {string} The error string if an error exists.
 */
module.exports = function extractError(project, err, stats) {
  if (err) {
    return `Fatal error attempting to bundle ${project.name}\n${err}`
  }
  if (stats.hasErrors()) {
    return stats.toString({ colors: true, chunks: false })
  }
  return undefined
}
