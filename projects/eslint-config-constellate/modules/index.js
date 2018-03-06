module.exports = {
  root: true,
  parser: 'babel-eslint',
  extends: [
    require.resolve('eslint-config-airbnb'),
    require.resolve('eslint-config-prettier'),
  ],
  plugins: ['flowtype'],
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true,
  },
  ecmaFeatures: {
    defaultParams: true,
  },
  rules: {
    // Buggy with some APIs
    'array-callback-return': 0,
    // If using prettier this is not too bad anymore
    'no-nested-ternary': 0,
    // This rule is annoying
    'react/forbid-prop-types': 0,
    // A jsx extension is not required for files containing jsx
    'react/jsx-filename-extension': 0,
    // This rule struggles with flow and class properties
    'react/sort-comp': 0,
    // This breaks the way we want to lazy link our packages.
    'import/no-extraneous-dependencies': 0,
  },
}
