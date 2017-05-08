module.exports = function generateConfig() {
  return {
    babelrc: false,
    presets: ['env', 'react'],
    plugins: [
      'transform-object-rest-spread',
      'syntax-trailing-function-commas',
      'transform-class-properties',
    ],
  }
}
