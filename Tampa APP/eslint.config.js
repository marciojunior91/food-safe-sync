import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // UI/UX Improvement: Prevent autoFocus usage (T14.2 & T16.4)
      // AutoFocus is not user-friendly on tablets/mobile - keyboard should only open on user interaction
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="autoFocus"]',
          message: 'autoFocus is not allowed. Keyboard should only open on user interaction for better mobile/tablet UX.',
        },
      ],
    },
  },
)
