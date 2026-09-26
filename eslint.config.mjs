import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default [
  { ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/generated/**', '**/next-env.d.ts', 'artifacts/**', '.npm-cache/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals.map((config) => ({ ...config, files: ['apps/{public,admin}/**/*.{ts,tsx,js,mjs}'] })),
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  { settings: { next: { rootDir: ['apps/public/', 'apps/admin/'] } } }
];
