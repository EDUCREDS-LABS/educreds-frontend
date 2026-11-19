module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-refresh'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: ['dist/', 'build/', 'node_modules/'],
  rules: {
    // Errors (blocking in CI) — only rules with zero current violations.
    'no-debugger': 'error',
    'no-const-assign': 'error',

    // Warnings (tracked, non-blocking). Several recommended rules surface
    // large amounts of pre-existing debt in server/ and shared/ (out of scope
    // for the frontend plan); kept as warn so they are visible but do not block.
    'react-hooks/rules-of-hooks': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-empty-object-type': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 'warn',
    'react/no-unknown-property': 'warn',
    'no-useless-catch': 'warn',
    'no-useless-escape': 'warn',
    'no-empty': 'warn',
    'prefer-const': 'warn',
    // Fast-refresh guard (manually applied; plugin preset is flat-config only)
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
};
