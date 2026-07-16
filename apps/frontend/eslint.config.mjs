import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import-x'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default [
  {
    ignores: [
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/node_modules/**',
      '**/out/**',
      '**/.vercel/**',

      // generated
      '**/*.d.ts',
      '**/generated/**',
      '**/prisma/generated/**'
    ]
  },
  js.configs.recommended,

  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.{ts,tsx}']
  })),

  prettierConfig,

  // JS config
  {
    files: ['**/*.{js,mjs,cjs}'],

    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },

  // TS config
  {
    files: ['**/*.{ts,tsx}'],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: __dirname
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },

    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
      import: importPlugin,
      'unused-imports': unusedImports,
      'react-hooks': reactHooks
    },

    rules: {
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true
        }
      ],

      'prettier/prettier': ['error', { semi: false }],

      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',

      'unused-imports/no-unused-imports': 'error',

      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_'
        }
      ],

      'import/order': [
        'warn',
        {
          groups: [['builtin', 'external', 'internal', 'parent', 'sibling', 'index']],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          },
          'newlines-between': 'always'
        }
      ]
    }
  }
]
