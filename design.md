# JuntadasApp — Plan de diseño

Cómo se diseñó la interfaz, qué se decidió en OpenPencil antes de escribir
código, y qué reglas de pulido se aplicaron después sobre los componentes.

## 1. Punto de partida

La app se usa **de pie, con una mano, en un asado**. Eso define todo:

- Mobile-first real: el layout se diseñó a 390 px y sólo después se verificó en
  pantallas grandes, no al revés.
- Las acciones frecuentes (cargar gasto, ver cuánto debo) tienen que estar a
  distancia de pulgar.
- Contraste alto: se usa con sol de frente y con poca luz.
- Nada de decoración que compita con los números. Los montos son el contenido.

De ahí sale la decisión estética: **paleta monocromática**. Sin color de marca,
sin acentos. El único color del sistema aparece en los toasts de error y de
éxito, donde el color *es* la información.

## 2. Diseño en OpenPencil

El archivo fuente vive en [`design/juntadas-app.op`](./design/juntadas-app.op),
con su export a `design/juntadas-app.fig`.

### Cómo se trabajó

OpenPencil se usó conectado al editor por MCP, lo que permitió tres cosas que
cambiaron el orden de trabajo habitual:

1. **Extraer los tokens del diseño, no transcribirlos.** En vez de leer valores
   de un panel y copiarlos a mano, los estilos del documento se volcaron
   directamente a las variables de `globals.css`. La paleta, la escala tipográfica
   y los radios del código son literalmente los del archivo de diseño.
2. **Auditar el propio diseño.** Antes de implementar se analizaron los colores,
   la tipografía y el espaciado usados en las pantallas para detectar
   inconsistencias — grises casi iguales, tamaños de fuente huérfanos, paddings
   que no caían en la escala. Se corrigieron en el diseño, no en el código.
3. **Comparar pantalla contra componente.** Con las pantallas y el código
   disponibles a la vez, la revisión fue diff de implementación contra intención,
   en vez de "se parece bastante".

### Pantallas definidas

Las dos páginas del documento (`Pantallas` y `Pantallas II`) cubren el recorrido
completo, numeradas en orden de uso:

| # | Pantalla | Decisión que fija |
| --- | --- | --- |
| 01 | Login | Jerarquía del formulario y peso del título |
| 02 | Home vacío | Cómo se ve la app sin datos: el estado vacío es la primera impresión |
| 03 | Home con juntadas | Fila de juntada: nombre, personas, total, chevron |
| 04 | Juntada — Gastos | Card de resumen arriba, lista de gastos abajo |
| 05 | Cargar gasto | Bottom sheet: monto grande primero, resto después |
| 06 | Detalle de gasto | Qué datos se muestran y en qué orden |
| 07 | Historial | Gastos y pagos en una sola línea de tiempo |
| 08 | Ajustes de juntada | Participantes, invitar, abandonar |
| 09 | Saldar | Plan de transferencias y estado "cuentas saldadas" |
| 10 | Participantes | Distinción entre participante con cuenta y gestionado |

### Decisiones tomadas en el diseño

**Bottom sheet en vez de modal centrado para cargar datos.** Sube desde el borde
inferior, donde ya está el pulgar. El modal centrado queda para confirmaciones y
detalles, que se leen, no se completan.

**El monto es el elemento más grande del sheet de gasto.** `text-3xl`, bold,
tabular. Es el dato que el usuario ya tiene en la cabeza cuando abre el sheet;
todo lo demás es secundario.

**Números siempre tabulares.** Una columna de montos con cifras de ancho
variable baila al actualizarse. `tabular-nums` en todo monto, sin excepción.

**Tile de icono, no icono suelto.** Cada fila de lista lleva su icono dentro de
un cuadrado con fondo `muted`. Le da un punto de anclaje a la izquierda y
mantiene el alto de fila constante aunque el icono cambie.

**Estados vacíos con borde discontinuo.** El trazo discontinuo comunica
"placeholder", distinto de una card con contenido. Es la única card del sistema
que usa borde y no sombra (ver sección 4).

## 3. Tokens

Todo vive en `src/app/globals.css`. No hay valores de color, radio o curva
escritos a mano en componentes.

### Color

Escala de grises neutros puros, de `#fafafa` a `#0a0a0a`. Modo claro y oscuro
definidos como dos juegos completos de variables, no como filtros o inversiones.

