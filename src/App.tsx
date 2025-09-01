import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { AppProvider } from "@/contexts/AppContext";
import { SupabaseInitializer } from "@/components/common/SupabaseInitializer";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Import pages
import Index from "./pages/Index";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import TransactionsPage from "./pages/TransactionsPage";
import CategoriesPage from "./pages/CategoriesPage";
import BudgetsPage from "./pages/BudgetsPage";
import GoalsPage from "./pages/GoalsPage";
import ReportsPage from "./pages/ReportsPage";
import SchedulePage from "./pages/SchedulePage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import PlansPage from "./pages/PlansPage";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <BrandingProvider>
            <PreferencesProvider>
              <SupabaseInitializer>
                <SubscriptionProvider>
                  <AppProvider>
                    <BrowserRouter>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/dashboard" element={<Index />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
                        <Route path="/categories" element={<CategoriesPage />} />
                        <Route path="/budgets" element={<BudgetsPage />} />
                        <Route path="/goals" element={<GoalsPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/schedule" element={<SchedulePage />} />
                         <Route path="/appointments" element={<AppointmentsPage />} />
                         <Route path="/settings" element={<SettingsPage />} />
                         <Route path="/profile" element={<ProfilePage />} />
                         <Route path="/plans" element={<PlansPage />} />
                         <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="*" element={<div className="text-center p-8">Página não encontrada</div>} />
                      </Routes>
                    </BrowserRouter>
                    <Toaster />
                    <Sonner />
                  </AppProvider>
                </SubscriptionProvider>
              </SupabaseInitializer>
            </PreferencesProvider>
          </BrandingProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;