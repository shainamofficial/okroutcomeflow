import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlatformAdminProvider } from "@/contexts/PlatformAdminContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import { StatusRoute } from "@/components/auth/StatusRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ManagerRoute } from "@/components/auth/ManagerRoute";
import { PlatformAdminRoute } from "@/components/auth/PlatformAdminRoute";
import { AppLayout } from "@/components/app/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import LandingPage from "./pages/LandingPage";
import SignupInvite from "./pages/SignupInvite";
import AwaitingApproval from "./pages/AwaitingApproval";
import Inactive from "./pages/Inactive";
import Dashboard from "./pages/Dashboard";
import OrganizationSettings from "./pages/OrganizationSettings";
import UserManagement from "./pages/UserManagement";
import TeamManagement from "./pages/TeamManagement";
import OKRs from "./pages/OKRs";
import Initiatives from "./pages/Initiatives";
import Reviews from "./pages/Reviews";
import Timeline from "./pages/Timeline";
import MyItems from "./pages/MyItems";
import Platform from "./pages/Platform";
import CalendarView from "./pages/CalendarView";
import Workload from "./pages/Workload";
import ActivityLog from "./pages/ActivityLog";
import TableView from "./pages/TableView";
import Automations from "./pages/Automations";
import NotificationSettings from "./pages/NotificationSettings";
import SharedInitiative from "./pages/SharedInitiative";
import InitiativeDetail from "./pages/InitiativeDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PlatformAdminProvider>
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
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />

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
              path="/app/me"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MyItems />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/okrs"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OKRs />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/initiatives"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Initiatives />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/reviews"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Reviews />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/timeline"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Timeline />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/calendar"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CalendarView />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/workload"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Workload />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/activity"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ActivityLog />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/table"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TableView />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/automations"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Automations />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/settings/notifications"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <NotificationSettings />
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

              {/* Platform admin route */}
              <Route
                path="/platform"
                element={
                  <PlatformAdminRoute>
                    <AppLayout>
                      <Platform />
                    </AppLayout>
                  </PlatformAdminRoute>
                }
              />

              {/* Public shared initiative */}
              <Route path="/share/initiative/:token" element={<SharedInitiative />} />

              {/* Public landing page */}
              <Route path="/" element={<LandingPage />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PlatformAdminProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
