import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

const nodeGlobals = {
  process: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  Buffer: 'readonly',
  module: 'readonly',
  require: 'readonly',
  exports: 'readonly',
  console: 'readonly',
};

export default [
  js.configs.recommended,

  // Node environment
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      globals: nodeGlobals,
    },
  },
  {
    ignores: ['prisma/generated/**', '**/prisma/generated/**'],
  },
  // TypeScript only
  {
    files: ['**/*.ts'],
    ignores: ['prisma/generated/**', '**/prisma/generated/**'],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
    },

    rules: {
      ...tseslint.configs.recommendedTypeChecked.rules,
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
