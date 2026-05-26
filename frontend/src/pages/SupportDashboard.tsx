import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import AppLayout from "@/components/AppLayout";
import SupportChat from "@/components/SupportChat";
import { client, Customer } from "@/api/client";

export default function SupportDashboard() {
  const [profile, setProfile] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client
      .customerProfile()
      .then(setProfile)
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
      <AppLayout title="Support">
        <Alert severity="error">{error ?? "Could not load customer"}</Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Customer support"
      subtitle={`Assisting ${profile.first_name} ${profile.last_name} (#${profile.customer_id}) — queries are scoped and read-only.`}
      badge={
        <Chip
          icon={<SupportAgentIcon />}
          label="Support mode"
          size="small"
          sx={{ mr: 2, bgcolor: "rgba(255,255,255,0.15)", color: "white" }}
        />
      }
    >
      <Card>
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            Customer context
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Typography variant="h6">
              {profile.first_name} {profile.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profile.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profile.country}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Open the support assistant (bottom-right) to ask questions or run scoped read-only
            SQL. Use expand in the header for a full-screen view.
          </Typography>
        </CardContent>
      </Card>
      <SupportChat variant="support" />
    </AppLayout>
  );
}
