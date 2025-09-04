
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Palette, CreditCard, DollarSign, Phone, Database, Code, BarChart3 } from 'lucide-react';
import BrandingConfigManager from './BrandingConfigManager';
import StripeConfigManager from './StripeConfigManager';
import PlanPricingManager from './PlanPricingManager';
import ContactConfigManager from './ContactConfigManager';
import SystemConfigManager from './SystemConfigManager';
import { PWAManifestGenerator } from './PWAManifestGenerator';
import { Tabs as NestedTabs, TabsList as NestedTabsList, TabsTrigger as NestedTabsTrigger, TabsContent as NestedTabsContent } from '@/components/ui/tabs';
import AnalyticsOverview from './analytics/AnalyticsOverview';
import ChurnAnalysis from './analytics/ChurnAnalysis';
import PlanAnalytics from './analytics/PlanAnalytics';
import CustomersTable from './analytics/CustomersTable';

const AdminSectionTabs: React.FC = () => {
  return (
    <Tabs defaultValue="system" className="w-full">
      <TabsList className="grid w-full grid-cols-7">
        <TabsTrigger value="system" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Sistema
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="branding" className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Branding
        </TabsTrigger>
        <TabsTrigger value="stripe" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Stripe
        </TabsTrigger>
        <TabsTrigger value="pricing" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Planos
        </TabsTrigger>
        <TabsTrigger value="contact" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Contato
        </TabsTrigger>
        <TabsTrigger value="pwa" className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          PWA
        </TabsTrigger>
      </TabsList>

      <TabsContent value="system" className="mt-6">
        <SystemConfigManager />
      </TabsContent>

      <TabsContent value="analytics" className="mt-6">
        <NestedTabs defaultValue="insights" className="w-full">
          <NestedTabsList className="grid w-full grid-cols-4">
            <NestedTabsTrigger value="insights">Insights</NestedTabsTrigger>
            <NestedTabsTrigger value="churn">Churn</NestedTabsTrigger>
            <NestedTabsTrigger value="plans">Planos</NestedTabsTrigger>
            <NestedTabsTrigger value="customers">Clientes</NestedTabsTrigger>
          </NestedTabsList>
          <NestedTabsContent value="insights" className="mt-6">
            <AnalyticsOverview />
          </NestedTabsContent>
          <NestedTabsContent value="churn" className="mt-6">
            <ChurnAnalysis />
          </NestedTabsContent>
          <NestedTabsContent value="plans" className="mt-6">
            <PlanAnalytics />
          </NestedTabsContent>
          <NestedTabsContent value="customers" className="mt-6">
            <CustomersTable />
          </NestedTabsContent>
        </NestedTabs>
      </TabsContent>

      <TabsContent value="branding" className="mt-6">
        <BrandingConfigManager />
      </TabsContent>

      <TabsContent value="stripe" className="mt-6">
        <StripeConfigManager />
      </TabsContent>

      <TabsContent value="pricing" className="mt-6">
        <PlanPricingManager />
      </TabsContent>

      <TabsContent value="contact" className="mt-6">
        <ContactConfigManager />
      </TabsContent>

      <TabsContent value="pwa" className="mt-6">
        <PWAManifestGenerator />
      </TabsContent>
    </Tabs>
  );
};

export default AdminSectionTabs;
