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
const CABEZA =
  '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>';
/** La página de las capturas: el juego y, si hace falta, un lugar para un renderer aparte. */
const armarPagina = (extra = '') =>
  writeFileSync('dist-artifact/_capturas.html', CABEZA + frag + extra + '</body></html>');
armarPagina();

/** FNV-1a de los píxeles de un lienzo: igual huella = mismos píxeles. */
const HUELLA = `(cv) => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let h = 2166136261;
  for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 16777619) >>> 0; } return cv.width + 'x' + cv.height + ':' + h.toString(16); }`;

const b = await chromium.launch();
const huellas: Record<string, string> = {};
const pagina = async (partida: string, cambios: Record<string, unknown> = {}) => {
  const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const E = JSON.stringify({ ...JSON.parse(readFileSync(`tests/fixtures/${partida}.json`, 'utf8')), ...cambios });
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
/** Las tres cámaras, y en la de cerca, cada cantero. Deja la cámara como estaba. */
const camaras = async (p: any, clave: string, conCanteros: boolean) => {
  for (const cam of ['cenital', 'oblicua', 'cerca']) {
    await lienzo(p, `${clave}/${cam}`);
    if (cam === 'cerca' && conCanteros)
      for (const z of await p.$$eval('#hz-zonas [data-zona]', (xs: Element[]) =>
        xs.map((x) => x.getAttribute('data-zona')),
      )) {
        await p.click(`#hz-zonas [data-zona="${z}"]`);
        await lienzo(p, `${clave}/cerca-${z}`);
      }
    await p.click('#hz-camara');
  }
};

for (const partida of ['partida-v3-fondo', 'partida-v3-balcon']) {
  let p = await pagina(partida);
  await camaras(p, partida, false);
  await p.click('#hz-capa');
  await lienzo(p, `${partida}/cenital-sol`);
  await p.close();
  // cada estación: el cielo, el árbol, la luz; en invierno con mantas y en primavera con el túnel armado
  const base = JSON.parse(readFileSync(`tests/fixtures/${partida}.json`, 'utf8'));
  const zonas = Object.keys(base.riego);
  const ESTACIONES: [string, number, Record<string, unknown>][] = [
    ['verano', 2, {}],
    ['otono', 11, {}],
    ['invierno', 20, { manta: Object.fromEntries(zonas.map((z) => [z, true])) }],
    ['primavera', 29, { tunel: Object.fromEntries(zonas.map((z) => [z, true])) }],
  ];
  for (const [estacion, dec, cambios] of ESTACIONES) {
    p = await pagina(partida, { dec, ...cambios });
    await camaras(p, `${partida}/${estacion}`, true);
    await p.close();
  }
  // sembrando: el patio se tiñe según cómo le iría a la especie en cada celda, y se marca la elegida
  p = await pagina(partida);
  await p.click('[data-modo="semillas"]');
  await p.click('.hz-sobre >> nth=0');
  await lienzo(p, `${partida}/tinte-cenital`);
  await p.click('#hz-camara');
  await lienzo(p, `${partida}/tinte-oblicua`);
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

/**
 * Los efectos animados, con el reloj del navegador quieto: una instancia aparte del renderer recibe
 * la escena de la partida, todos los efectos juntos, una foto con más crecimiento (brotes y plantas
 * que se estiran) y los tres climas animados. Se toma la huella de un cuadro de cada dos.
 */
const ESCENARIO = `(() => {
  const H = globalThis.Huertita, R = H.ui.renderer.constructor;
  const es = JSON.parse(JSON.stringify(H.ui.escena)); es.camara = CAMARA;
  const r = new R(); r.montar(document.getElementById('banco')); r.dibujar(es);
  globalThis.__banco = { r, es };
  const conPlanta = Object.keys(es.celdas).filter((k) => es.celdas[k].planta && es.celdas[k].ancla !== false);
  const libres = Object.keys(es.celdas).filter((k) => !es.celdas[k].planta);
  const pl = (k) => es.celdas[k].planta, otra = conPlanta[2] || conPlanta[0];
  r.efecto('sembrar', { celda: libres[0] || conPlanta[0] });
  r.efecto('cosechar', { celda: conPlanta[0], planta: pl(conPlanta[0]), texto: '+1,5' });
  r.efecto('trasplantar', { de: conPlanta[1], celda: libres[1] || otra, planta: pl(conPlanta[1]) });
  for (const t of ['polvo', 'morir', 'tratar', 'mulch', 'compost', 'tutorar', 'brote']) r.efecto(t, { celda: otra });
  r.efecto('regar', { zona: es.celdas[conPlanta[0]].zona, nivel: 2 });
  r.efecto('logro');
})()`;
const CRECER = `(() => {
  const { r, es } = globalThis.__banco, es2 = JSON.parse(JSON.stringify(es));
  for (const c of Object.values(es2.celdas))
    if (c.planta && c.ancla !== false) c.planta.avance = Math.min(1, c.planta.avance + 0.2);
  const sem = Object.keys(es2.celdas).find((k) => es2.celdas[k].planta?.etapa === 'semilla');
  if (sem) es2.celdas[sem].planta.etapa = 'plantin';
  globalThis.__banco.es = es2; r.dibujar(es2);
})()`;
const HUELLA_BANCO = `(${HUELLA})(document.querySelector('#banco canvas'))`;
armarPagina('<div id="banco" style="width:512px"></div>');
for (const partida of ['partida-v3-fondo', 'partida-v3-balcon'])
  for (const cam of ['cenital', 'oblicua', 'cerca']) {
    const pb = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
    await pb.clock.install({ time: new Date('2026-09-01T12:00:00Z') });
    const E = readFileSync(`tests/fixtures/${partida}.json`, 'utf8');
    await pb.addInitScript((e: string) => localStorage.setItem('huertita-v1', e), E);
    await pb.goto('file://' + resolve('dist-artifact/_capturas.html'));
    await pb.clock.pauseAt(new Date('2026-09-01T12:00:30Z'));
    await pb.clock.runFor(1000);
    await pb.evaluate(ESCENARIO.replace('CAMARA', `'${cam}'`));
    const cuadros = async (fase: string, n: number) => {
      for (let i = 0; i < n; i++) {
        await pb.clock.runFor(90);
        if (i % 2) huellas[`efectos/${partida}/${cam}/${fase}-${i}`] = await pb.evaluate(HUELLA_BANCO);
      }
    };
    await cuadros('efectos', 30);
    await pb.evaluate(CRECER);
    await cuadros('crece', 16);
    for (const animar of ['lluvia', 'helada', 'calor']) {
      await pb.evaluate(
        `(() => { const { r, es } = globalThis.__banco; r.dibujar({ ...es, animar: '${animar}' }); })()`,
      );
      await cuadros(animar, 4);
    }
    await pb.close();
  }
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
