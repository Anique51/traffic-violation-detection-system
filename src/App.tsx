import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import Monitoring from "./pages/Monitoring";
import Violations from "./pages/Violations";
import AddViolation from "./pages/AddViolation";
import VehicleHistory from "./pages/VehicleHistory";
import Reports from "./pages/Reports";
import MapView from "./pages/MapView";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Help from "./pages/Help";
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

            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Default route */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Protected routes — requires login */}
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/violations" element={<Violations />} />
              <Route path="/add-violation" element={<AddViolation />} />
              <Route path="/vehicle-history" element={<VehicleHistory />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />

              {/* Admin only */}
              <Route path="/users" element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              } />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
