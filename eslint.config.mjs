import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';

export default [{
  files: ['packages/kanban-api/**/*.ts', 'packages/kanban-api-e2e/**/*.ts'],
  ignores: ['dist/**', 'coverage/**'],
  languageOptions: { parser, parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
  plugins: { '@typescript-eslint': plugin },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-constant-condition': 'error',
  },
}];
