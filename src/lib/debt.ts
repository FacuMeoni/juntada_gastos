import type {
  DebtCalculation,
  Expense,
  Member,
  MemberBalance,
  Payment,
  SettlementTransfer,
} from "@/types";
import { customAvatarUrl } from "@/lib/avatar";

/**
 * Núcleo de cálculo de deudas — funciones puras, sin React ni Supabase.
 *
 * Trabaja siempre en CENTAVOS (enteros) para evitar errores de redondeo de
 * punto flotante, y convierte a unidades sólo al exponer el resultado.
 *
 * Punto clave del modelo híbrido: todo se calcula sobre `event_members.id`,
 * por lo que es indiferente si el participante tiene `user_id` o es un
 * `guest_name` gestionado a mano.
 */

const toCents = (amount: number): number => Math.round(amount * 100);
const toUnits = (cents: number): number => cents / 100;

/** Nombre a mostrar de un participante (perfil real o invitado). */
export const memberDisplayName = (member: Member): string =>
  member.user?.name?.trim() || member.guest_name?.trim() || "Invitado";

/**
 * Reparte `amountCents` entre `memberIds` lo más equitativamente posible,
 * distribuyendo los centavos sobrantes entre los primeros miembros para que
 * la suma de las porciones sea exactamente igual al total.
 */
const splitEvenly = (
  amountCents: number,
  memberIds: string[],
): Map<string, number> => {
  const result = new Map<string, number>();
  const n = memberIds.length;
  if (n === 0) return result;

  const base = Math.floor(amountCents / n);
  let remainder = amountCents - base * n;

  for (const id of memberIds) {
    const extra = remainder > 0 ? 1 : 0;
    result.set(id, base + extra);
    if (remainder > 0) remainder -= 1;
  }
  return result;
};

/**
 * Reparte `amount` (en unidades) equitativamente entre `memberIds`, devolviendo
 * porciones que suman exactamente el total (los centavos sobrantes van a los
 * primeros miembros). Útil para construir splits desde la UI.
 */
export const splitEvenlyUnits = (
  amount: number,
  memberIds: string[],
): { memberId: string; amount: number }[] => {
  const shares = splitEvenly(toCents(amount), memberIds);
  return memberIds.map((id) => ({
    memberId: id,
    amount: toUnits(shares.get(id) ?? 0),
  }));
};

/**
 * Calcula el saldo neto (en centavos) de cada participante.
 *
 *   saldo = pagó_en_gastos − le_corresponde + pagos_emitidos − pagos_recibidos
 *
 *   saldo > 0  => le deben dinero (acreedor)
 *   saldo < 0  => debe dinero (deudor)
 *
 * La suma de todos los saldos siempre es 0.
 */
export const computeBalancesCents = (
  members: Member[],
  expenses: Expense[],
  payments: Payment[],
): Map<string, number> => {
  const balances = new Map<string, number>();
  const allMemberIds = members.map((m) => m.id);
  for (const id of allMemberIds) balances.set(id, 0);

  const add = (memberId: string, cents: number) => {
    if (!balances.has(memberId)) return; // ignora miembros eliminados
    balances.set(memberId, (balances.get(memberId) ?? 0) + cents);
  };

  for (const expense of expenses) {
    const amountCents = toCents(expense.amount);

    // Quien pagó adelantó el dinero -> suma a su favor.
    add(expense.paid_by, amountCents);

    // Reparto del consumo -> resta a cada quien su porción.
    const splits = expense.splits ?? [];
    if (splits.length > 0) {
      for (const split of splits) add(split.member_id, -toCents(split.amount));
    } else {
      // Sin reparto explícito: división en partes iguales entre todos.
      const shares = splitEvenly(amountCents, allMemberIds);
      for (const [memberId, shareCents] of shares) add(memberId, -shareCents);
    }
  }

  for (const payment of payments) {
    const amountCents = toCents(payment.amount);
    // Quien paga reduce su deuda (entrega efectivo) -> suma a su favor.
    add(payment.from_member, amountCents);
    // Quien recibe ya cobró -> resta.
    add(payment.to_member, -amountCents);
  }

  return balances;
};

/**
 * Algoritmo de minimización de transferencias (greedy).
 * Empareja iterativamente al mayor acreedor con el mayor deudor, lo que
 * produce a lo sumo (n − 1) transferencias para n participantes.
 */
export const minimizeTransfersCents = (
  balancesCents: Map<string, number>,
  nameOf: (memberId: string) => string,
): SettlementTransfer[] => {
  type Node = { memberId: string; amount: number };

  const creditors: Node[] = [];
  const debtors: Node[] = [];

  for (const [memberId, cents] of balancesCents) {
    if (cents > 0) creditors.push({ memberId, amount: cents });
    else if (cents < 0) debtors.push({ memberId, amount: -cents });
  }

  // Mayor monto primero para favorecer transferencias grandes.
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      transfers.push({
        fromMemberId: debtor.memberId,
        fromName: nameOf(debtor.memberId),
        toMemberId: creditor.memberId,
        toName: nameOf(creditor.memberId),
        amount: toUnits(amount),
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount === 0) i += 1;
    if (creditor.amount === 0) j += 1;
  }

  return transfers;
};

/** Cálculo completo de deudas de un evento. */
export const calculateDebt = (
  members: Member[],
  expenses: Expense[],
  payments: Payment[],
): DebtCalculation => {
  const balancesCents = computeBalancesCents(members, expenses, payments);

  const nameById = new Map(members.map((m) => [m.id, memberDisplayName(m)]));
  const nameOf = (id: string) => nameById.get(id) ?? "Invitado";

  const balances: MemberBalance[] = members.map((m) => ({
    memberId: m.id,
    name: nameOf(m.id),
    avatarUrl: customAvatarUrl(m.user?.avatar_url ?? null),
    balance: toUnits(balancesCents.get(m.id) ?? 0),
  }));

  const transfers = minimizeTransfersCents(balancesCents, nameOf);

  const totalSpent = toUnits(
    expenses.reduce((sum, e) => sum + toCents(e.amount), 0),
  );

  return { balances, transfers, totalSpent };
};
