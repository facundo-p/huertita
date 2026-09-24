/** Un botón que, para algo que pisa la partida de ahora, pide un segundo toque. */
import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';

interface Props {
  class?: string;
  disabled?: boolean;
  /** si no hace falta confirmar (por ejemplo, el año ya terminó) */
  sinPreguntar?: boolean;
  pregunta: string;
  alConfirmar: () => void;
  children: ComponentChildren;
  [dato: `data-${string}`]: string | undefined;
}

export function Confirmar({ pregunta, alConfirmar, sinPreguntar, children, ...resto }: Props) {
  const [dudando, setDudando] = useState(false);
  const tocar = () => {
    if (dudando || sinPreguntar) alConfirmar();
    else setDudando(true);
  };
  return (
    <button {...resto} onClick={tocar}>
      {dudando ? pregunta : children}
    </button>
  );
}
