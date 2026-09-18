# JuntadasApp — Plan de ejecución

PWA mobile-first para dividir gastos entre amigos (viajes, asados, eventos) y
saldar cuentas con la menor cantidad de transferencias posible.

## 1. Problema y decisión de producto

Las apps de gastos compartidos existentes exigen que **todos** los participantes
se registren. En la práctica, en un asado de diez personas se bajan la app tres.
El resultado es que el que organiza termina anotando todo en las notas del
celular.

**Decisión central:** la app tiene que funcionar cuando sólo una persona la usa.
De ahí sale el modelo de datos híbrido (sección 3), que es la restricción más
importante de todo el proyecto y condiciona el resto de las decisiones.

### Alcance del MVP

| Dentro | Fuera (por ahora) |
| --- | --- |
| Juntadas con participantes con y sin cuenta | Múltiples monedas |
| Gastos con división igualitaria o manual | Gastos recurrentes |
| Cálculo de saldos y plan de pago mínimo | Integración con bancos o billeteras |
| Registro de pagos parciales | Notificaciones push |
| Invitación por link y por contactos frecuentes | Exportar a Excel/PDF |
| Foto del ticket adjunta al gasto | Chat dentro de la juntada |

### Criterios de éxito

1. Crear una juntada y cargar el primer gasto en menos de 60 segundos, sin que
   nadie más tenga que registrarse.
2. El plan de pago nunca propone más de (n − 1) transferencias para n personas.
3. Los saldos cierran exactamente en cero, sin centavos perdidos.
4. La app se siente instantánea en un teléfono de gama media con 4G.

## 2. Stack tecnológico

| Capa | Elección | Por qué |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router) | Server Components para que la primera pantalla llegue con datos; Server Actions evitan escribir una capa de API |
| UI | **React 19** | `useTransition` y `useOptimistic` para mutaciones sin spinners bloqueantes |
| Lenguaje | **TypeScript** en modo `strict` | El dominio es plata: los errores de tipo acá son errores de dinero |
| Estilos | **Tailwind CSS v4** | Tokens en CSS nativo (`@theme`), sin archivo de config JS |
| Componentes | **shadcn/ui** sobre **Base UI** | Código propio en el repo, no una dependencia opaca; Base UI trae accesibilidad y `data-starting-style`/`data-ending-style` para animar entradas y salidas |
| Iconos | **Lucide** | Un solo set, trazo configurable, `currentColor` |
| Backend | **Supabase** | Postgres con RLS, Auth y Storage en un solo servicio; sin servidor propio que mantener |
| Notificaciones | **Sonner** | Toasts con transiciones interrumpibles |
| Deploy | **Vercel** | Preview por rama y `next build` nativo |

### Lo que deliberadamente no usamos

- **Sin ORM (Prisma/Drizzle).** El esquema es chico y estable. El cliente de
  Supabase con tipos generados alcanza, y la lógica de permisos vive en RLS
  (Postgres), no en el ORM.
- **Sin librería de estado global (Zustand/Redux).** El estado relevante es de
  servidor. Un solo `EventContext` por juntada cubre todo lo demás.
- **Sin React Query.** Server Components + Server Actions + un hook propio
  (`useDebtCalculation`) resuelven fetch e invalidación con menos piezas.
- **Sin librería de animación (Motion/Framer).** Todas las animaciones del plan
  son transiciones CSS. Agregar 30 kB para un cross-fade de iconos no se paga.

## 3. Modelo de datos

El corazón del sistema es **`event_members`**, que une una juntada con una
persona y admite dos formas:

- `user_id` **NOT NULL** → amigo con cuenta real.
- `user_id` **NULL** + `guest_name` → amigo **gestionado a mano**, sin cuenta.

```
users ──< events ──< event_members ──< expenses ──< expense_splits
                              └──────< payments
```

**Regla no negociable:** `expenses` y `payments` referencian
**`event_members.id`**, nunca `users.id`. Así el cálculo de saldos es idéntico
para los dos tipos de participante y no hay ninguna rama `if (tieneCuenta)` en
la lógica de dinero.

### Consecuencias de la regla

- Un invitado gestionado puede convertirse en usuario real después: se le asigna
  `user_id` a su fila de `event_members` y su historial de gastos queda intacto.
- Eliminar un participante con movimientos no puede ser un `DELETE` a secas;
  necesita una política explícita (`src/lib/member-removal.ts`).

