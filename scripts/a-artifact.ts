/**
 * Convierte dist-artifact/index.html (una página completa) en el fragmento que pide la
 * publicación de artifacts de Claude: sin doctype, html, head ni body; con el <title> arriba.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const html = readFileSync('dist-artifact/index.html', 'utf8');
const entre = (a: string, b: string) => { const i = html.indexOf(a), j = html.indexOf(b, i); return i < 0 || j < 0 ? '' : html.slice(i + a.length, j); };
const head = entre('<head>', '</head>'), body = entre('<body>', '</body>');
const titulo = (head.match(/<title>[\s\S]*?<\/title>/) ?? ['<title>Huertita</title>'])[0];
const fuentes = (head.match(/<link[^>]+fonts\.googleapis[^>]*>/g) ?? []).join('\n');
const estilos = (head.match(/<style[\s\S]*?<\/style>/g) ?? []).join('\n');
const scripts = (head.match(/<script[\s\S]*?<\/script>/g) ?? []).join('\n');
writeFileSync('dist-artifact/huertita-artifact.html', [titulo, fuentes, estilos, body.trim(), scripts].join('\n') + '\n');
console.log('dist-artifact/huertita-artifact.html listo');
