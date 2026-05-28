import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import eslintPluginImport from 'eslint-plugin-import'
import prettierPlugin from 'eslint-plugin-prettier'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from "globals"

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', "**/*.d.ts"],
  },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@typescript-eslint': typescriptEslint,
      prettier: prettierPlugin,
      import: eslintPluginImport,
      'unused-imports': unusedImports,
    },
    rules: {
      // Rekomendasi dasar standar
      ...js.configs.recommended.rules,
      ...typescriptEslint.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,

      // Aturan bawaan Next.js Core Web Vitals (Didaftarkan secara manual)
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // Custom Rules asli milik Anda
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],
      'prettier/prettier': ['error', { semi: false }],

      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'no-undef': 'off',
      'react-hooks/incompatible-library': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',

      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      'import/order': [
        'warn',
        {
          groups: [['builtin', 'external', 'internal', 'parent', 'sibling', 'index']],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
        },
      ],
    },
  },
]
