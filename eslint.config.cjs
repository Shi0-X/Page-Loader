const eslintPluginImport = require('eslint-plugin-import');
const eslintPluginJest = require('eslint-plugin-jest');
const airbnbBaseConfig = require('eslint-config-airbnb-base');

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      import: eslintPluginImport,
      jest: eslintPluginJest,
    },
    env: {
      node: true,
      es2020: true,
      'jest/globals': true,
    },
    rules: {
      ...airbnbBaseConfig.rules,
      'no-console': 'off', // Permitido en Node.js para depuración.
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'always',
        },
      ],
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/prefer-to-be': 'warn',
    },
  },
];
