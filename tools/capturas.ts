/**
 * Capturas de referencia: comprueba que la gráfica dibuja EXACTAMENTE lo mismo antes y después de
 * un cambio que no debería tocarla (refactorizar la vista, el render o el arte).
 *
 *   npm run build:artifact && npm run capturas -- --guardar    antes del cambio
 *   npm run build:artifact && npm run capturas -- --comparar   después
 *
 * Carga partidas fijas (`tests/fixtures`), sin animación (`prefers-reduced-motion`), y anota una
 * huella de los píxeles de cada lienzo: las tres cámaras en cada patio, la capa de sol, y la tira
 * de estadíos de todas las especies. Las referencias quedan en `.capturas/` (fuera de git).
 * Necesita Playwright, como el humo.
 */
import { playwright } from './playwright';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { chromium } = await playwright();
const modo = process.argv.includes('--guardar') ? 'guardar' : 'comparar';
const REF = '.capturas/referencia.json';
const frag = readFileSync('dist-artifact/huertita-artifact.html', 'utf8');
writeFileSync(
  'dist-artifact/_capturas.html',
  `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${frag}</body></html>`,
);

/** FNV-1a de los píxeles de un lienzo: igual huella = mismos píxeles. */
const HUELLA = `(cv) => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let h = 2166136261;
  for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 16777619) >>> 0; } return cv.width + 'x' + cv.height + ':' + h.toString(16); }`;

const b = await chromium.launch();
const huellas: Record<string, string> = {};
const pagina = async (partida: string) => {
  const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const E = readFileSync(`tests/fixtures/${partida}.json`, 'utf8');
  await p.addInitScript((e: string) => {
    try {
      localStorage.setItem('huertita-v1', e);
    } catch {
      /* sin storage */
    }
  }, E);
  await p.goto('file://' + resolve('dist-artifact/_capturas.html'));
  await p.waitForTimeout(700);
  return p;
};
const lienzo = async (p: any, clave: string) => {
  await p.waitForTimeout(700); // dos cuadros del temporizador del renderer
  huellas[clave] = await p.$eval('.hz-canvas', new Function('return ' + HUELLA)());
};

for (const partida of ['partida-v3-fondo', 'partida-v3-balcon']) {
  const p = await pagina(partida);
  for (const cam of ['cenital', 'oblicua', 'cerca']) {
    await lienzo(p, `${partida}/${cam}`);
    await p.click('#hz-camara');
  }
  await p.click('#hz-capa');
  await lienzo(p, `${partida}/cenital-sol`);
  await p.close();
}

// la tira de estadíos de cada especie, desde el almanaque
const p = await pagina('partida-v3-fondo');
await p.click('[data-modo="almanaque"]');
await p.click('[data-todas="1"]');
const slugs: string[] = await p.$$eval('.hz-alm-fila[data-slug]', (xs: Element[]) =>
  xs.map((x) => x.getAttribute('data-slug')!),
);
for (const s of slugs) {
  await p.click(`.hz-alm-fila[data-slug="${s}"]`);
  // la tira se dibuja en un efecto después de montar: se espera a que el lienzo tenga su tamaño
  await p.waitForFunction(() => {
    const cv = document.querySelector<HTMLCanvasElement>('canvas[data-tira]');
    return !!cv && cv.width !== 300;
  });
  huellas[`tira/${s}`] = await p.$eval('canvas[data-tira]', new Function('return ' + HUELLA)());
  await p.click('[data-modo="almanaque"]');
}
await p.close();
await b.close();

if (modo === 'guardar') {
  if (!existsSync('.capturas')) mkdirSync('.capturas');
  writeFileSync(REF, JSON.stringify(huellas, null, 1));
  console.log(`capturas: ${Object.keys(huellas).length} huellas guardadas en ${REF}`);
} else {
  if (!existsSync(REF)) {
    console.log(`capturas: no hay referencia; corré primero con --guardar`);
    process.exit(1);
  }
  const ref: Record<string, string> = JSON.parse(readFileSync(REF, 'utf8'));
  const claves = [...new Set([...Object.keys(ref), ...Object.keys(huellas)])];
  const distintas = claves.filter((k) => ref[k] !== huellas[k]);
  console.log(
    distintas.length
      ? 'capturas distintas:\n' + distintas.map((k) => `  ${k}: ${ref[k]} → ${huellas[k]}`).join('\n')
      : `capturas: las ${claves.length} iguales`,
  );
  process.exit(distintas.length ? 1 : 0);
}
