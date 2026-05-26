import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid2 as Grid,
  Stack,
  Typography,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import AppLayout from "@/components/AppLayout";
import { Column } from "@/components/DataTable";
import InvoicesTable from "@/components/InvoicesTable";
import { client, Customer, Invoice } from "@/api/client";
import SupportChat from "@/components/SupportChat";

const invoiceColumns: Column<Invoice>[] = [
  { id: "invoice_id", label: "Invoice #" },
  {
    id: "invoice_date",
    label: "Date",
    format: (r) => new Date(r.invoice_date).toLocaleDateString(),
  },
  { id: "billing_city", label: "City" },
  { id: "billing_country", label: "Country" },
  {
    id: "total",
    label: "Total",
    align: "right",
    format: (r) => `$${Number(r.total).toFixed(2)}`,
  },
];

export default function CustomerDashboard() {
  const [profile, setProfile] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([client.customerProfile(), client.customerInvoices()])
      .then(([p, inv]) => {
        setProfile(p);
        setInvoices(inv);
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

  if (error || !profile) {
    return (
      <AppLayout title="My account">
        <Alert severity="error">{error ?? "Could not load profile"}</Alert>
      </AppLayout>
    );
  }

  const totalSpent = invoices.reduce((sum, i) => sum + Number(i.total), 0);

  return (
    <AppLayout
      title={`Welcome, ${profile.first_name}`}
      subtitle="Your profile and purchase history — real account data for this customer."
      badge={
        <Chip
          icon={<PersonIcon />}
          label="Your account"
          size="small"
          sx={{ mr: 2, bgcolor: "rgba(255,255,255,0.15)", color: "white" }}
        />
      }
    >
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Profile
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Typography variant="h5">
                  {profile.first_name} {profile.last_name}
                </Typography>
                {profile.company && (
                  <Typography color="text.secondary">{profile.company}</Typography>
                )}
                <Typography>{profile.email}</Typography>
                <Typography>{profile.phone}</Typography>
                <Typography>
                  {[profile.address, profile.city, profile.state, profile.postal_code]
                    .filter(Boolean)
                    .join(", ")}
                </Typography>
                <Typography>{profile.country}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="overline" color="text.secondary">
                  Purchase summary
                </Typography>
                <Typography variant="h5">${totalSpent.toFixed(2)}</Typography>
              </Stack>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {invoices.length} invoice{invoices.length === 1 ? "" : "s"} on file
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Your invoices
          </Typography>
          {invoices.length === 0 ? (
            <Alert severity="info">No invoices found.</Alert>
          ) : (
            <InvoicesTable
              columns={invoiceColumns}
              rows={invoices}
              fetchLines={client.customerInvoiceLines}
            />
          )}
        </Grid>
      </Grid>
      <SupportChat variant="customer" />
    </AppLayout>
  );
}
