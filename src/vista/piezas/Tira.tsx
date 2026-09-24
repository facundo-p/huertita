/** La tira de estadíos de una especie: de la semilla a la semilla, con los días de cada paso. */
import { useEffect, useRef } from 'preact/hooks';
import * as M from '../../dominio';
import * as SP from '../../arte';

export function TiraDeEstadios({ slug, actual }: { slug: string; actual?: number | null }) {
  const lienzo = useRef<HTMLCanvasElement>(null),
    sp = M.ESPECIES[slug];
  useEffect(() => {
    if (!lienzo.current || !lienzo.current.getContext('2d')) return; // sin canvas (tests), sin dibujo
    SP.tira(
      lienzo.current,
      { slug, grupo: sp.grupo, familia: sp.familia, tutor: sp.cuidados.includes('tutorado') },
      { actual: actual ?? -1, dpr: window.devicePixelRatio },
    );
  });
  const dias = ['día 0', sp.dg.min + '–' + sp.dg.max + ' d', '', '', sp.dc.min + '–' + sp.dc.max + ' d', ''];
  if (sp.dt) dias[2] = 'trasp. ' + sp.dt.min + '–' + sp.dt.max + ' d';
  const nombres = ['semilla', 'plantín', 'crece', 'florece', sp.flor ? 'en flor' : 'cosecha', 'da semilla'];
  return (
    <figure class="hz-tira">
      <canvas ref={lienzo} data-tira={slug} data-actual={actual ?? undefined} aria-label={'Estadíos de ' + sp.nombre} />
      <figcaption>
        {nombres.map((n, i) => (
          <span key={i} class={actual === i ? 'on' : ''}>
            {n}
            {dias[i] && <small>{dias[i]}</small>}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
