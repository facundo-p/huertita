/**
 * La arquitectura, vigilada. Dos cosas:
 *  1. Las dependencias van en un solo sentido. Cada carpeta importa solo de las que tiene permitidas
 *     (los `import type` no cuentan: se borran al compilar y no acoplan nada en ejecución).
 *  2. La deuda solo baja. Los topes de abajo son los de hoy: si un cambio los supera, falla; si un
 *     cambio los mejora, se bajan en el mismo commit.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const RAIZ = normalize(join(__dirname, '..'));
function archivos(dir: string): string[] {
  return readdirSync(join(RAIZ, dir)).flatMap((f) => {
    const ruta = join(dir, f);
    if (statSync(join(RAIZ, ruta)).isDirectory()) return archivos(ruta);
    return /\.tsx?$/.test(f) ? [ruta] : [];
  });
}

/** La capa de un archivo: su carpeta de primer nivel dentro de `src/`, o `datos`. */
function capa(ruta: string): string {
  const partes = ruta.split(/[\\/]/);
  if (partes[0] === 'datos') return 'datos';
  if (partes[0] === 'src') return partes.length > 2 || !partes[1].includes('.') ? partes[1] : 'raiz';
  return partes[0];
}

/** Qué capas puede importar cada capa (además de sí misma). */
const PERMITIDAS: Record<string, string[]> = {
  datos: [],
  dominio: ['datos'],
  aplicacion: ['datos', 'dominio'],
  infra: ['dominio'],
  vista: ['datos', 'dominio', 'aplicacion', 'infra', 'render', 'arte', 'estilos'],
  arte: [],
  render: ['arte'],
  estilos: [],
  raiz: ['vista', 'estilos'],
};

describe('las dependencias van en un solo sentido', () => {
  const codigo = [...archivos('src'), ...archivos('datos')];
  it.each(codigo)('%s', (ruta) => {
    const propia = capa(ruta),
      texto = readFileSync(join(RAIZ, ruta), 'utf8');
    const malas: string[] = [];
    for (const m of texto.matchAll(/^\s*import\s+(type\s+)?[^'"]*?from\s+['"](\.[^'"]+)['"]/gm)) {
      if (m[1]) continue;
      const destino = capa(relative(RAIZ, join(RAIZ, dirname(ruta), m[2])));
      if (destino !== propia && !(PERMITIDAS[propia] ?? []).includes(destino))
        malas.push(`${propia} → ${destino} (${m[2]})`);
    }
    for (const m of texto.matchAll(/^\s*import\s+['"](\.[^'"]+)['"]/gm)) {
      const destino = capa(relative(RAIZ, join(RAIZ, dirname(ruta), m[1])));
      if (destino !== propia && !(PERMITIDAS[propia] ?? []).includes(destino))
        malas.push(`${propia} → ${destino} (${m[1]})`);
    }
    expect(malas).toEqual([]);
  });
  it('el dominio no toca el navegador', () => {
    const culpables = archivos('src/dominio').filter((r) =>
      /\b(document|window|localStorage)\b/.test(
        readFileSync(join(RAIZ, r), 'utf8').replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ''),
      ),
    );
    expect(culpables).toEqual([]);
  });
});

describe('el vocabulario del dominio vive en un solo lugar', () => {
  it('solo vocabulario.ts conoce el formato "x,y" de una celda', () => {
    const culpables = archivos('src/dominio')
      .filter((r) => !r.endsWith('vocabulario.ts'))
      .filter((r) => /split\(','\)|\+ ',' \+/.test(readFileSync(join(RAIZ, r), 'utf8')));
    expect(culpables).toEqual([]);
  });
  it('nadie repite ESPECIES[pl.slug] ni pl.n || 1: para eso están especieDe y vivas', () => {
    const culpables = archivos('src/dominio')
      .filter((r) => !r.endsWith('planta.ts'))
      .filter((r) => /ESPECIES\[pl\.slug\]|pl\.n \|\| 1/.test(readFileSync(join(RAIZ, r), 'utf8')));
    expect(culpables).toEqual([]);
  });
});

describe('los números del balance viven en datos/juego/reglas.ts (innegociable 11)', () => {
  /**
   * En las reglas (acciones, sistemas y el modelo de clima) no hay números sueltos: solo 0, 1, 2
   * (mitades y promedios) y 100 (la escala de la salud). Una constante con nombre en MAYÚSCULAS
   * declarada en el archivo también vale: es un nombre, no un número suelto. Se miran sin
   * comentarios ni textos.
   */
  const REGLAS_DEL_JUEGO = [
    ...archivos('src/dominio/acciones'),
    ...archivos('src/dominio/sistemas'),
    'src/dominio/clima.ts',
  ];
  const PERMITIDOS = new Set(['0', '1', '2', '100']);
  const numerosSueltos = (ruta: string): string[] =>
    readFileSync(join(RAIZ, ruta), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map((l) => l.replace(/\/\/.*$/, '').replace(/'(?:[^'\\]|\\.)*'|`[^`]*`/g, "''"))
      .flatMap((l, i) =>
        /^\s*(export )?const [A-Z_]+ = /.test(l)
          ? []
          : (l.match(/(?<![\w.])\d+(\.\d+)?(?![\w.])/g) ?? [])
              .filter((n) => !PERMITIDOS.has(n))
              .map((n) => `${ruta}:${i + 1} ${n}`),
      );
  it('ninguna regla tiene un número suelto', () => {
    expect(REGLAS_DEL_JUEGO.flatMap(numerosSueltos)).toEqual([]);
  });
});

describe('la deuda solo baja', () => {
  const todos = [...archivos('src'), ...archivos('datos'), ...archivos('tools'), ...archivos('scripts')];
  it('archivos sin tipar (@ts-nocheck)', () => {
    const sinTipos = todos.filter((r) => readFileSync(join(RAIZ, r), 'utf8').includes('@ts-nocheck'));
    expect(sinTipos.length, sinTipos.join(', ')).toBeLessThanOrEqual(0);
  });
  /** tope de líneas de más de 200 caracteres por carpeta */
  const TOPE_LINEAS_LARGAS: Record<string, number> = {
    datos: 0,
    dominio: 0,
    vista: 0,
    aplicacion: 0,
    infra: 0,
    render: 0,
    arte: 0,
    tools: 0,
    scripts: 1,
  };
  it.each(Object.entries(TOPE_LINEAS_LARGAS))('líneas de más de 200 caracteres en %s', (c, tope) => {
    const largas = todos
      .filter((r) => capa(r) === c)
      .flatMap((r) =>
        readFileSync(join(RAIZ, r), 'utf8')
          .split('\n')
          .filter((l) => l.length > 200),
      );
    expect(largas.length).toBeLessThanOrEqual(tope);
  });
});
