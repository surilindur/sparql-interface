import pluginVue from 'eslint-plugin-vue'
import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

export default defineConfigWithVueTs(
  pluginVue.configs['flat/recommended-error'],
  vueTsConfigs.recommended,
  globalIgnores([
    '**/dist/'
  ]),
  {
    rules: {
      'comma-dangle': [ 'error', 'never' ],
      'semi': [ 'error', 'never' ],
      'quotes': [ 'error', 'single' ],
      'array-bracket-spacing': [ 'error', 'always' ],
      'computed-property-spacing': [ 'error', 'never' ],
      'object-curly-spacing': [ 'error', 'always' ]
    }
  }
)
