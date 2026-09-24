import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * `npm run build`            → dist/ para GitHub Pages (rutas relativas, funciona en /huertita/).
 * `npm run build:artifact`   → dist-artifact/index.html, una sola página con todo adentro,
 *                              que es lo que se publica como artifact en Claude.
 */
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'artifact' ? [viteSingleFile()] : [],
  build: {
    outDir: mode === 'artifact' ? 'dist-artifact' : 'dist',
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: mode === 'artifact' ? 100_000_000 : 4096,
  },
  esbuild: { jsx: 'automatic', jsxImportSource: 'preact' },
  test: { include: ['tests/**/*.test.{ts,tsx}'] },
}));