Los toasts son la excepción: rojo para error, verde para éxito, aplicados como
barra lateral (`inset box-shadow`) y color de icono. El texto queda neutro.

### Radio

`--radius: 0.625rem` (10 px), con la escala derivada por multiplicación
(`sm` 0.6×, `md` 0.8×, `lg` 1×, `xl` 1.4×…). El valor bajó desde 1 rem durante el
pulido: los radios muy generosos hacían que las cards de datos densos parecieran
más blandas de lo que el contenido pedía.

**Radio concéntrico:** al anidar superficies con un inset visible y parejo,
`radio externo = radio interno + padding`. Donde el padding pasa de 24 px, las
capas se tratan como superficies independientes y cada una elige su radio.

### Movimiento

Las curvas nativas de CSS son demasiado débiles para UI: les falta el impulso
que hace que una animación se sienta intencional. El sistema define cuatro:

| Token | Valor | Para qué |
| --- | --- | --- |
| `--motion-ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Entradas y salidas, estados interactivos |
| `--motion-ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Movimiento en pantalla |
| `--motion-ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Bottom sheets y drawers |
| `--motion-ease-crossfade` | `cubic-bezier(0.2, 0, 0, 1)` | Cross-fade de iconos |

`--motion-ease-out` está mapeada a la utilidad `ease-out` de Tailwind vía
`@theme inline`. Escribir `ease-out` en cualquier componente usa la curva fuerte,
no la nativa.

**Nunca `ease-in` en UI.** Arranca lento, justo en el momento que el usuario está
mirando, y hace que la interfaz se sienta pesada. Un dropdown con `ease-in` a
300 ms *se siente* más lento que uno con `ease-out` a los mismos 300 ms.

### Presupuesto de duración

| Elemento | Duración |
| --- | --- |
| Feedback de press | 150 ms |
| Hover, cambio de color | ≤ 150 ms |
| Tabs, navegación de alta frecuencia | 100 ms |
| Dropdowns | 150 ms |
| Modales | 200 ms entrada / 150 ms salida |
| Bottom sheets | 300 ms entrada / 200 ms salida |
| Entrada escalonada (estados vacíos) | 400 ms, 100 ms entre bloques |

La salida siempre es más corta que la entrada: al salir, la atención del usuario
ya se fue al próximo elemento y no hay que competir con eso.

## 4. Reglas de pulido

### Profundidad por sombra, estructura por borde

Un borde sólido para dar profundidad no funciona: el color es fijo y no se
adapta al fondo que tiene debajo. Las sombras usan transparencia y sí lo hacen.

```css
--shadow-border:
  0px 0px 0px 1px oklch(0 0 0 / 0.06),
  0px 1px 2px -1px oklch(0 0 0 / 0.06),
  0px 2px 4px 0px oklch(0 0 0 / 0.04);
