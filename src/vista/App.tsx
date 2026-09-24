/** La interfaz entera. Mismo esqueleto (ids y clases) que el prototipo, así el estilo y las pruebas valen igual. */
import { Barra } from './Barra';
import { Hud } from './Hud';
import { Panel } from './Panel';
import { Patio } from './Patio';
import { Pie } from './Pie';

export function App() {
  return (
    <div class="hz" id="hz">
      <header class="hz-hud" id="hz-hud">
        <Hud />
      </header>
      <main class="hz-main">
        <Patio />
        <section class="hz-panel" id="hz-panel" aria-live="polite">
          <Panel />
        </section>
        <Barra />
      </main>
      <Pie />
    </div>
  );
}
