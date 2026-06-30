const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formatea un monto en pesos argentinos (ej: $ 1.500). */
export const formatCurrency = (amount: number): string =>
  currencyFormatter.format(amount);

/** Fecha y hora legible (ej: 29 jun 2026, 18:30). */
export const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));

/** Iniciales para fallback de avatar (ej: "Juan Pérez" -> "JP"). */
export const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";
