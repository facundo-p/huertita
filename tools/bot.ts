/** `npm run bot` juega 8 años con semillas distintas. `npm run bot -- -v 7` narra el año de la semilla 7. */
import * as M from '../src/motor';
import { jugarUnAnio } from './jugador';
const args = process.argv.slice(2);
if (args[0] === '-v') jugarUnAnio(M, +(args[1] ?? 1), (l) => console.log(l));
else for (let s = 1; s <= 8; s++) { const E = jugarUnAnio(M, s); console.log(JSON.stringify({ semilla: s, caracter: E.caracter, ...M.balance(E), vivas: Object.keys(E.plantas).length })); }
