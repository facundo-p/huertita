/**
 * Prueba de humo en navegador sobre el build de una sola página (el que se publica).
 * Necesita Playwright instalado aparte: `npx playwright install chromium` la primera vez.
 *   npm run build:artifact && npm run humo
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const { chromium } = await import('playwright' as string);
const frag = readFileSync('dist-artifact/huertita-artifact.html', 'utf8');
writeFileSync('dist-artifact/_humo.html', `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${frag}</body></html>`);
const b = await chromium.launch(), errores: string[] = [];
for (const [nombre, vp] of [['celular', { width: 390, height: 844 }], ['escritorio', { width: 1200, height: 900 }]] as const) {
  const p = await b.newPage({ viewport: vp }); p.on('pageerror', (e: Error) => errores.push(`${nombre}: ${e.message}`));
  await p.goto('file://' + resolve('dist-artifact/_humo.html')); await p.waitForTimeout(500);
  await p.click('[data-modo="semillas"]'); await p.click('[data-slug="rabanito"]');
  const bb = (await (await p.$('.hz-canvas'))!.boundingBox())!, celda = (x: number, y: number) => [bb.x + (x + 0.5) * bb.width / 8, bb.y + (y + 0.5) * bb.height / 9] as const;
  for (const [x, y] of [[0, 4], [1, 4]]) { const c = celda(x, y); await p.mouse.click(...c); await p.mouse.click(...c); }
  for (let i = 0; i < 5; i++) await p.click('#hz-pasar');
  for (const m of ['riego', 'proteger', 'almanaque', 'cuaderno', 'partidas', 'logros']) await p.click(`[data-modo="${m}"]`);
  await p.click('#hz-camara'); await p.click('#hz-camara'); await p.waitForTimeout(300);
  const plantas = await p.evaluate(() => Object.keys((window as any).Huertita.ui.E.plantas).length);
  if (plantas < 1) errores.push(`${nombre}: no quedó nada sembrado`);
  if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)) errores.push(`${nombre}: la página se desborda a lo ancho`);
  await p.screenshot({ path: `dist-artifact/_humo-${nombre}.png` }); await p.close();
}
await b.close();
console.log(errores.length ? errores.join('\n') : 'humo: todo bien'); process.exit(errores.length ? 1 : 0);
