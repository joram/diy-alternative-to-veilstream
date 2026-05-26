import { Navigate, Route, Routes } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "./auth/AuthContext";
import LandingPage from "./pages/LandingPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import SupportDashboard from "./pages/SupportDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { CustomerViewMode } from "./api/client";

function RequireAuth({
  role,
  viewMode,
  children,
}: {
  role: "customer" | "admin";
  viewMode?: CustomerViewMode;
  children: React.ReactNode;
}) {
  const { auth, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!auth || auth.role !== role) {
    return <Navigate to="/" replace />;
  }

  if (viewMode && auth.viewMode !== viewMode) {
    return (
      <Navigate
        to={auth.viewMode === "support" ? "/support" : "/my-account"}
        replace
      />
    );
  }

  return <>{children}</>;
}

export default function App() {
  const { auth, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          auth?.role === "customer" ? (
            <Navigate
              to={auth.viewMode === "support" ? "/support" : "/my-account"}
              replace
            />
          ) : auth?.role === "admin" ? (
            <Navigate to="/admin" replace />
          ) : (
            <LandingPage />
          )
        }
      />
      <Route
        path="/my-account"
        element={
          <RequireAuth role="customer" viewMode="customer">
            <CustomerDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/support"
        element={
          <RequireAuth role="customer" viewMode="support">
            <SupportDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth role="admin">
            <AdminDashboard />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
