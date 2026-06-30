import { calculateDebt } from "../src/lib/debt.ts";

// Helpers para construir datos de prueba.
const member = (id: string, name: string, guest = true) => ({
  id,
  event_id: "ev",
  user_id: guest ? null : id,
  guest_name: guest ? name : null,
  created_at: "",
  user: guest ? null : { id, name, avatar_url: null, alias_cvu: null },
});

let failures = 0;
const assert = (label: string, cond: boolean) => {
  console.log(`${cond ? "OK  " : "FAIL"}  ${label}`);
  if (!cond) failures += 1;
};

// --- Caso 1: asado de 3, paga A $300, división igual --------------------------
{
  const members = [member("A", "Ana"), member("B", "Beto"), member("C", "Caro")];
  const expenses = [
    {
      id: "e1",
      event_id: "ev",
      paid_by: "A",
      description: "Asado",
      amount: 300,
      created_at: "",
      splits: [],
    },
  ];
  const r = calculateDebt(members, expenses, []);
  const bal = (id: string) => r.balances.find((b) => b.memberId === id)!.balance;

  assert("C1 total = 300", r.totalSpent === 300);
  assert("C1 saldo Ana = +200", bal("A") === 200);
  assert("C1 saldo Beto = -100", bal("B") === -100);
  assert("C1 saldo Caro = -100", bal("C") === -100);
  assert("C1 transferencias = 2", r.transfers.length === 2);
  assert(
    "C1 todas van hacia Ana",
    r.transfers.every((t) => t.toMemberId === "A"),
  );
  assert(
    "C1 suma transferida = 200",
    r.transfers.reduce((s, t) => s + t.amount, 0) === 200,
  );
}

// --- Caso 2: redondeo de centavos ($100 entre 3) ------------------------------
{
  const members = [member("A", "Ana"), member("B", "Beto"), member("C", "Caro")];
  const expenses = [
    {
      id: "e1",
      event_id: "ev",
      paid_by: "A",
      description: "Café",
      amount: 100,
      created_at: "",
      splits: [],
    },
  ];
  const r = calculateDebt(members, expenses, []);
  const sum = r.balances.reduce((s, b) => s + b.balance, 0);
  assert("C2 suma de saldos = 0 (sin perder centavos)", Math.abs(sum) < 1e-9);
}

// --- Caso 3: pagos saldan la deuda -------------------------------------------
{
  const members = [member("A", "Ana"), member("B", "Beto")];
  const expenses = [
    {
      id: "e1",
      event_id: "ev",
      paid_by: "A",
      description: "Nafta",
      amount: 100,
      created_at: "",
      splits: [],
    },
  ];
  // Beto debe 50 a Ana y se lo paga.
  const payments = [
    {
      id: "p1",
      event_id: "ev",
      from_member: "B",
      to_member: "A",
      amount: 50,
      created_at: "",
    },
  ];
  const r = calculateDebt(members, expenses, payments);
  assert("C3 sin transferencias pendientes", r.transfers.length === 0);
}

// --- Caso 4: divisiones desiguales (splits) ----------------------------------
{
  const members = [member("A", "Ana"), member("B", "Beto"), member("C", "Caro")];
  const expenses = [
    {
      id: "e1",
      event_id: "ev",
      paid_by: "A",
      description: "Cena",
      amount: 200,
      created_at: "",
      splits: [
        { id: "s1", expense_id: "e1", member_id: "A", amount: 50 },
        { id: "s2", expense_id: "e1", member_id: "B", amount: 50 },
        { id: "s3", expense_id: "e1", member_id: "C", amount: 100 },
      ],
    },
  ];
  const r = calculateDebt(members, expenses, []);
  const bal = (id: string) => r.balances.find((b) => b.memberId === id)!.balance;
  assert("C4 Ana = +150", bal("A") === 150);
  assert("C4 Beto = -50", bal("B") === -50);
  assert("C4 Caro = -100", bal("C") === -100);
}

console.log(failures === 0 ? "\nTODOS LOS TESTS PASARON" : `\n${failures} FALLARON`);
process.exit(failures === 0 ? 0 : 1);
