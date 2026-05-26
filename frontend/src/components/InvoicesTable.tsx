import { Fragment, useCallback, useState } from "react";
import {
  Box,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Column } from "@/components/DataTable";
import { Invoice, InvoiceLine } from "@/api/client";
import { formatMoney, formatPercent, marginPercent } from "@/utils/format";

type LineState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; lines: InvoiceLine[] }
  | { status: "error"; message: string };

function lineSubtotal(line: InvoiceLine) {
  return Number(line.unit_price) * line.quantity;
}

function lineMargin(line: InvoiceLine) {
  if (line.unit_cost == null) return null;
  return (Number(line.unit_price) - Number(line.unit_cost)) * line.quantity;
}

function InvoiceLineDetails({
  lines,
  showInternal,
  internalNotes,
}: {
  lines: InvoiceLine[];
  showInternal?: boolean;
  internalNotes?: string | null;
}) {
  const subtotal = lines.reduce((sum, l) => sum + lineSubtotal(l), 0);
  const totalMargin = showInternal
    ? lines.reduce((sum, l) => sum + (lineMargin(l) ?? 0), 0)
    : null;
  const colspanBeforeTotal = showInternal ? 8 : 5;

  return (
    <Box sx={{ py: 1, px: 1 }}>
      {showInternal && internalNotes && (
        <Typography
          variant="body2"
          color="warning.main"
          sx={{ mb: 1.5, fontStyle: "italic" }}
        >
          Internal: {internalNotes}
        </Typography>
      )}
      {showInternal && totalMargin != null && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          Invoice margin:{" "}
          <Typography component="span" color="success.main" fontWeight={600}>
            {formatMoney(totalMargin)}
          </Typography>
          {" · "}
          {formatPercent(marginPercent(totalMargin, subtotal))} of line revenue
        </Typography>
      )}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Line items
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Track</TableCell>
            <TableCell>Album</TableCell>
            <TableCell>Artist</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Unit price</TableCell>
            {showInternal && <TableCell align="right">Unit cost</TableCell>}
            <TableCell align="right">Line total</TableCell>
            {showInternal && <TableCell align="right">Margin</TableCell>}
            {showInternal && <TableCell align="right">Margin %</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {lines.map((line) => {
            const margin = lineMargin(line);
            const retail = lineSubtotal(line);
            return (
              <TableRow key={line.invoice_line_id}>
                <TableCell>{line.track_name}</TableCell>
                <TableCell>{line.album_title ?? "—"}</TableCell>
                <TableCell>{line.artist_name ?? "—"}</TableCell>
                <TableCell align="right">{line.quantity}</TableCell>
                <TableCell align="right">${Number(line.unit_price).toFixed(2)}</TableCell>
                {showInternal && (
                  <TableCell align="right">
                    {line.unit_cost != null
                      ? `$${Number(line.unit_cost).toFixed(2)}`
                      : "—"}
                  </TableCell>
                )}
                <TableCell align="right">${lineSubtotal(line).toFixed(2)}</TableCell>
                {showInternal && (
                  <TableCell align="right">
                    {margin != null ? formatMoney(margin) : "—"}
                  </TableCell>
                )}
                {showInternal && (
                  <TableCell align="right">
                    {formatPercent(margin != null ? marginPercent(margin, retail) : null)}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
          <TableRow>
            <TableCell colSpan={colspanBeforeTotal} align="right">
              <Typography variant="body2" fontWeight={600}>
                Subtotal (retail)
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="body2" fontWeight={600}>
                ${subtotal.toFixed(2)}
              </Typography>
            </TableCell>
            {showInternal && (
              <TableCell align="right">
                <Typography variant="body2" fontWeight={600} color="success.main">
                  {totalMargin != null ? formatMoney(totalMargin) : "—"}
                </Typography>
              </TableCell>
            )}
            {showInternal && (
              <TableCell align="right">
                <Typography variant="body2" fontWeight={600} color="success.main">
                  {formatPercent(
                    totalMargin != null ? marginPercent(totalMargin, subtotal) : null,
                  )}
                </Typography>
              </TableCell>
            )}
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );
}

export default function InvoicesTable({
  columns,
  rows,
  fetchLines,
  showInternal = false,
}: {
  columns: Column<Invoice>[];
  rows: Invoice[];
  fetchLines: (invoiceId: number) => Promise<InvoiceLine[]>;
  showInternal?: boolean;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [lineCache, setLineCache] = useState<Record<number, LineState>>({});

  const toggle = useCallback(
    async (invoiceId: number) => {
      const isOpen = expanded.has(invoiceId);
      if (isOpen) {
        setExpanded((prev) => {
          const next = new Set(prev);
          next.delete(invoiceId);
          return next;
        });
        return;
      }

      setExpanded((prev) => new Set(prev).add(invoiceId));

      const cached = lineCache[invoiceId];
      if (cached?.status === "loaded" || cached?.status === "loading") return;

      setLineCache((prev) => ({ ...prev, [invoiceId]: { status: "loading" } }));
      try {
        const lines = await fetchLines(invoiceId);
        setLineCache((prev) => ({ ...prev, [invoiceId]: { status: "loaded", lines } }));
      } catch (e) {
        setLineCache((prev) => ({
          ...prev,
          [invoiceId]: {
            status: "error",
            message: e instanceof Error ? e.message : "Failed to load lines",
          },
        }));
      }
    },
    [expanded, lineCache, fetchLines],
  );

  const colSpan = columns.length + 1;

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={48} />
            {columns.map((col) => (
              <TableCell key={String(col.id)} align={col.align ?? "left"}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const open = expanded.has(row.invoice_id);
            const lineState = lineCache[row.invoice_id] ?? { status: "idle" };

            return (
              <Fragment key={row.invoice_id}>
                <TableRow
                  hover
                  sx={{ cursor: "pointer", "& > *": { borderBottom: open ? 0 : undefined } }}
                  onClick={() => void toggle(row.invoice_id)}
                >
                  <TableCell>
                    <IconButton size="small" aria-label={open ? "collapse" : "expand"}>
                      {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={String(col.id)} align={col.align ?? "left"}>
                      {col.format
                        ? col.format(row)
                        : String((row as unknown as Record<string, unknown>)[col.id as string] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell colSpan={colSpan} sx={{ py: 0, borderBottom: open ? undefined : 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                      <Box sx={{ bgcolor: "action.hover", borderRadius: 1, my: 1 }}>
                        {lineState.status === "loading" && (
                          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                            <CircularProgress size={28} />
                          </Box>
                        )}
                        {lineState.status === "error" && (
                          <Typography color="error" sx={{ p: 2 }}>
                            {lineState.message}
                          </Typography>
                        )}
                        {lineState.status === "loaded" && (
                          <InvoiceLineDetails
                            lines={lineState.lines}
                            showInternal={showInternal}
                            internalNotes={
                              showInternal
                                ? (row as Invoice & { internal_notes?: string | null })
                                    .internal_notes
                                : null
                            }
                          />
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
