/**
 * `npm run bot` juega 8 años con semillas distintas en cada patio.
 * `npm run bot -- -v 7` narra el año de la semilla 7. `--patio balcon` elige el patio.
 * `--espacio` juega con las reglas de espacio del paso 3 prendidas (huella, densidad y sombra
 * reales), que es lo que va a valer después del paso 4: sirve para ver cuánto hay que rebalancear.
 */
import * as M from '../src/dominio';
import { jugarUnAnio } from './jugador';
const args = process.argv.slice(2),
  iP = args.indexOf('--patio'),
  iV = args.indexOf('-v');
const patios = iP >= 0 ? [args[iP + 1]] : Object.keys(M.PATIOS);
const jugar = <T>(f: () => T): T => (args.includes('--espacio') ? M.conEspacioReal(f) : f());
if (iV >= 0) jugar(() => jugarUnAnio(M, +(args[iV + 1] ?? 1), (l) => console.log(l), { patio: patios[0] }));
else
  for (const patio of patios)
    for (let s = 1; s <= 8; s++) {
      const E = jugar(() => jugarUnAnio(M, s, undefined, { patio }));
      console.log(
        JSON.stringify({
          patio,
          semilla: s,
          caracter: E.caracter,
          ...M.balance(E),
          vivas: Object.keys(E.plantas).length,
        }),
      );
    }