### Aritmética de dinero

Todo el cálculo trabaja en **centavos enteros**. Los flotantes se convierten a
unidades sólo al exponer el resultado. El reparto distribuye los centavos
sobrantes entre los primeros participantes para que la suma de las porciones sea
exactamente igual al total.

### Seguridad

RLS habilitado en todas las tablas, con funciones auxiliares
(`is_event_member`, `is_event_owner`) usadas por las políticas. El cliente nunca
recibe la service-role key: toda escritura pasa por Server Actions que validan
el usuario de la sesión.

## 4. Fases de trabajo

### Fase 0 — Cimientos

- Proyecto Next.js con App Router y TypeScript estricto.
- Proyecto Supabase hosted, esquema inicial como migración versionada.
- RLS y políticas desde el primer día, no como paso posterior.
- Tokens de diseño en `globals.css` y componentes base de shadcn/ui.

**Listo cuando:** existe el esquema aplicado y `npm run build` pasa.

### Fase 1 — Autenticación y perfil

- Login con email + contraseña, recuperación y cambio de contraseña.
- Tabla `users` sincronizada con `auth.users`.
- Avatares en Supabase Storage con política de escritura por dueño.

**Listo cuando:** un usuario nuevo se registra, entra y edita su nombre y foto.

### Fase 2 — Juntadas y participantes

- Crear juntada, invitar por link (`/invite/[eventId]`) y aceptar o rechazar.
- Agregar participantes gestionados a mano.
- Contactos frecuentes derivados de juntadas anteriores.

**Listo cuando:** una juntada tiene participantes de los dos tipos conviviendo.

### Fase 3 — Gastos y cálculo

- Cargar gasto con quién pagó, monto y división (igual o manual).
- Núcleo de cálculo puro en `src/lib/debt.ts`, sin React ni Supabase.
- Script de verificación (`scripts/check-debt.mts`) con casos de borde de
  redondeo.

**Listo cuando:** los saldos de todos los casos del script suman exactamente
cero.

### Fase 4 — Saldar

- Algoritmo greedy de minimización de transferencias.
- Registrar pagos parciales y ver el plan actualizado.
- Historial con edición y borrado de gastos y pagos.

**Listo cuando:** el plan propuesto nunca supera (n − 1) transferencias.

### Fase 5 — PWA y rendimiento

- Manifest, iconos y guía de instalación por sistema operativo.
- Precarga de datos de la juntada en el servidor (`[eventId]/layout.tsx`) para
  eliminar el salto de skeleton al entrar.
- `loading.tsx` en las rutas principales.
- Reemplazo de `router.refresh()` por `refetch()` local donde alcanza.
- Caché en memoria de contactos frecuentes.

**Listo cuando:** entrar a una juntada no muestra skeleton en conexión normal.

### Fase 6 — Pulido de interfaz

Detalle completo en [`design.md`](./design.md).

- Sistema de tokens de movimiento y superficie.
- Profundidad por sombra en vez de borde.
- Feedback de press en todo elemento presionable.
- Cross-fade de iconos y supresión de transiciones al cambiar de tema.

**Listo cuando:** cada estado interactivo tiene feedback y ninguna animación
supera su presupuesto de duración.

## 5. Convenciones de trabajo

- **Reglas del agente:** `.cursor/rules/` (ver `AGENTS.md` para el contexto de
  la versión de Next.js).
- **Migraciones:** una por cambio, nombradas con timestamp, nunca editadas
  después de aplicarse. Los rollbacks son migraciones nuevas.
- **Comentarios:** una línea, y sólo para lo que el código no puede mostrar
  (una restricción, un valor exacto, un efecto colateral necesario).
- **Verificación antes de cerrar:** `npx tsc --noEmit`, `npm run lint` y
  `npm run build`.

## 6. Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Errores de redondeo en el reparto | Todo en centavos enteros; script de verificación con casos de borde |
| Una política RLS mal escrita filtra datos entre juntadas | Políticas basadas en funciones auxiliares reutilizadas, nunca condiciones ad-hoc por tabla |
| Borrar un participante con movimientos corrompe los saldos | Política de eliminación explícita y centralizada |
| La app se siente lenta en móvil | Precarga en servidor, sin `router.refresh()` innecesarios, presupuesto de duración por animación |
| Crecer a features fuera del alcance antes de que el núcleo cierre | La tabla de alcance de la sección 1 es la referencia para decir no |
