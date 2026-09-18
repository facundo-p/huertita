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
  // segundo patio: se elige desde Guardar y cargar, se siembra, se arma el microtúnel y se mira con las tres cámaras
  await p.click('[data-modo="partidas"]'); await p.click('[data-modo="patios"]');
  await p.click('[data-patio="balcon"]'); await p.click('[data-patio="balcon"]');
  if (await p.evaluate(() => (window as any).Huertita.ui.E.patio) !== 'balcon') errores.push(`${nombre}: no arrancó la partida en el balcón`);
  await p.click('[data-modo="proteger"]'); await p.click('[data-acc="tunel"]');
  if (!(await p.evaluate(() => (window as any).Huertita.ui.E.tunel.cajon))) errores.push(`${nombre}: no se armó el microtúnel del balcón`);
  for (let i = 0; i < 3; i++) { await p.click('#hz-camara'); await p.waitForTimeout(150); await p.click('#hz-pasar'); }
  // una partida guardada con el formato viejo (v1) se migra al abrir
  await p.evaluate(() => { const H = (window as any).Huertita, E = JSON.parse(JSON.stringify(H.Motor.crearPartida(9))); delete E.patio; E.v = 1; E.tunel = true; localStorage.setItem('huertita-v1', JSON.stringify(E)); });
  await p.reload(); await p.waitForTimeout(400);
  const migrada = await p.evaluate(() => { const E = (window as any).Huertita.ui.E; return E.v + '|' + E.patio + '|' + JSON.stringify(E.tunel) + '|' + E.semilla; });
  const esperada = await p.evaluate(() => (window as any).Huertita.Motor.VERSION) + '|fondo|{"elevado":true}|9';
  if (migrada !== esperada) errores.push(`${nombre}: la partida v1 no se migró al abrir (${migrada}, se esperaba ${esperada})`);
  await p.click('[data-modo="semillas"]'); await p.click('[data-slug="rabanito"]'); { const c = celda(2, 4); await p.mouse.click(...c); await p.mouse.click(...c); }
  const plantas = await p.evaluate(() => Object.keys((window as any).Huertita.ui.E.plantas).length);
  if (plantas < 1) errores.push(`${nombre}: no quedó nada sembrado`);
  if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)) errores.push(`${nombre}: la página se desborda a lo ancho`);
  await p.screenshot({ path: `dist-artifact/_humo-${nombre}.png` }); await p.close();
}
await b.close();
console.log(errores.length ? errores.join('\n') : 'humo: todo bien'); process.exit(errores.length ? 1 : 0);
