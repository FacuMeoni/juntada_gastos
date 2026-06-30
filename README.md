# JuntadasApp 💸

PWA mobile-first para dividir gastos entre amigos (viajes, asados, eventos) y saldar cuentas con el mínimo de transferencias.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS v4** + **shadcn/ui** (Base UI) + **Lucide**
- **Supabase** (Auth, Postgres + RLS, Storage)

## Arquitectura de datos (modelo híbrido)

El corazón del sistema es la tabla **`event_members`**, que une un evento con una persona:

- `user_id` **NOT NULL** → amigo con cuenta real.
- `user_id` **NULL** + `guest_name` → amigo **gestionado a mano** (sin cuenta).

`expenses` y `payments` referencian **`event_members.id`** (nunca `users.id`), por
lo que el cálculo de saldos funciona idéntico para ambos tipos de participante.

```
users ──< events ──< event_members ──< expenses ──< expense_splits
                              └──────< payments
```

## Puesta en marcha

El proyecto ya está **conectado a un proyecto Supabase hosted** (`juntadas-app`,
ref `encctvjcrhlemeoyowha`, región `sa-east-1`). El esquema vive en
`supabase/migrations/` y ya fue aplicado a la nube.

1. Instalar dependencias:

```bash
npm install
```

2. El archivo `.env.local` ya está generado con la URL y la publishable key del
   proyecto. (Plantilla en `.env.local.example`.)

3. Levantar el entorno de desarrollo:

```bash
npm run dev
```

> Para el login con Google, habilitá el provider en
> **Supabase → Authentication → Providers**. El magic link por email funciona
> sin configuración extra.

### Trabajar con el esquema (Supabase CLI)

```bash
supabase migration new <nombre>   # nueva migración
supabase db push                  # aplicar migraciones al proyecto remoto
supabase migration list --linked  # ver estado local vs remoto
```

## Lógica de negocio

`src/lib/debt.ts` contiene el núcleo de cálculo (funciones puras, trabajan en
centavos para evitar errores de redondeo):

- `computeBalancesCents` → saldo neto de cada participante.
- `minimizeTransfersCents` → algoritmo greedy que minimiza la cantidad de
  transferencias (a lo sumo `n − 1` para `n` personas).

El hook `useDebtCalculation(eventId)` (`src/hooks/`) trae los datos de Supabase
y aplica esa lógica.

Tests rápidos de la lógica:

```bash
npx tsx scripts/check-debt.mts
```

## Estructura de rutas

| Ruta                      | Descripción                                  |
| ------------------------- | -------------------------------------------- |
| `/`                       | Inicio: resumen + lista de juntadas          |
| `/perfil`                 | Editar nombre, alias/CVU y foto              |
| `/[eventId]`              | Juntada → tab **Gastos**                     |
| `/[eventId]/saldar`       | Saldos + cómo saldar (transferencias mínimas)|
| `/[eventId]/historial`    | Gastos y pagos cronológicos                  |
| `/[eventId]/ajustes`      | Invitar, agregar gestionados, eliminar       |
| `/invite/[eventId]`       | Sumarse a una juntada vía link               |
| `/login`                  | Magic link + Google                          |

## Scripts

```bash
npm run dev     # desarrollo
npm run build   # build de producción
npm run lint    # eslint
```

> **Pendiente opcional:** agregar los íconos PWA `public/icon-192.png` y
> `public/icon-512.png` (referenciados por el manifest).
