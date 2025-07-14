module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    env: {
        node: true,
        es6: true,
    },
    ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/', 'coverage/', '*.js'],
    rules: {
        'no-debugger': 'error',
        'prefer-const': 'warn',
        'no-var': 'warn',
    },
}; 