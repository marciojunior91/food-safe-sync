import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import { PrintQueueProvider } from "@/contexts/PrintQueueContext";
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
import RoutineTasks from "./pages/RoutineTasks";
import Training from "./pages/Training";
import People from "./pages/People";
import Feed from "./pages/Feed";
import ProductTrafficLight from "./pages/ProductTrafficLight";
import DraftManagement from "./pages/DraftManagement";
import LabelCategories from "./pages/LabelCategories";
import UserProfile from "./components/people/UserProfile";
import PricingPage from "./pages/PricingPage";
import Billing from "./pages/Billing";
import FeedModuleV2 from "./pages/FeedModuleV2";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PrintQueueProvider>
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
                <Route path="routine-tasks" element={<RoutineTasks />} />
                <Route path="training" element={<Training />} />
                <Route path="people" element={<People />} />
                <Route path="people/:userId" element={<UserProfile />} />
                <Route path="feed" element={<FeedModuleV2 />} />
                <Route path="feed-old" element={<Feed />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="traffic-light" element={<ProductTrafficLight />} />
              <Route path="drafts" element={<DraftManagement />} />
              <Route path="label-categories" element={<LabelCategories />} />
              
              {/* Settings */}
              <Route path="settings" element={<Settings />} />
              
              {/* Billing & Pricing */}
              <Route path="pricing" element={<PricingPage />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings/billing" element={<Billing />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <GlobalTimerManager />
        <TimerIndicator />
      </TooltipProvider>
    </PrintQueueProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
