import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export default function AppLayout({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="primary" elevation={0}>
        <Toolbar>
          <HeadphonesIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Chinook Music Store
          </Typography>
          {badge}
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={() => void handleLogout()}
          >
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography color="text.secondary">{subtitle}</Typography>
          )}
        </Box>
        {children}
      </Container>
    </Box>
  );
}
