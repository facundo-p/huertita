/**
 * Sincroniza el catálogo del juego con la base de conocimiento de huertapp.
 *
 * huertapp es la ÚNICA fuente de verdad de los datos agronómicos. Este repo no
 * guarda una copia editable: guarda un derivado compacto (`datos/catalogo.json`)
 * y un candado (`datos/fuente.lock.json`) que dice de qué versión exacta salió.
 *
 *   npm run datos:sync                      trae la rama main de GitHub
 *   npm run datos:sync -- --ref staging     otra rama, tag o commit
 *   npm run datos:sync -- --local ../info-huerta    usa tu copia local (sin red)
 *   npm run datos:check                     no escribe: avisa si hay cambios y si rompen el contrato
 *
 * Sale con código 1 si la fuente rompe el contrato (un campo que el juego necesita
 * cambió de forma o desapareció) y con 2, en --check, si hay cambios sin sincronizar.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAMPOS_Y_SISTEMAS, derivarCatalogo, validarFuente, type Catalogo } from '../datos/contrato';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'facundo-p/huertapp';
const ARCHIVO = 'data/huerta_gba_enriquecido.json';
const RUTA_CATALOGO = join(RAIZ, 'datos/catalogo.json');
const RUTA_CANDADO = join(RAIZ, 'datos/fuente.lock.json');
const RUTA_CAMBIOS = join(RAIZ, 'datos/CAMBIOS.md');
const RUTA_HUECOS = join(RAIZ, 'datos/HUECOS.md');

const args = process.argv.slice(2);
const valorDe = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const soloMirar = args.includes('--check');
const local = valorDe('--local');
const ref = valorDe('--ref') ?? 'main';

async function leerFuente(): Promise<{ texto: string; origen: string }> {
  if (local) {
    const ruta = resolve(process.cwd(), local, ARCHIVO);
    return { texto: readFileSync(ruta, 'utf8'), origen: `local:${ruta}` };
  }
  const url = `https://raw.githubusercontent.com/${REPO}/${ref}/${ARCHIVO}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`No pude traer ${url}: HTTP ${r.status}`);
  return { texto: await r.text(), origen: url };
}

function diferencias(antes: Catalogo | null, ahora: Catalogo): string[] {
  if (!antes) return [`Primer catálogo: ${Object.keys(ahora.especies).length} especies.`];
  const out: string[] = [];
  const a = antes.especies, b = ahora.especies;
  for (const s of Object.keys(b)) if (!a[s]) out.push(`+ **${s}**: especie nueva. Necesita dibujo en \`src/arte/estilos.ts\` y familia en \`datos/juego/especies.ts\` (si no, usa los genéricos).`);
  for (const s of Object.keys(a)) if (!b[s]) out.push(`- **${s}**: ya no está en huertapp. Las partidas guardadas que la tengan plantada hay que migrarlas.`);
  for (const s of Object.keys(b)) {
    if (!a[s]) continue;
    const ea = a[s] as unknown as Record<string, unknown>, eb = b[s] as unknown as Record<string, unknown>;
    for (const campo of Object.keys(eb)) {
      if (JSON.stringify(ea[campo]) === JSON.stringify(eb[campo])) continue;
      const sistema = CAMPOS_Y_SISTEMAS[campo] ?? 'solo texto de ficha';
      const corto = (v: unknown) => { const t = JSON.stringify(v) ?? 'null'; return t.length > 90 ? t.slice(0, 87) + '…' : t; };
      out.push(`~ **${s}**.${campo} (${sistema}): ${corto(ea[campo])} → ${corto(eb[campo])}`);
    }
  }
  return out;
}

const { texto, origen } = await leerFuente();
const sha256 = createHash('sha256').update(texto).digest('hex');
const fuente = JSON.parse(texto) as unknown;

const { errores, avisos } = validarFuente(fuente);
console.log(`${avisos.length} huecos en la fuente que el juego completa con supuestos (detalle en datos/HUECOS.md).`);
if (errores.length) {
  console.error(`\nLa fuente rompe el contrato del juego (${errores.length}):`);
  for (const e of errores.slice(0, 40)) console.error('  ✗', e);
  console.error('\nNo se escribió nada. O se corrige en huertapp, o se adapta `datos/contrato.ts` y el motor.');
  process.exit(1);
}

const candadoViejo = existsSync(RUTA_CANDADO) ? JSON.parse(readFileSync(RUTA_CANDADO, 'utf8')) as { sha256?: string } : null;
const catalogoViejo = existsSync(RUTA_CATALOGO) ? JSON.parse(readFileSync(RUTA_CATALOGO, 'utf8')) as Catalogo : null;
const catalogo = derivarCatalogo(fuente);
const cambios = diferencias(catalogoViejo, catalogo);
const igual = candadoViejo?.sha256 === sha256 && cambios.length === 0;

console.log(`Fuente: ${origen}`);
console.log(`sha256: ${sha256.slice(0, 16)}…  ·  ${Object.keys(catalogo.especies).length} especies  ·  generado en huertapp el ${catalogo.meta.generado ?? 's/d'}`);
if (igual) { console.log('Sin cambios: el catálogo del juego está al día.'); process.exit(0); }
console.log(`\n${cambios.length} cambio(s) que tocan al juego:`);
for (const c of cambios.slice(0, 60)) console.log('  ' + c);
if (cambios.length > 60) console.log(`  … y ${cambios.length - 60} más`);

if (soloMirar) { console.log('\n--check: no se escribió nada. Corré `npm run datos:sync` y después `npm test`.'); process.exit(cambios.length ? 2 : 0); }

writeFileSync(RUTA_CATALOGO, JSON.stringify(catalogo, null, 1) + '\n');
writeFileSync(RUTA_CANDADO, JSON.stringify({ repo: REPO, ref: local ? 'local' : ref, archivo: ARCHIVO, sha256, bytes: Buffer.byteLength(texto), generado_en_huertapp: catalogo.meta.generado ?? null, sincronizado: new Date().toISOString().slice(0, 10), especies: Object.keys(catalogo.especies).length }, null, 2) + '\n');
writeFileSync(RUTA_HUECOS, `# Huecos de huertapp que el juego completa con supuestos\n\nLo escribe \`npm run datos:sync\`. Cada línea es un dato que falta en huertapp y que el juego inventa de forma conservadora (ver \`datos/juego/especies.ts\`). Completarlo en huertapp mejora las dos apps.\n\n${avisos.map((a) => '- ' + a).join('\n')}\n`);
const bitacora = existsSync(RUTA_CAMBIOS) ? readFileSync(RUTA_CAMBIOS, 'utf8') : '# Cambios de datos traídos de huertapp\n\nLo escribe `npm run datos:sync`. Lo más nuevo arriba.\n';
const [cab, ...resto] = bitacora.split('\n## ');
writeFileSync(RUTA_CAMBIOS, `${cab.trimEnd()}\n\n## ${new Date().toISOString().slice(0, 10)} · ${sha256.slice(0, 12)}\n\n${cambios.map((c) => '- ' + c).join('\n')}\n${resto.length ? '\n## ' + resto.join('\n## ') : ''}`);
console.log('\nEscribí datos/catalogo.json, datos/fuente.lock.json, datos/CAMBIOS.md y datos/HUECOS.md. Ahora corré `npm test`: los tests dicen si algún cambio rompe una regla del juego.');
