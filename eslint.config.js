// Reglas que vigilan lo que hacía ilegible al código. Las de forma (complejidad, ternarios anidados,
// funciones largas) son avisos con trinquete: `npm run lint` falla si hay más avisos que el tope de
// `package.json`, y cada cambio que limpia algo baja el tope. Ver tests/arquitectura.test.ts.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-artifact/**',
      'node_modules/**',
      '.capturas/**',
      'tests/legado/**',
      'docs/**',
      // portados del prototipo con @ts-nocheck: se reescriben en la epic #39 (#53, #54, #55)
      'src/ui/ui.ts',
      'src/render/pixel.ts',
      'src/render/texto.ts',
      'src/arte/sprites.ts',
      'src/arte/estilos.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      complexity: ['warn', 15],
      'max-depth': ['warn', 3],
      'no-nested-ternary': 'warn',
      'max-len': ['warn', { code: 140, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreComments: true }],
      'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['tests/**', 'tools/**', 'scripts/**'],
    rules: { 'max-lines-per-function': 'off', complexity: 'off', 'max-depth': 'off' },
  },
);
