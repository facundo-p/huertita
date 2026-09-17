/** Un jugador automático simple. Sirve de test de humo, de oráculo para el test dorado y para balancear. */
export interface MotorJugable {
  crearPartida(semilla: number, opciones?: { patio?: string }): any; despachar(E: any, a: any): { ok: boolean }; pasarDecada(E: any): { dec: number; tipo: string; texto: string }[];
  ESPECIES: Record<string, any>; ventana(slug: string, dec: number, que?: any): string; metodoDe(slug: string, dec: number): string | null;
  evaluarCelda(E: any, slug: string, celda: string): { puntaje: number } | null; ratosLibres(E: any): number;
  /** solo el motor nuevo: las zonas salen del patio de la partida. El prototipo tenía estas cuatro fijas. */
  zonasDe?(E: any): { id: string; cria?: boolean }[];
}
const ZONAS_V04 = [{ id: 'suelo' }, { id: 'elevado' }, { id: 'macetas' }, { id: 'almacigo', cria: true }];
export function jugarUnAnio(M: MotorJugable, semilla: number, narrar?: (linea: string) => void, opciones?: { patio?: string }): any {
  const E = M.crearPartida(semilla, opciones);
  const zonas = M.zonasDe ? M.zonasDe(E) : ZONAS_V04, deCria = new Set(zonas.filter((z) => z.cria).map((z) => z.id)), deCultivo = zonas.filter((z) => !z.cria).map((z) => z.id);
  const enCria = (celda: string): boolean => deCria.has(E.celdas[celda].zona);
  for (let t = 0; t < 36; t++) {
    for (const pl of Object.values<any>(E.plantas)) {
      const sp = M.ESPECIES[pl.slug];
      if (pl.etapa === 'cosechable' && !sp.flor) { if (!('semillas' in E.misiones) && pl.slug === 'rabanito') M.despachar(E, { tipo: 'semillar', planta: pl.id }); else M.despachar(E, { tipo: 'cosechar', planta: pl.id }); }
      if (E.plantas[pl.id] && pl.plaga) M.despachar(E, { tipo: 'tratar', planta: pl.id });
      if (E.plantas[pl.id] && pl.etapa === 'pasada') M.despachar(E, { tipo: 'arrancar', planta: pl.id });
      if (E.plantas[pl.id] && !enCria(pl.celda) && pl.n > 1) M.despachar(E, { tipo: 'ralear', planta: pl.id });
      let vueltas = 0;
      while (vueltas++ < 6 && E.plantas[pl.id] && enCria(pl.celda) && sp.dt && pl.prog >= sp.dt.min && M.ventana(pl.slug, E.dec, 'trasplante') !== 'fuera') {
        let mejor: { c: string; p: number } | null = null;
        for (const c in E.celdas) if (!E.celdas[c].planta && !enCria(c)) { const ev = M.evaluarCelda(E, pl.slug, c)!; if (!mejor || ev.puntaje > mejor.p) mejor = { c, p: ev.puntaje }; }
        if (!mejor || mejor.p < 0.4 || !M.despachar(E, { tipo: 'trasplantar', planta: pl.id, celda: mejor.c }).ok) break;
      }
    }
    if (E.prox.pron.pHelada > 40) for (const z of deCultivo) M.despachar(E, { tipo: 'manta', zona: z });
    const calor = E.prox.pron.tmax > 29; for (const z of deCultivo) M.despachar(E, { tipo: 'riego', zona: z, nivel: calor ? 2 : 1 });
    let guarda = 0;
    while (M.ratosLibres(E) > 0 && guarda++ < 10) {
      let mejor: { s: string; c: string; p: number } | null = null;
      for (const s in E.sobres) if (E.sobres[s] > 0 && M.ventana(s, E.dec) !== 'fuera') for (const c in E.celdas) if (!E.celdas[c].planta) {
        const sp = M.ESPECIES[s], alm = enCria(c);
        if (alm !== !!(sp.dt && /almacigo/.test(M.metodoDe(s, E.dec) || ''))) continue;
        const ev = M.evaluarCelda(E, s, c)!; if (!mejor || ev.puntaje > mejor.p) mejor = { s, c, p: ev.puntaje };
      }
      if (!mejor || mejor.p < 0.45) break;
      M.despachar(E, { tipo: 'sembrar', slug: mejor.s, celda: mejor.c });
    }
    const evs = M.pasarDecada(E);
    if (narrar) for (const e of evs) narrar(String(e.dec).padStart(2) + ' ' + e.tipo.padEnd(6) + ' ' + e.texto);
  }
  return E;
}
