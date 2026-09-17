/**
 * `npm run bot` juega 8 años con semillas distintas en cada patio.
 * `npm run bot -- -v 7` narra el año de la semilla 7. `--patio balcon` elige el patio.
 */
import * as M from '../src/motor';
import { jugarUnAnio } from './jugador';
const args = process.argv.slice(2), iP = args.indexOf('--patio'), iV = args.indexOf('-v');
const patios = iP >= 0 ? [args[iP + 1]] : Object.keys(M.PATIOS);
if (iV >= 0) jugarUnAnio(M, +(args[iV + 1] ?? 1), (l) => console.log(l), { patio: patios[0] });
else for (const patio of patios) for (let s = 1; s <= 8; s++) { const E = jugarUnAnio(M, s, undefined, { patio }); console.log(JSON.stringify({ patio, semilla: s, caracter: E.caracter, ...M.balance(E), vivas: Object.keys(E.plantas).length })); }
