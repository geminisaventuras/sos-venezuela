const securityPlugin = require('eslint-plugin-security');

module.exports = [
  {
    files: ['src/**/*.js'],
    ignores: ['**/node_modules/**', '**/public/**', '**/backup/**', '**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Buffer: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
        localStorage: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        supabase: 'readonly',
        L: 'readonly',
        perfil: 'readonly',
        authToken: 'readonly',
        API_BASE: 'readonly',
        Mensaje: 'readonly',
        CarritoInsumos: 'readonly',
        BuscadorInsumos: 'readonly',
        HeaderApp: 'readonly',
        BottomNav: 'readonly',
        Modal: 'readonly'
      }
    },
    plugins: {
      security: securityPlugin
    },
    rules: {
      ...securityPlugin.configs.recommended.rules,
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-console': 'warn'
    }
  }
];