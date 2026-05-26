export function formatMoney(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatMoneyCompact(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function marginPercent(margin: number, revenue: number) {
  if (revenue <= 0) return null;
  return (margin / revenue) * 100;
}

export function formatPercent(n: number | null) {
  if (n == null) return "—";
  return `${n.toFixed(1)}%`;
}
