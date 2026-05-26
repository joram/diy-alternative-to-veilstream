import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

export interface Column<T> {
  id: keyof T | string;
  label: string;
  align?: "left" | "right";
  format?: (row: T) => React.ReactNode;
}

export default function DataTable<T extends object>({
  columns,
  rows,
  getRowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
}) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={String(col.id)} align={col.align ?? "left"}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={getRowKey(row)} hover>
              {columns.map((col) => (
                <TableCell key={String(col.id)} align={col.align ?? "left"}>
                  {col.format
                    ? col.format(row)
                    : String((row as Record<string, unknown>)[col.id as string] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
