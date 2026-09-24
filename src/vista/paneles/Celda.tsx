/**
 * Una celda: el lugar (zona, sol, suelo) y, si hay una planta, cómo va, por qué y qué se le puede
 * hacer. Los botones salen de la ficha, que pregunta al dominio: la vista no decide reglas.
 */
import { type AccionDePlanta, fichaDeCelda, type FichaDeCelda, type PlantaEnFicha } from '../../aplicacion/consultas';
import type { ComponentChildren, JSX } from 'preact';
import * as M from '../../dominio';
import * as SP from '../../arte/sprites';
import { interaccion, usarPartida } from '../estado';
import { corto } from '../formato';
import { cuidarPlanta, cuidarSuelo, escenaActual, hacer } from '../mensajes';
import { Epoca } from '../piezas/Almanaque';
import { Diario } from '../piezas/Diario';
import { EscalaDeAgua, EscalaDeLuz, EscalaDeTemperatura, Medidor } from '../piezas/Escala';
import { TiraDeEstadios } from '../piezas/Tira';
import { Inicio } from './Inicio';

const ETAPA = {
  semilla: 'semilla sin germinar',
  plantin: 'plantín',
  creciendo: 'creciendo',
  cosechable: 'para cosechar',
  pasada: 'pasada',
  semillando: 'semillando',
} as const;
const AGUA = { bien: 'bien', seco: 'le falta', exceso: 'le sobra' } as const;
const PLAGA = { pulgon: 'pulgones', oruga: 'orugas', babosa: 'babosas' } as const;

function Lugar({ f }: { f: FichaDeCelda }) {
  return (
    <div class="hz-lugar">
      <b>
        {f.zona.nombre}
        {f.maceta && ' · ' + f.maceta.litros + ' L, ' + f.maceta.prof + ' cm'}
      </b>{' '}
      · {f.horasDeSol} h de sol hoy · {f.suelo} · materia orgánica {f.mo} %{f.mulch && ' · con mulch'}
      <div class="hz-fila">
        {f.puedeMulch && (
          <button class="hz-btn" data-acc="mulch" onClick={() => cuidarSuelo('mulch')}>
            Poner mulch · 1
          </button>
        )}
        {f.admiteCompost && (
          <button
            class="hz-btn"
            data-acc="compost"
            disabled={f.dosisDeCompost < 1}
            onClick={() => cuidarSuelo('compost')}
          >
            Compost · 1 (tenés {f.dosisDeCompost})
          </button>
        )}
      </div>
    </div>
  );
}

function Etapa({ p }: { p: PlantaEnFicha }) {
  const pt = p.punto;
  if (pt?.punto === 'listo') return <b class="hz-bien">plantín listo para trasplantar</b>;
  if (pt?.punto === 'pasado') return <b class="hz-mal">plantín que se está pasando: trasplantalo ya</b>;
  if (pt) return <>plantín, todavía chico</>;
  if (p.pl.etapa === 'cosechable' && p.sp.flor) return <>en flor</>;
  return <>{ETAPA[p.pl.etapa]}</>;
}

function Fila({ nombre, escala, texto }: { nombre: string; escala: JSX.Element; texto: ComponentChildren }) {
  return (
    <tr>
      <th>{nombre}</th>
      <td>{escala}</td>
      <td>{texto}</td>
    </tr>
  );
}

function vecinosEnPalabras(buenas: string[], malas: string[]): string {
  if (!buenas.length && !malas.length) return 'neutros';
  return (
    (buenas.length ? '+ ' + buenas.map(corto).join(', ') : '') +
    (malas.length ? ' − ' + malas.map(corto).join(', ') : '')
  );
}

