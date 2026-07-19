import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, keepPreviousData } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlatformAdminProvider } from "@/contexts/PlatformAdminContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import { StatusRoute } from "@/components/auth/StatusRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ManagerRoute } from "@/components/auth/ManagerRoute";
import { PlatformAdminRoute } from "@/components/auth/PlatformAdminRoute";
import { AppLayout } from "@/components/app/AppLayout";

const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const SignupInvite = lazy(() => import("./pages/SignupInvite"));
const AwaitingApproval = lazy(() => import("./pages/AwaitingApproval"));
const Inactive = lazy(() => import("./pages/Inactive"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OrganizationSettings = lazy(() => import("./pages/OrganizationSettings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const TeamManagement = lazy(() => import("./pages/TeamManagement"));
const OKRs = lazy(() => import("./pages/OKRs"));
const Initiatives = lazy(() => import("./pages/Initiatives"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Timeline = lazy(() => import("./pages/Timeline"));
const MyItems = lazy(() => import("./pages/MyItems"));
const Platform = lazy(() => import("./pages/Platform"));
const CalendarView = lazy(() => import("./pages/CalendarView"));
const Workload = lazy(() => import("./pages/Workload"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const TableView = lazy(() => import("./pages/TableView"));
const Automations = lazy(() => import("./pages/Automations"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const SharedInitiative = lazy(() => import("./pages/SharedInitiative"));
const InitiativeDetail = lazy(() => import("./pages/InitiativeDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Help = lazy(() => import("./pages/Help"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      placeholderData: keepPreviousData,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

// Layout routes: guard + chrome render once, pages swap via <Outlet />.
// The inner Suspense keeps the sidebar visible while a lazy page loads.
const ProtectedLayout = () => (
  <ProtectedRoute>
    <AppLayout>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  </ProtectedRoute>
);

const ManagerLayout = () => (
  <ManagerRoute>
    <AppLayout>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  </ManagerRoute>
);

const AdminLayout = () => (
  <AdminRoute>
    <AppLayout>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  </AdminRoute>
);

const PlatformAdminLayout = () => (
  <PlatformAdminRoute>
    <AppLayout>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  </PlatformAdminRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PlatformAdminProvider>
              <Suspense fallback={<RouteFallback />}>
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
                  <Route
                    path="/forgot-password"
                    element={
                      <PublicRoute>
                        <ForgotPassword />
                      </PublicRoute>
                    }
                  />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Invite signup route - public */}
                  <Route path="/signup-invite" element={<SignupInvite />} />

                  {/* Legal / info — public, viewable whether signed in or not */}
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/contact" element={<Contact />} />

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
                  <Route path="/app" element={<ProtectedLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="me" element={<MyItems />} />
                    <Route path="okrs" element={<OKRs />} />
                    <Route path="initiatives" element={<Initiatives />} />
                    <Route path="initiatives/:id" element={<InitiativeDetail />} />
                    <Route path="reviews" element={<Reviews />} />
                    <Route path="timeline" element={<Timeline />} />
                    <Route path="calendar" element={<CalendarView />} />
                    <Route path="workload" element={<Workload />} />
                    <Route path="activity" element={<ActivityLog />} />
                    <Route path="table" element={<TableView />} />
                    <Route path="automations" element={<Automations />} />
                    <Route path="help" element={<Help />} />
                    <Route path="settings/notifications" element={<NotificationSettings />} />
                  </Route>

                  {/* Manager-gated settings */}
                  <Route path="/app/settings" element={<ManagerLayout />}>
                    <Route path="users" element={<UserManagement />} />
                    <Route path="teams" element={<TeamManagement />} />
                  </Route>

                  {/* Admin-gated settings */}
                  <Route path="/app/settings/organization" element={<AdminLayout />}>
                    <Route index element={<OrganizationSettings />} />
                  </Route>

                  {/* Platform admin route */}
                  <Route path="/platform" element={<PlatformAdminLayout />}>
                    <Route index element={<Platform />} />
                  </Route>

                  {/* Public shared initiative */}
                  <Route path="/share/initiative/:token" element={<SharedInitiative />} />

                  {/* Public landing page */}
                  <Route path="/" element={<LandingPage />} />

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </PlatformAdminProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
