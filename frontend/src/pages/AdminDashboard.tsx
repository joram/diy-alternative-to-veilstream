import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid2 as Grid,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AppLayout from "@/components/AppLayout";
import DataTable, { Column } from "@/components/DataTable";
import InvoicesTable from "@/components/InvoicesTable";
import { AdminCustomer, AdminStats, client, Invoice } from "@/api/client";
import {
  formatMoney,
  formatMoneyCompact,
  formatPercent,
  marginPercent,
} from "@/utils/format";

const customerColumns: Column<AdminCustomer>[] = [
  { id: "customer_id", label: "ID" },
  { id: "first_name", label: "First name" },
  { id: "last_name", label: "Last name" },
  { id: "email", label: "Email" },
  { id: "country", label: "Country" },
  {
    id: "total_revenue",
    label: "Revenue",
    align: "right",
    format: (r) => formatMoney(r.total_revenue),
  },
  {
    id: "total_margin",
    label: "Margin",
    align: "right",
    format: (r) => (
      <Typography component="span" color="success.main" variant="body2">
        {formatMoney(r.total_margin)}
      </Typography>
    ),
  },
  {
    id: "margin_pct",
    label: "Margin %",
    align: "right",
    format: (r) => formatPercent(marginPercent(r.total_margin, r.total_revenue)),
  },
];

const invoiceColumns: Column<Invoice>[] = [
  { id: "invoice_id", label: "Invoice #" },
  { id: "customer_id", label: "Customer" },
  {
    id: "first_name",
    label: "Name",
    format: (r) => `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
  },
  {
    id: "invoice_date",
    label: "Date",
    format: (r) => new Date(r.invoice_date).toLocaleDateString(),
  },
  { id: "billing_country", label: "Country" },
  {
    id: "total",
    label: "Revenue",
    align: "right",
    format: (r) => formatMoney(Number(r.total)),
  },
  {
    id: "margin",
    label: "Margin",
    align: "right",
    format: (r) => (
      <Typography component="span" color="success.main" variant="body2">
        {formatMoney(r.margin ?? 0)}
      </Typography>
    ),
  },
  {
    id: "margin_pct",
    label: "Margin %",
    align: "right",
    format: (r) =>
      formatPercent(marginPercent(r.margin ?? 0, Number(r.total))),
  },
];

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" color={valueColor}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      client.adminStats(),
      client.adminCustomers(),
      client.adminInvoices(),
    ])
      .then(([s, c, i]) => {
        setStats(s);
        setCustomers(c);
        setInvoices(i);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <AppLayout title="Admin">
        <Alert severity="error">{error}</Alert>
      </AppLayout>
    );
  }

  const overallMarginPct = stats
    ? marginPercent(stats.margin, stats.revenue)
    : null;

  return (
    <AppLayout
      title="Admin console"
      subtitle="Unmasked data from the public schema — revenue, wholesale costs, and margins across customers and invoices."
      badge={
        <Chip
          icon={<VisibilityIcon />}
          label="Unmasked"
          size="small"
          sx={{ mr: 2, bgcolor: "rgba(255,255,255,0.15)", color: "white" }}
        />
      }
    >
      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard label="Customers" value={String(stats.customers)} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard label="Invoices" value={String(stats.invoices)} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard label="Revenue" value={formatMoneyCompact(stats.revenue)} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard
              label="Total margin"
              value={formatMoneyCompact(stats.margin)}
              valueColor="success.main"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard
              label="Margin %"
              value={formatPercent(overallMarginPct)}
              valueColor="success.main"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard
              label="Avg margin / invoice"
              value={
                stats.invoices > 0
                  ? formatMoney(stats.margin / stats.invoices)
                  : "—"
              }
              valueColor="success.main"
            />
          </Grid>
        </Grid>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Customers (${customers.length})`} />
        <Tab label={`Invoices (${invoices.length})`} />
      </Tabs>

      {tab === 0 && (
        <DataTable
          columns={customerColumns}
          rows={customers}
          getRowKey={(r) => r.customer_id}
        />
      )}
      {tab === 1 && (
        <InvoicesTable
          columns={invoiceColumns}
          rows={invoices}
          fetchLines={client.adminInvoiceLines}
          showInternal
        />
      )}
    </AppLayout>
  );
}
