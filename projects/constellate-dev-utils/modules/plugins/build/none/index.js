module.exports = function noneBuild() {
  return {
    build: () => Promise.resolve(),
  }
}
