import { defineConfig, globalIgnores } from 'eslint/config';
import { configs as jsConfigs } from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { configs as tsConfigs } from 'typescript-eslint';

export default defineConfig(
  jsConfigs.recommended,
  tsConfigs.eslintRecommended,
  tsConfigs.recommended,
  tsConfigs.strict,
  stylistic.configs.customize({
    commaDangle: 'never',
    indent: 2,
    jsx: false,
    quotes: 'single',
    semi: true,
    quoteProps: 'as-needed'
  }),
  globalIgnores([
    '.yarn',
    'coverage',
    'node_modules',
    'old',
    'old_packages'
  ]),
  {
    files: ['**/*.ts'],
    plugins: {
      '@stylistic': stylistic
    }
  },
  {
    rules: {
      '@typescript-eslint/no-dynamic-delete': 'off'
    }
  }
);
