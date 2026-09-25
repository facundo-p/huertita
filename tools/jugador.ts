/** Un jugador automático simple. Sirve de test de humo, para la foto del test dorado y para balancear. */
export interface MotorJugable {
  crearPartida(semilla: number, opciones?: { patio?: string }): any;
  despachar(E: any, a: any): { ok: boolean };
  pasarDecada(E: any): { dec: number; tipo: string; texto: string }[];
  ESPECIES: Record<string, any>;
  ventana(region: any, slug: string, dec: number, que?: 'trasplante'): string;
  /** el calendario depende de la región de la partida */
  regionDe(E: any): any;
  metodoDe(slug: string, dec: number): string | null;
  evaluarCelda(E: any, slug: string, celda: string): { puntaje: number } | null;
  ratosLibres(E: any): number;
  /** las zonas salen del patio de la partida */
  zonasDe(E: any): { id: string; cria?: boolean }[];
}
/** Lo que el jugador mira de una partida para decidir. */
export interface Vistazo {
  celdas: Record<string, { zona: string; planta: string | null }>;
  plantas: Record<string, any>;
  sobres: Record<string, number>;
  misiones: Record<string, number>;
  dec: number;
  pronostico: { pHelada: number; tmax: number };
}
function leer(E: any): Vistazo {
  return {
    celdas: E.mundo.celdas,
    plantas: E.mundo.plantas,
    sobres: E.recursos.sobres,
    misiones: E.progreso.misiones,
    dec: E.tiempo.dec,
    pronostico: E.tiempo.pronostico,
  };
}
export function jugarUnAnio(
  M: MotorJugable,
  semilla: number,
  narrar?: (linea: string) => void,
  opciones?: { patio?: string; decadas?: number },
): any {
  const E = M.crearPartida(semilla, opciones);
  const ventana = (slug: string, dec: number, que?: 'trasplante'): string => M.ventana(M.regionDe(E), slug, dec, que);
  const zonas = M.zonasDe(E),
    deCria = new Set(zonas.filter((z) => z.cria).map((z) => z.id)),
    deCultivo = zonas.filter((z) => !z.cria).map((z) => z.id);
  const enCria = (celda: string): boolean => deCria.has(leer(E).celdas[celda].zona);
  for (let t = 0; t < (opciones?.decadas ?? 36); t++) {
    const V = leer(E);
    for (const pl of Object.values<any>(V.plantas)) {
      const sp = M.ESPECIES[pl.slug];
      if (pl.etapa === 'cosechable' && !sp.flor) {
        if (!('semillas' in V.misiones) && pl.slug === 'rabanito') M.despachar(E, { tipo: 'semillar', planta: pl.id });
        else M.despachar(E, { tipo: 'cosechar', planta: pl.id });
      }
      if (V.plantas[pl.id] && pl.plaga) M.despachar(E, { tipo: 'tratar', planta: pl.id });
      if (V.plantas[pl.id] && pl.etapa === 'pasada') M.despachar(E, { tipo: 'arrancar', planta: pl.id });
      if (V.plantas[pl.id] && !enCria(pl.celda) && pl.n > 1) M.despachar(E, { tipo: 'ralear', planta: pl.id });
      let vueltas = 0;
      while (
        vueltas++ < 6 &&
        V.plantas[pl.id] &&
        enCria(pl.celda) &&
        sp.dt &&
        pl.prog >= sp.dt.min &&
        ventana(pl.slug, V.dec, 'trasplante') !== 'fuera'
      ) {
        let mejor: { c: string; p: number } | null = null;
        for (const c in V.celdas)
          if (!V.celdas[c].planta && !enCria(c)) {
            const ev = M.evaluarCelda(E, pl.slug, c)!;
            if (!mejor || ev.puntaje > mejor.p) mejor = { c, p: ev.puntaje };
          }
        if (!mejor || mejor.p < 0.4 || !M.despachar(E, { tipo: 'trasplantar', planta: pl.id, celda: mejor.c }).ok)
          break;
      }
    }
    if (V.pronostico.pHelada > 40) for (const z of deCultivo) M.despachar(E, { tipo: 'manta', zona: z });
    const calor = V.pronostico.tmax > 29;
    for (const z of deCultivo) M.despachar(E, { tipo: 'riego', zona: z, nivel: calor ? 2 : 1 });
    let guarda = 0;
    while (M.ratosLibres(E) > 0 && guarda++ < 10) {
      let mejor: { s: string; c: string; p: number } | null = null;
      for (const s in V.sobres)
        if (V.sobres[s] > 0 && ventana(s, V.dec) !== 'fuera')
          for (const c in V.celdas)
            if (!V.celdas[c].planta) {
              const sp = M.ESPECIES[s],
                alm = enCria(c);
              if (alm !== !!(sp.dt && /almacigo/.test(M.metodoDe(s, V.dec) || ''))) continue;
              const ev = M.evaluarCelda(E, s, c)!;
              if (!mejor || ev.puntaje > mejor.p) mejor = { s, c, p: ev.puntaje };
            }
      if (!mejor || mejor.p < 0.45) break;
      M.despachar(E, { tipo: 'sembrar', slug: mejor.s, celda: mejor.c });
    }
    const evs = M.pasarDecada(E);
    if (narrar) for (const e of evs) narrar(String(e.dec).padStart(2) + ' ' + e.tipo.padEnd(6) + ' ' + e.texto);
  }
  return E;
}
