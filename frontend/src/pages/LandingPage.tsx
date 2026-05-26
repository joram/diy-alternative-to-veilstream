import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2 as Grid,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import { client, CustomerSummary, CustomerViewMode, setToken } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [becoming, setBecoming] = useState<number | null>(null);
  const [pickCustomer, setPickCustomer] = useState<CustomerSummary | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    client
      .listCustomers()
      .then(setCustomers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const becomeUser = async (customerId: number, mode: CustomerViewMode) => {
    setBecoming(customerId);
    setError(null);
    try {
      const { token } = await client.becomeCustomer(customerId, mode);
      setToken(token);
      await refresh();
      setPickCustomer(null);
      navigate(mode === "support" ? "/support" : "/my-account");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to sign in");
    } finally {
      setBecoming(null);
    }
  };

  const loginAdmin = async () => {
    setAdminLoading(true);
    setError(null);
    try {
      const { token } = await client.loginAdmin(adminPassword);
      setToken(token);
      await refresh();
      setAdminOpen(false);
      navigate("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Admin login failed");
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box
        sx={{
          background: "linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)",
          color: "white",
          py: { xs: 6, md: 10 },
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={2} alignItems="center" textAlign="center">
            <HeadphonesIcon sx={{ fontSize: 56, opacity: 0.9 }} />
            <Typography variant="h3">Chinook Music Store</Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 520 }}>
              Demo portal for customer self-service and admin oversight. Pick a
              customer to experience their masked view, or sign in as admin to
              see all real data.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
              <Chip label="Dynamic masking" sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white" }} />
              <Chip label="Row-scoped customer view" sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white" }} />
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <PersonIcon color="primary" />
                  <Typography variant="h5">Become a user</Typography>
                </Stack>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Pick a customer, then choose whether you are signing in as
                  that user (self-service) or as support (scoped SQL assistant).
                </Typography>

                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <List disablePadding sx={{ maxHeight: 420, overflow: "auto" }}>
                    {customers.map((c) => (
                      <ListItemButton
                        key={c.customer_id}
                        disabled={becoming !== null}
                        onClick={() => setPickCustomer(c)}
                        divider
                      >
                        <ListItemText
                          primary={`${c.first_name} ${c.last_name}`}
                          secondary={`#${c.customer_id} · ${c.country} · ${c.email}`}
                        />
                        {becoming === c.customer_id && <CircularProgress size={22} />}
                      </ListItemButton>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <AdminPanelSettingsIcon color="secondary" />
                  <Typography variant="h5">Admin</Typography>
                </Stack>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Full access to every customer and invoice with unmasked PII —
                  the view a privileged operator sees.
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  size="large"
                  startIcon={<AdminPanelSettingsIcon />}
                  onClick={() => setAdminOpen(true)}
                >
                  Admin login
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                  Demo password: <code>admin</code>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Dialog
        open={pickCustomer !== null}
        onClose={() => becoming === null && setPickCustomer(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {pickCustomer
            ? `${pickCustomer.first_name} ${pickCustomer.last_name}`
            : "Sign in as"}
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            How do you want to access this account?
          </Typography>
          <Stack spacing={1.5}>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<PersonIcon />}
              disabled={becoming !== null}
              onClick={() =>
                pickCustomer && void becomeUser(pickCustomer.customer_id, "customer")
              }
            >
              As that user
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
              Profile and invoices — the customer self-service portal.
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<SupportAgentIcon />}
              disabled={becoming !== null}
              onClick={() =>
                pickCustomer && void becomeUser(pickCustomer.customer_id, "support")
              }
            >
              As support
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
              Support console with natural language or SQL queries, scoped to this
              customer.
            </Typography>
          </Stack>
          {becoming !== null && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <CircularProgress size={28} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickCustomer(null)} disabled={becoming !== null}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={adminOpen} onClose={() => setAdminOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Admin login</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void loginAdmin()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="secondary"
            disabled={adminLoading || !adminPassword}
            onClick={() => void loginAdmin()}
          >
            {adminLoading ? "Signing in…" : "Sign in"}
          </Button>
        </DialogActions>
      </Dialog>

      <Divider />
      <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ py: 2 }}>
        Chinook sample database · PostgreSQL Anonymizer dynamic masking
      </Typography>
    </Box>
  );
}
