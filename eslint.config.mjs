// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
// eslint-plugin-jest is used instead of Jest's (non-existent) forbidOnly config option.
// Jest 30 has no forbidOnly setting; ESLint enforces the same guarantee at lint time:
//   jest/no-focused-tests: error  — prevents committed it.only / test.only / describe.only
//   jest/no-disabled-tests: warn  — flags pending xit/xtest/xdescribe that may hide failures
import jest from 'eslint-plugin-jest';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  // Focused-test guard: scoped to test files only so it does not affect src.
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', '**/*.int-spec.ts'],
    plugins: { jest },
    rules: {
      'jest/no-focused-tests': 'error',
      'jest/no-disabled-tests': 'warn',
    },
  },
);
