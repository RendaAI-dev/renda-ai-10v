
import React, { useEffect, useState } from 'react';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingBenefits from '@/components/landing/LandingBenefits';
import LandingCTA from '@/components/landing/LandingCTA';
import LandingHeader from '@/components/landing/LandingHeader';
import { motion } from 'framer-motion';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useBranding } from '@/contexts/BrandingContext';
import { supabase } from '@/integrations/supabase/client';

const LandingPage = () => {
  const { companyName } = useBrandingConfig();
  const { isLoading: brandingLoading, lastUpdated } = useBranding();
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [forcedTheme, setForcedTheme] = useState<string | null>(null);

  // Aplicar tema antes mesmo do primeiro render
  useEffect(() => {
    const loadAndApplyLandingTheme = async () => {
      try {
        console.log('Carregando tema da landing page...');
        const { data, error } = await supabase.functions.invoke('get-public-settings', {
          body: { cacheBuster: Date.now() } // Cache-busting para o tema
        });
        
        if (!error && data?.success && data?.settings?.branding?.landing_theme) {
          const theme = data.settings.branding.landing_theme.value;
          setForcedTheme(theme);
          
          if (theme && theme !== 'system') {
            // Aplicar o tema imediatamente
            const root = document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(theme);
            console.log('Tema aplicado:', theme);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar tema da landing:', err);
      } finally {
        setIsThemeLoaded(true);
      }
    };

    // Timeout de segurança para evitar loading infinito
    const timeoutId = setTimeout(() => {
      console.log('Timeout: Forçando carregamento da landing page...');
      setIsThemeLoaded(true);
    }, 3000); // 3 segundos máximo

    loadAndApplyLandingTheme();
    
    // Cleanup: restaurar tema do sistema quando sair da landing
    return () => {
      clearTimeout(timeoutId);
      
      if (forcedTheme && forcedTheme !== 'system') {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        
        // Detectar preferência do sistema e aplicar
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        const savedTheme = localStorage.getItem("metacash-ui-theme");
        
        if (savedTheme === "system" || !savedTheme) {
          root.classList.add(systemTheme);
        } else {
          root.classList.add(savedTheme);
        }
      }
    };
  }, [lastUpdated]); // Reagir a mudanças no branding

  // Timeout adicional para o branding loading
  useEffect(() => {
    if (brandingLoading) {
      const brandingTimeoutId = setTimeout(() => {
        console.log('Timeout do branding: Continuando sem branding completo...');
        // Força o componente a renderizar mesmo se o branding ainda estiver carregando
        setIsThemeLoaded(true);
      }, 2000);

      return () => clearTimeout(brandingTimeoutId);
    }
  }, [brandingLoading]);

  // Reduzir o tempo de loading e adicionar fallback mais agressivo
  if ((!isThemeLoaded || brandingLoading) && isThemeLoaded !== null) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-muted/20 to-background">
      <LandingHeader />
      <motion.main
        className="w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <LandingHero />
        <LandingFeatures />
        <LandingPricing />
        <LandingBenefits />
        <LandingCTA />
      </motion.main>
      
      {/* Footer */}
      <footer className="bg-card/50 border-t py-8 w-full">
        <div className="w-full px-4 text-center text-muted-foreground">
          <p className="max-w-6xl mx-auto">&copy; 2025 {companyName} - Transforme sua vida financeira</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
