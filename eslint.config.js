import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier' // Disables rules Prettier handles

// tseslint.config() is a helper that merges flat config objects with type safety
export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      // flat.recommended is the react-hooks v7+ style for flat ESLint configs
      reactHooks.configs.flat.recommended,
      // vite preset enables react-refresh rules with Vite-appropriate settings
      reactRefresh.configs.vite,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  prettier, // Must be last — overrides any formatting rules that conflict with Prettier
)
