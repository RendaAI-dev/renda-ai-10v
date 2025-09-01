import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Phone, Clock, Shield, Settings } from 'lucide-react';
import { useWhatsAppSettings } from '@/hooks/useWhatsAppSettings';

const WhatsAppSettings: React.FC = () => {
  const { 
    settings, 
    loading, 
    updateSettings, 
    verifyWhatsAppNumber,
    toggleReminders,
    updateReminderTimes,
    updateQuietHours
  } = useWhatsAppSettings();

  const [phoneNumber, setPhoneNumber] = useState(settings?.whatsapp_number || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [quietStart, setQuietStart] = useState(settings?.quiet_hours_start || '22:00');
  const [quietEnd, setQuietEnd] = useState(settings?.quiet_hours_end || '08:00');

  const handlePhoneVerification = async () => {
    if (!phoneNumber.trim()) return;
    
    setIsVerifying(true);
    try {
      await verifyWhatsAppNumber(phoneNumber);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReminderTimeChange = (index: number, value: string) => {
    if (!settings?.default_reminder_times) return;
    
    const newTimes = [...settings.default_reminder_times];
    newTimes[index] = parseInt(value) || 0;
    updateReminderTimes(newTimes);
  };

  const addReminderTime = () => {
    const currentTimes = settings?.default_reminder_times || [];
    updateReminderTimes([...currentTimes, 60]);
  };

  const removeReminderTime = (index: number) => {
    if (!settings?.default_reminder_times) return;
    
    const newTimes = settings.default_reminder_times.filter((_, i) => i !== index);
    updateReminderTimes(newTimes);
  };

  const handleQuietHoursUpdate = () => {
    updateQuietHours(quietStart, quietEnd);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Configurações WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* WhatsApp Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Conexão WhatsApp
          </CardTitle>
          <CardDescription>
            Configure seu número WhatsApp para receber lembretes de compromissos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-number">Número WhatsApp</Label>
            <div className="flex gap-2">
              <Input
                id="whatsapp-number"
                placeholder="+55 11 99999-9999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Button 
                onClick={handlePhoneVerification}
                disabled={!phoneNumber.trim() || isVerifying}
                variant="outline"
              >
                {isVerifying ? 'Verificando...' : 'Verificar'}
              </Button>
            </div>
          </div>

          {settings?.whatsapp_number && (
            <div className="flex items-center gap-2">
              <Badge variant={settings.whatsapp_verified ? 'default' : 'secondary'}>
                {settings.whatsapp_verified ? (
                  <>
                    <Shield className="h-3 w-3 mr-1" />
                    Verificado
                  </>
                ) : (
                  'Não verificado'
                )}
              </Badge>
              {settings.whatsapp_verified && (
                <span className="text-sm text-muted-foreground">
                  {settings.whatsapp_number}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lembretes
          </CardTitle>
          <CardDescription>
            Configure quando receber lembretes de seus compromissos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Lembretes</Label>
              <div className="text-sm text-muted-foreground">
                Receber notificações via WhatsApp
              </div>
            </div>
            <Switch
              checked={settings?.enable_reminders ?? false}
              onCheckedChange={toggleReminders}
            />
          </div>

          {settings?.enable_reminders && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <Label>Tempos de Lembrete (minutos antes)</Label>
                
                {settings.default_reminder_times?.map((minutes, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={minutes}
                      onChange={(e) => handleReminderTimeChange(index, e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">
                      {minutes === 1 ? 'minuto' : 'minutos'} antes
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeReminderTime(index)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={addReminderTime}
                >
                  Adicionar Lembrete
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Horários Silenciosos
          </CardTitle>
          <CardDescription>
            Defina um período em que não deseja receber lembretes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quiet-start">Início</Label>
              <Input
                id="quiet-start"
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet-end">Fim</Label>
              <Input
                id="quiet-end"
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
              />
            </div>
          </div>
          
          <Button onClick={handleQuietHoursUpdate} variant="outline" size="sm">
            Atualizar Horários
          </Button>
          
          {settings?.quiet_hours_start && settings?.quiet_hours_end && (
            <div className="text-sm text-muted-foreground">
              Horário silencioso: {settings.quiet_hours_start} às {settings.quiet_hours_end}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppSettings;