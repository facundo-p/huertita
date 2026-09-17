// @ts-nocheck — arte portado tal cual del prototipo; se tipa en el paso 6 de los cimientos
/**
 * Cómo se dibuja cada especie: forma, paleta y color del fruto o la flor.
 * Una especie nueva de huertapp que no esté acá usa el dibujo genérico de su grupo (`estiloDe`).
 */
  // ── paleta ──
export var V = { v: '#3fae4a', c: '#86db5c', o: '#23773a', oo: '#174f2a' };           // verde huerta
export var AZ = { v: '#5aa890', c: '#8fd0b4', o: '#357563', oo: '#24503f' };          // verde azulado (brasicáceas, aliáceas)
export var GR = { v: '#7fa88a', c: '#b3d1b0', o: '#55806a', oo: '#3a5c4c' };          // gris verdoso (salvia, lavanda)
export var OS = { v: '#2f8a4a', c: '#5cc46a', o: '#1b5e34', oo: '#123f24' };          // verde oscuro (espinaca, perejil)
export var MADERA = '#8a5526', CANA = '#d9b779', PAJA = '#f0d071', TIERRA = '#4a2e1a';

export var ESTILO = {
    lechuga: { f: 'roseta', tipo: 'rizada', pal: { v: '#6fcf4f', c: '#b5f07a', o: '#3a9a3f', oo: '#23773a' } },
    espinaca: { f: 'roseta', tipo: 'lanza', pal: OS }, acelga: { f: 'roseta', tipo: 'penca', pal: OS, tinta: '#fff1d0' },
    rucula: { f: 'roseta', tipo: 'pluma', pal: V }, radicchio: { f: 'roseta', tipo: 'rizada', pal: { v: '#a23a5a', c: '#d66a86', o: '#6e2440', oo: '#4a1830' } },
    berro: { f: 'roseta', tipo: 'pluma', pal: OS }, apio: { f: 'roseta', tipo: 'penca', pal: V, tinta: '#c9f0a0' },
    perejil: { f: 'roseta', tipo: 'pluma', pal: OS }, cilantro: { f: 'roseta', tipo: 'pluma', pal: V }, eneldo: { f: 'roseta', tipo: 'pluma', pal: { v: '#6fbf5a', c: '#a8e07a', o: '#3f8a45', oo: '#2a6035' }, alto: 1.3 },
    'cebolla-de-verdeo': { f: 'varas', tinta: '#fff6e0' }, cebolla: { f: 'varas', tinta: '#d9a05a', bulbo: 1 }, ajo: { f: 'varas', tinta: '#f4ead8', bulbo: 1 }, puerro: { f: 'varas', tinta: '#fff6e0', grueso: 1 }, ciboulette: { f: 'varas', fino: 1, tinta: '#c48aff' },
    repollo: { f: 'repollo', cabeza: '#c8eaa0', lisa: 1 }, coliflor: { f: 'repollo', cabeza: '#fff6e0' }, brocoli: { f: 'repollo', cabeza: '#2f8f4a' }, kale: { f: 'repollo', rizado: 1 }, 'repollitos-de-bruselas': { f: 'repollo', tallo: 1, cabeza: '#9ad06a' },
    zanahoria: { f: 'raiz', tipo: 'pluma', tinta: '#f08a24', largo: 1 }, rabanito: { f: 'raiz', tipo: 'redonda', tinta: '#e8346a' }, remolacha: { f: 'raiz', tipo: 'redonda', tinta: '#8e2a5a', nervio: '#c43a6a' }, nabo: { f: 'raiz', tipo: 'redonda', tinta: '#efe0f6' },
    papa: { f: 'mata', tuber: '#d9b779', florc: '#fff6e0', sinfruto: 1 }, batata: { f: 'rastrera', tuber: '#c9603a', sinfruto: 1, hojac: '#3f9a5a' },
    tomate: { f: 'mata', tinta: '#e8342a', fr: 'bola' }, pimiento: { f: 'mata', tinta: '#f2b632', fr: 'largo' }, 'aji-picante': { f: 'mata', tinta: '#e8342a', fr: 'fino' }, berenjena: { f: 'mata', tinta: '#5a2f8a', fr: 'gota', florc: '#c48aff' },
    frutilla: { f: 'baja', tinta: '#e8342a' },
    'zapallito-de-tronco': { f: 'rastrera', tinta: '#2f7f3a', frr: 3 }, zapallo: { f: 'rastrera', tinta: '#f08a24', frr: 5 }, pepino: { f: 'rastrera', tinta: '#2f8f4a', frl: 1 }, melon: { f: 'rastrera', tinta: '#e9d27a', frr: 4 }, sandia: { f: 'rastrera', tinta: '#2a7a3f', frr: 5, raya: '#7fd06a' },
    chaucha: { f: 'trepadora', tinta: '#7bd058', florc: '#fff6e0' }, arveja: { f: 'trepadora', tinta: '#9be06a', florc: '#f4d0ff' }, haba: { f: 'trepadora', sincana: 1, pal: AZ, tinta: '#8fcf6a', florc: '#fff6e0' },
    choclo: { f: 'alta', tinta: '#ffd23f' }, girasol: { f: 'alta', sol: 1, tinta: '#ffd23f' },
    albahaca: { f: 'aromatica', tipo: 'ancha', pal: { v: '#4fc04a', c: '#9af06a', o: '#2a8a3a', oo: '#1b5e2a' }, florc: '#fff6e0' }, menta: { f: 'aromatica', tipo: 'ancha', pal: OS, florc: '#e0c8ff' }, melisa: { f: 'aromatica', tipo: 'ancha', pal: V, florc: '#fff6e0' },
    oregano: { f: 'aromatica', tipo: 'cojin', pal: V, florc: '#f0b8e0' }, tomillo: { f: 'aromatica', tipo: 'cojin', pal: GR, florc: '#e0a8f0' }, salvia: { f: 'aromatica', tipo: 'ancha', pal: GR, florc: '#9a7aff' },
    romero: { f: 'aromatica', tipo: 'aguja', pal: { v: '#4a8a6a', c: '#7ab89a', o: '#2f6048', oo: '#1f4030' }, florc: '#a8b8ff' }, lavanda: { f: 'aromatica', tipo: 'espiga', pal: GR, florc: '#9a6aff' }, laurel: { f: 'aromatica', tipo: 'arbolito', pal: OS },
    calendula: { f: 'flor', tinta: '#ff9a1f', centro: '#a8500a', n: 3 }, copete: { f: 'flor', tinta: '#ff6a1f', centro: '#ffc233', n: 3, pompon: 1, pluma: 1 }, borraja: { f: 'flor', tinta: '#4a7bff', centro: '#1d1b4b', n: 4, estrella: 1, pal: AZ },
    capuchina: { f: 'flor', tinta: '#ff4a2a', centro: '#ffc233', n: 3, escudo: 1 }, cosmos: { f: 'flor', tinta: '#ff7ab8', centro: '#ffd23f', n: 3, pluma: 1, alto: 1.35 }
  };
export function estiloDe(p) {
    var e = ESTILO[p.slug]; if (e) return e;
    var g = p.grupo || '', f = p.familia || '';
    return { f: g === 'Flor polinizadora' ? 'flor' : f === 'cucurbitacea' ? 'rastrera' : g === 'Legumbre' ? 'trepadora' : g === 'Hortaliza de fruto' ? 'mata' : f === 'aliacea' ? 'varas' : g === 'Hortaliza de raíz/bulbo' ? 'raiz' : g === 'Aromática' ? 'aromatica' : f === 'brasicacea' ? 'repollo' : 'roseta', tinta: '#ffd23f' };
  }

