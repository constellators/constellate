module.exports = function noneCompiler() {
  return {
    compile: () => Promise.resolve(),
  }
}
