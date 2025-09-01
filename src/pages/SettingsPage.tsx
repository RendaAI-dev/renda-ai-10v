
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PreferencesTab from '@/components/settings/PreferencesTab';
import WhatsAppSettings from '@/components/whatsapp/WhatsAppSettings';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Settings } from 'lucide-react';

const SettingsPage = () => {
  const { t } = usePreferences();
  const location = useLocation();
  
  // Determine default tab based on route
  const defaultTab = location.pathname === '/settings/whatsapp' ? 'whatsapp' : 'preferences';

  return (
    <MainLayout>
      <div className="w-full px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Configurações</h1>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferências
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preferences" className="mt-6">
            <PreferencesTab />
          </TabsContent>
          
          <TabsContent value="whatsapp" className="mt-6">
            <WhatsAppSettings />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
