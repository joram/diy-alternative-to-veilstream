/** Format a query result cell for display. */
export function formatCell(cell: unknown, column?: string): string {
  if (cell == null) return "";

  if (typeof cell === "number") {
    const col = column?.toLowerCase() ?? "";
    if (
      col.includes("total") ||
      col.includes("spent") ||
      col.includes("price") ||
      col.includes("cost") ||
      col.includes("margin")
    ) {
      return `$${cell.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return Number.isInteger(cell) ? String(cell) : cell.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  if (typeof cell === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(cell)) {
      return new Date(cell).toLocaleDateString();
    }
    return cell;
  }

  return String(cell);
}
