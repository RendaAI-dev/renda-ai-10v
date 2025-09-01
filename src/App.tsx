import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { AppProvider } from "@/contexts/AppContext";
import { SupabaseInitializer } from "@/components/common/SupabaseInitializer";
import { AppointmentsPageSimple } from "./pages/AppointmentsPageSimple";
import Index from "./pages/Index";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <BrandingProvider>
          <PreferencesProvider>
            <SubscriptionProvider>
              <AppProvider>
              <SupabaseInitializer>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<div>Home</div>} />
                    <Route path="/dashboard" element={<Index />} />
                    <Route path="/appointments" element={<AppointmentsPageSimple />} />
                    <Route path="*" element={<div>Página não encontrada</div>} />
                  </Routes>
                </BrowserRouter>
              </SupabaseInitializer>
            </AppProvider>
          </SubscriptionProvider>
        </PreferencesProvider>
        </BrandingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;