function Factores({ p }: { p: PlantaEnFicha }) {
  const F = p.factores!,
    sp = p.sp,
    t = F.temp;
  return (
    <>
      <table class="hz-factores">
        <Fila
          nombre="Luz"
          escala={<EscalaDeLuz sp={sp} horas={F.luz.horas} f={F.luz.f} />}
          texto={F.luz.horas + ' h · pide ' + F.luz.pide}
        />
        <Fila
          nombre="Agua"
          escala={<EscalaDeAgua sp={sp} H={F.agua.H} f={F.agua.f} />}
          texto={AGUA[F.agua.estado] + ' · pide riego ' + F.agua.pide}
        />
        <Fila
          nombre="Temp."
          escala={<EscalaDeTemperatura tc={t.tc} t={t.t} f={t.f} rango={[t.tmin, t.tmax]} />}
          texto={'media ' + t.t + ' °C (' + Math.round(t.tmin) + ' a ' + Math.round(t.tmax) + ') · ideal ' + t.pide}
        />
        <Fila
          nombre="Suelo"
          escala={<Medidor f={F.suelo.f} />}
          texto={(F.suelo.maceta < 1 ? 'maceta chica · ' : '') + 'pide ' + M.META.suelos[sp.suelo].nombre.toLowerCase()}
        />
        <Fila
          nombre="Vecinos"
          escala={<Medidor f={F.vecinos.f >= 1 ? 1 : F.vecinos.f - 0.2} />}
          texto={vecinosEnPalabras(F.vecinos.buenas, F.vecinos.malas)}
        />
      </table>
      <p class="hz-dim">
        La banda es lo que pide la especie según el catálogo (clara: tolera; fuerte: ideal). La marca es lo que va a
        tener esta década, y su color dice qué tan bien le viene. En temperatura, la línea fina va de la mínima a la
        máxima.
      </p>
    </>
  );
}

const BOTONES: Record<AccionDePlanta, (p: PlantaEnFicha) => { clase: string; texto: string }> = {
  cosechar: () => ({ clase: 'pri', texto: 'Cosechar' }),
  semillar: () => ({ clase: '', texto: 'Dejar semillar' }),
  mover: ({ pl, sp }) => ({
    clase: sp.dt && pl.prog >= sp.dt.min ? 'pri' : '',
    texto: M.vivas(pl) > 1 ? 'Trasplantar uno · 1 (hay ' + pl.n + ')' : 'Trasplantar · 1',
  }),
  ralear: () => ({ clase: 'pri', texto: 'Ralear: dejar una · 1' }),
  tutorar: () => ({ clase: '', texto: 'Poner tutor · 1' }),
  tratar: () => ({ clase: 'pri', texto: 'Tratar plaga · 1' }),
};

function Acciones({ p }: { p: PlantaEnFicha }) {
  const hacerla = (a: AccionDePlanta) => (a === 'mover' ? hacer({ tipo: 'mover', planta: p.pl.id }) : cuidarPlanta(a));
  return (
    <div class="hz-fila">
      {p.acciones.map((a) => {
        const b = BOTONES[a](p);
        return (
          <button key={a} class={'hz-btn' + (b.clase ? ' ' + b.clase : '')} data-acc={a} onClick={() => hacerla(a)}>
            {b.texto}
          </button>
        );
      })}
      <button class="hz-btn sec" data-acc="arrancar" onClick={() => cuidarPlanta('arrancar')}>
        Arrancar
      </button>
    </div>
  );
}

function Cabecera({ p }: { p: PlantaEnFicha }) {
  const { pl, sp } = p;
  return (
    <>
      <h2>{sp.nombre}</h2>
      <p class="hz-sub">
        <Etapa p={p} /> · sembrada hace {pl.edad} días
        {M.vivas(pl) > 1 && (
          <>
            {' · '}
            <b>{pl.n} plantines</b>
          </>
        )}
        {pl.gen > 0 && ' · semilla propia gen ' + pl.gen}
        {pl.plaga && (
          <>
            {' · '}
            <b class="hz-mal">{PLAGA[pl.plaga]}</b>
          </>
        )}
      </p>
    </>
  );
}

