import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import { StatusRoute } from "@/components/auth/StatusRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ManagerRoute } from "@/components/auth/ManagerRoute";
import { AppLayout } from "@/components/app/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SignupInvite from "./pages/SignupInvite";
import AwaitingApproval from "./pages/AwaitingApproval";
import Inactive from "./pages/Inactive";
import Dashboard from "./pages/Dashboard";
import OrganizationSettings from "./pages/OrganizationSettings";
import UserManagement from "./pages/UserManagement";
import TeamManagement from "./pages/TeamManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes - redirect to app if authenticated */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />

            {/* Invite signup route - public */}
            <Route path="/signup-invite" element={<SignupInvite />} />
            {/* Status-specific routes */}
            <Route
              path="/awaiting-approval"
              element={
                <StatusRoute requiredStatus="pending">
                  <AwaitingApproval />
                </StatusRoute>
              }
            />
            <Route
              path="/inactive"
              element={
                <StatusRoute requiredStatus="inactive">
                  <Inactive />
                </StatusRoute>
              }
            />

            {/* Protected routes with app layout */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/settings/users"
              element={
                <ManagerRoute>
                  <AppLayout>
                    <UserManagement />
                  </AppLayout>
                </ManagerRoute>
              }
            />
            <Route
              path="/app/settings/teams"
              element={
                <ManagerRoute>
                  <AppLayout>
                    <TeamManagement />
                  </AppLayout>
                </ManagerRoute>
              }
            />
            <Route
              path="/app/settings/organization"
              element={
                <AdminRoute>
                  <AppLayout>
                    <OrganizationSettings />
                  </AppLayout>
                </AdminRoute>
              }
            />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
