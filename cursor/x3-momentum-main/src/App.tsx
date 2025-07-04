
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { SubscriptionProvider } from "./components/SubscriptionProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import TestAdmin from "./pages/TestAdmin";
import PricingPage from "./pages/PricingPage";
import SuccessPage from "./pages/SuccessPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RouteDebugger = () => {
  const location = useLocation();
  console.log('=== ROUTE DEBUGGER ===');
  console.log('Current location pathname:', location.pathname);
  console.log('Current location search:', location.search);
  console.log('Current location hash:', location.hash);
  console.log('Current location state:', location.state);
  
  // Check if the current path matches any of our defined routes
  const definedRoutes = ['/', '/dashboard', '/auth', '/admin', '/test-admin', '/pricing', '/success'];
  const isDefinedRoute = definedRoutes.includes(location.pathname);
  console.log('Is defined route?', isDefinedRoute);
  console.log('Available routes:', definedRoutes);
  console.log('=== END ROUTE DEBUGGER ===');
  return null;
};

const AppContent = () => {
  console.log('=== APP CONTENT RENDERING ===');
  console.log('AppContent is rendering with all route definitions');
  console.log('=== END APP CONTENT INIT ===');
  
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <RouteDebugger />
        <Routes>
          <Route path="/auth" element={
            (() => {
              console.log('Rendering AuthPage route');
              return <AuthPage />;
            })()
          } />
          <Route path="/" element={
            (() => {
              console.log('Rendering root redirect to dashboard');
              return <Navigate to="/dashboard" replace />;
            })()
          } />
          <Route path="/dashboard" element={
            (() => {
              console.log('Rendering Dashboard route with ProtectedRoute');
              return (
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              );
            })()
          } />
          <Route path="/admin" element={
            (() => {
              console.log('=== ADMIN ROUTE MATCHED ===');
              console.log('Admin route is being rendered!');
              console.log('=== END ADMIN ROUTE MATCHED ===');
              return (
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              );
            })()
          } />
          <Route path="/test-admin" element={
            (() => {
              console.log('=== TEST-ADMIN ROUTE MATCHED ===');
              console.log('Test-admin route is being rendered!');
              console.log('=== END TEST-ADMIN ROUTE MATCHED ===');
              return (
                <ProtectedRoute>
                  <TestAdmin />
                </ProtectedRoute>
              );
            })()
          } />
          <Route path="/pricing" element={
            (() => {
              console.log('Rendering PricingPage route');
              return <PricingPage />;
            })()
          } />
          <Route path="/success" element={
            (() => {
              console.log('Rendering SuccessPage route');
              return <SuccessPage />;
            })()
          } />
          <Route path="*" element={
            (() => {
              console.log('=== CATCH-ALL ROUTE MATCHED ===');
              console.log('Catch-all route triggered - rendering NotFound');
              console.log('This should only happen for truly undefined routes');
              console.log('=== END CATCH-ALL ROUTE ===');
              return <NotFound />;
            })()
          } />
        </Routes>
      </SubscriptionProvider>
    </AuthProvider>
  );
};

const App = () => {
  console.log('=== APP COMPONENT INIT ===');
  console.log('App component is initializing');
  console.log('About to render BrowserRouter with all route definitions');
  console.log('=== END APP COMPONENT INIT ===');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
