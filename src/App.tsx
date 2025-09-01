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
import { TestN8NPage } from "./pages/TestN8NPage";
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
import LandingPage from "./pages/LandingPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ThankYouPage from "./pages/ThankYouPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import RegisterWithPlanPage from "./pages/RegisterWithPlanPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

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
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/dashboard" element={<Index />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
                        <Route path="/categories" element={<CategoriesPage />} />
                        <Route path="/budgets" element={<BudgetsPage />} />
                        <Route path="/goals" element={<GoalsPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/schedule" element={<SchedulePage />} />
                         <Route path="/appointments" element={<AppointmentsPage />} />
                         <Route path="/test-n8n" element={<TestN8NPage />} />
                         <Route path="/settings" element={<SettingsPage />} />
                         <Route path="/profile" element={<ProfilePage />} />
                         <Route path="/plans" element={<PlansPage />} />
                         <Route path="/admin" element={<AdminDashboard />} />
                         <Route path="/landing" element={<LandingPage />} />
                         <Route path="/vendas" element={<LandingPage />} />
                         <Route path="/checkout" element={<CheckoutPage />} />
                         <Route path="/payment-success" element={<PaymentSuccessPage />} />
                         <Route path="/thank-you" element={<ThankYouPage />} />
                         <Route path="/login" element={<LoginPage />} />
                         <Route path="/register" element={<RegisterPage />} />
                         <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                         <Route path="/reset-password" element={<ResetPasswordPage />} />
                         <Route path="/register-with-plan" element={<RegisterWithPlanPage />} />
                         <Route path="/privacy" element={<PrivacyPage />} />
                         <Route path="/terms" element={<TermsPage />} />
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