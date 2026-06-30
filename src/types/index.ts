/**
 * Tipos del dominio de JuntadasApp.
 * Reflejan 1:1 el esquema de `supabase/schema.sql`.
 *
 * Regla clave del modelo híbrido: `expenses` y `payments` referencian
 * `event_members.id`, nunca `users.id`. Así los cálculos de saldos funcionan
 * idénticamente para amigos con cuenta y para invitados gestionados a mano.
 */

/** Perfil real del usuario (1:1 con auth.users). */
export interface User {
  id: string;
  name: string;
  alias_cvu: string | null;
  avatar_url: string | null;
  created_at: string;
}

/** Una juntada (viaje, asado, evento...). */
export interface Event {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

/**
 * Participante de un evento (la clave del sistema).
 * - `user_id` distinto de null  -> usuario real con cuenta.
 * - `user_id` null              -> invitado gestionado a mano (`guest_name`).
 */
export interface Member {
  id: string;
  event_id: string;
  user_id: string | null;
  guest_name: string | null;
  created_at: string;
  /** Perfil embebido cuando se hace join con `users` (opcional). */
  user?: Pick<User, "id" | "name" | "avatar_url" | "alias_cvu"> | null;
}

/** Un gasto pagado por un participante del evento. */
export interface Expense {
  id: string;
  event_id: string;
  /** event_members.id de quien adelantó el dinero. */
  paid_by: string;
  /** event_members.id de quien cargó el gasto en la app (puede ser distinto de paid_by). */
  created_by: string | null;
  description: string;
  amount: number;
  created_at: string;
  /** Reparto opcional; si está vacío se divide en partes iguales. */
  splits?: ExpenseSplit[];
}

/** Reparto de un gasto entre participantes (divisiones desiguales). */
export interface ExpenseSplit {
  id: string;
  expense_id: string;
  /** event_members.id que debe esta porción. */
  member_id: string;
  amount: number;
}

/** Un pago/saldo de un participante a otro. */
export interface Payment {
  id: string;
  event_id: string;
  /** event_members.id que paga. */
  from_member: string;
  /** event_members.id que recibe. */
  to_member: string;
  amount: number;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Tipos derivados para la lógica de negocio (no persistidos)
// -----------------------------------------------------------------------------

/** Saldo neto de un participante dentro de un evento. */
export interface MemberBalance {
  memberId: string;
  /** Nombre a mostrar (perfil real o guest_name). */
  name: string;
  avatarUrl: string | null;
  /** > 0 le deben dinero (acreedor); < 0 debe dinero (deudor). */
  balance: number;
}

/** Transferencia sugerida por el algoritmo de minimización. */
export interface SettlementTransfer {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
}

/** Resultado completo del cálculo de deudas de un evento. */
export interface DebtCalculation {
  balances: MemberBalance[];
  transfers: SettlementTransfer[];
  totalSpent: number;
}