```

Tres capas: la primera hace de anillo de 1 px, la segunda da elevación sutil, la
tercera profundidad ambiental. En modo oscuro las capas de profundidad son
invisibles sobre fondo negro, así que se simplifica a un solo anillo blanco al
8 %.

Aplica a cards, containers, botones con estilo delineado, modales, drawers y
dropdowns (`--shadow-overlay` para los elevados).

**No aplica** a nada cuyo borde comunique estructura o estado: divisores entre
filas, el `border-t` del footer de card, el outline de los inputs de formulario
(accesibilidad), el borde discontinuo de los estados vacíos y el borde de la card
de invitación pendiente.

### Escala en press

`scale(0.96)` exacto al presionar, con transición de 150 ms. Por debajo de 0.95
se siente exagerado; 0.99 no se percibe. Va en todo elemento presionable:
botones, filas de juntada, filas de gasto, pills, botones de header.

El componente `Button` lo trae por defecto y expone una prop `static` para
apagarlo donde el movimiento distraiga:

```tsx
<Button>Guardar</Button>          {/* escala al presionar */}
<Button static>Guardar</Button>   {/* sin escala */}
```

Se usan transiciones CSS, no keyframes: si el usuario suelta a mitad del press,
la transición se retarguetea desde donde está en vez de reiniciar.

### Anillo de imagen

Toda imagen lleva un `outline` de 1 px a baja opacidad, con `outline-offset: -1px`
para que el anillo se dibuje justo dentro del borde y respete el radio.

El color es **neutro puro**: negro al 10 % en claro, blanco al 10 % en oscuro.
Nunca un gris del tema. Un gris teñido recoge el color de la superficie de abajo
y se lee como suciedad en el borde de la imagen. Aplica a avatares y a las fotos
de ticket.

### Cross-fade de iconos

Sin librería de motion, los dos iconos quedan siempre en el DOM y uno se
posiciona absoluto sobre el otro. Ninguno desmonta, así que entrada y salida
animan las dos. Valores exactos: `scale` 0.25 → 1, `opacity` 0 → 1,
`blur` 4 px → 0, 300 ms con `cubic-bezier(0.2, 0, 0, 1)`.

En el toggle de tema el estado sale de la clase `.dark` del `<html>` — la misma
fuente de verdad que los colores. Eso elimina el parpadeo que tenía antes, cuando
el icono esperaba a que React montara para saber qué tema estaba activo.

### Supresión de transiciones al cambiar de tema

Un cambio de tema modifica color, fondo, borde y sombra en casi todos los
elementos a la vez. Si cada uno respeta su transición, el switch se unta durante
150 ms en vez de cortar.

`applyTheme` inyecta `*,*::before,*::after{transition:none !important}`, fuerza
un reflow leyendo `document.body.offsetHeight` para que los colores nuevos se
resuelvan mientras el override sigue puesto, y lo retira dos frames después.

### Trazo de icono según el peso del texto

Un icono hairline al lado de texto bold se lee como roto. El trazo acompaña el
peso de la etiqueta:

| Texto adyacente | Trazo |
| --- | --- |
| Regular (400) | 1.5 px |
| Medium / Semibold (500–600) | 2 px |
| Bold (700) | 2.5 px |

`Button` usa 2 px (su etiqueta es `font-medium`).
`BottomSheetPrimaryButton`, que es `font-bold`, sube a 2.5 px.

### Transicionar sólo lo que cambia

Ningún `transition: all` ni `transition-colors` genérico. Cada transición nombra
sus propiedades:

```tsx
className="transition-[background-color,box-shadow,scale] duration-150 ease-out"
```

### Restricción de movimiento

- **Alta frecuencia → feedback instantáneo.** Los tabs de la juntada se navegan
  decenas de veces por sesión: sólo color, 100 ms, sin escala ni entrada propia.
  Una animación ahí cobra su costo de atención en cada toque.
- **Movimiento nunca es el único canal.** Todo cambio de estado que una animación
  comunica queda visible sin ella: un color, un icono, una etiqueta. El indicador
  de tab activo es un `span` estático, no una animación.
- **Escalonar sólo lo infrecuente.** La entrada en cascada (opacidad + blur +
  `translateY`, 100 ms entre bloques) va en estados vacíos y en "cuentas
  saldadas", que se ven pocas veces. Las listas de datos, que se ven en cada
  visita, aparecen de una.

### Movimiento reducido

`prefers-reduced-motion` no significa cero animación: significa menos y más
suave. Se conservan las transiciones de opacidad y color, que ayudan a entender
qué cambió, y se quitan las de desplazamiento y las animaciones por keyframes.

### Hover en táctil

Tailwind v4 envuelve la variante `hover:` en `@media (hover: hover)`, así que un
tap en un teléfono no dispara estados de hover. Cualquier regla de hover escrita
en CSS plano tiene que agregar esa condición a mano.

## 5. Verificación

- **Sin navegador:** repasar cada estado que el componente define (hover, focus,
  active, loading, vacío) y leer duraciones y curvas del código.
- **Con navegador:** recorrer cada estado y reproducir el movimiento al 10 % de
  velocidad en el panel de Animations. Lo que se siente raro al 10 % es lo que
  está sutilmente mal a velocidad real.
- **Revisar al día siguiente.** Con ojos frescos se ven desprolijidades que
  durante la implementación pasan de largo.
- **Probar en teléfono real**, no en simulador, para todo lo que sea gesto o
  táctil.

## 6. Referencia rápida

| Valor | Token / clase |
| --- | --- |
| Escala en press | `active:not-disabled:scale-[0.96]`, 150 ms |
| Sombra de superficie | `shadow-(--shadow-border)` |
| Sombra de elemento elevado | `shadow-(--shadow-overlay)` |
| Anillo de imagen | `.image-ring` |
| Entrada escalonada | `.stagger-enter` |
| Curva de drawer | `ease-[cubic-bezier(0.32,0.72,0,1)]` |
| Curva general | `ease-out` (mapeada a la curva fuerte) |