function Avance({ p, celda }: { p: PlantaEnFicha; celda: string }) {
  const { pl, punto } = p,
    vista = escenaActual().celdas[celda]?.planta;
  return (
    <>
      <TiraDeEstadios slug={pl.slug} actual={vista ? SP.etapaDeTira(vista) : null} />
      <div class="hz-medidor">
        <span>{punto ? 'Hacia el trasplante' : 'Avance'}</span>
        <Medidor f={p.avance} clase="avance" />
        <span>Salud {Math.round(pl.salud)}</span>
        <Medidor f={pl.salud / 100} />
      </div>
      {punto?.punto === 'chico' && (
        <p class="hz-dim">
          Le faltan unos {punto.faltan} días de buen crecimiento para el trasplante. Con frío o poca luz crece más lento
          y tarda más que eso.
        </p>
      )}
    </>
  );
}

/** En la almaciguera: cuándo se trasplanta, o que esta especie no se trasplanta. */
function EnElAlmacigo({ p }: { p: PlantaEnFicha }) {
  const { pl, sp } = p;
  if (!p.enAlmacigo) return null;
  if (!sp.dt)
    return (
      <p class="hz-dim">
        {corto(sp.nombre)} no tolera el trasplante: va de siembra directa. Si lo movés, la raíz sufre.
      </p>
    );
  return (
    <p class="hz-dim">
      Se trasplanta con {sp.dt.min}–{sp.dt.max} días de crecimiento.{' '}
      <Epoca v={M.ventana(pl.slug, usarPartida().dec, 'trasplante')} />
    </p>
  );
}

/** Lo que dice el catálogo, y lo que el juego tuvo que suponer. */
function DelCatalogo({ p }: { p: PlantaEnFicha }) {
  const { pl, sp } = p;
  return (
    <>
      <div class="hz-fila">
        <button
          class="hz-btn sec"
          data-acc="ficha"
          data-slug={pl.slug}
          onClick={() => hacer({ tipo: 'ficha', slug: pl.slug })}
        >
          Ficha completa
        </button>
      </div>
      {sp.truco && (
        <p class="hz-cita">
          <span>Del catálogo</span>
          {sp.truco}
        </p>
      )}
      {sp.sup.length > 0 && (
        <p class="hz-dim">Dato supuesto por el juego (el catálogo no lo trae): {sp.sup.join(', ')}.</p>
      )}
    </>
  );
}

function ConPlanta({ f, p }: { f: FichaDeCelda; p: PlantaEnFicha }) {
  const { sp } = p;
  return (
    <>
      <Cabecera p={p} />
      <Avance p={p} celda={f.celda} />
      {p.factores ? (
        <Factores p={p} />
      ) : (
        <p>
          Germina en {sp.dg.min}–{sp.dg.max} días si el suelo está entre{' '}
          {sp.tg ? sp.tg.min + ' y ' + sp.tg.max + ' °C' : 'templado'} y húmedo.
        </p>
      )}
      <Acciones p={p} />
      <EnElAlmacigo p={p} />
      <Diario pl={p.pl} />
      <DelCatalogo p={p} />
      <Lugar f={f} />
    </>
  );
}

export function Celda() {
  const E = usarPartida(),
    sel = interaccion.value.sel,
    f = sel ? fichaDeCelda(E, sel) : null;
  if (!f) return <Inicio />;
  if (f.planta) return <ConPlanta f={f} p={f.planta} />;
  return (
    <>
      <h2>Celda libre</h2>
      <p>{f.zona.desc}</p>
      {f.familiaAnterior && <p class="hz-dim">Lo último que hubo acá fue una {f.familiaAnterior}.</p>}
      <div class="hz-fila">
        <button class="hz-btn pri" data-modo="semillas" onClick={() => hacer({ tipo: 'ir', modo: 'semillas' })}>
          Sembrar acá…
        </button>
      </div>
      <Lugar f={f} />
    </>
  );
}
