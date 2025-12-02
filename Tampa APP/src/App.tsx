import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { TimerIndicator } from "@/components/TimerIndicator";
import { GlobalTimerManager } from "@/components/GlobalTimerManager";
import Dashboard from "./pages/Dashboard";
import Recipes from "./pages/Recipes";
import Labeling from "./pages/Labeling";
import Inventory from "./pages/Inventory";
import Analytics from "./pages/Analytics";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DailyRoutines from "./pages/DailyRoutines";
import Training from "./pages/Training";
import People from "./pages/People";
import Notifications from "./pages/Notifications";
import ProductTrafficLight from "./pages/ProductTrafficLight";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/welcome" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="recipes" element={<Recipes />} />
              <Route path="labeling" element={<Labeling />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="routines" element={<DailyRoutines />} />
              <Route path="training" element={<Training />} />
              <Route path="people" element={<People />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="traffic-light" element={<ProductTrafficLight />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <GlobalTimerManager />
        <TimerIndicator />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
