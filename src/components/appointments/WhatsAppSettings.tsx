import React, { useState, useEffect } from 'react';
import { Phone, Bell, Clock, Volume2, Check, X, AlertCircle, QrCode, Smartphone } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { appointmentsService, WhatsAppSettings as WhatsAppSettingsType } from '@/services/appointmentsService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface WhatsAppSettingsProps {
  onClose: () => void;
}

export default function WhatsAppSettings({ onClose }: WhatsAppSettingsProps) {
  const { user } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [settings, setSettings] = useState<WhatsAppSettingsType>({
    whatsapp_verified: false,
    enable_reminders: true,
    default_reminder_times: [30, 1440],
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo'
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'pending'>('disconnected');

  useEffect(() => {
    loadSettings();
    checkConnectionStatus();
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await appointmentsService.getWhatsAppSettings(user!.id);
      if (data) {
        setSettings(data);
        setPhoneNumber(data.whatsapp_number || '');
        setQuietHoursStart(data.quiet_hours_start || '22:00');
        setQuietHoursEnd(data.quiet_hours_end || '08:00');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    // Aqui você pode adicionar uma chamada para verificar o status da conexão com a Evolution API
    // Por enquanto, vamos simular
    setConnectionStatus(settings.whatsapp_verified ? 'connected' : 'disconnected');
  };

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Formata como (XX) XXXXX-XXXX
    if (numbers.length <= 11) {
      const match = numbers.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);
      if (match) {
        return !match[2]
          ? match[1]
          : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`;
      }
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleVerifyPhone = async () => {
    try {
      setVerifying(true);
      
      // Remove formatação para salvar apenas números
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      
      // Adiciona código do país se não tiver
      const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
      
      await appointmentsService.verifyWhatsAppNumber(fullNumber);
      
      setSettings(prev => ({
        ...prev,
        whatsapp_number: fullNumber,
        whatsapp_verified: true
      }));
      
      setConnectionStatus('connected');
      toast.success('Número verificado com sucesso!');
      
      // Simular geração de QR Code (em produção, isso viria da Evolution API)
      setShowQRCode(true);
      setQrCodeData('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=whatsapp://send?phone=' + fullNumber);
      
    } catch (error: any) {
      toast.error(error.message || 'Erro ao verificar número');
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
      
      await appointmentsService.saveWhatsAppSettings({
        ...settings,
        whatsapp_number: fullNumber,
        quiet_hours_start: quietHoursStart,
        quiet_hours_end: quietHoursEnd
      });
      
      toast.success('Configurações salvas com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const toggleReminderTime = (minutes: number) => {
    setSettings(prev => {
      const times = prev.default_reminder_times || [];
      if (times.includes(minutes)) {
        return {
          ...prev,
          default_reminder_times: times.filter(t => t !== minutes)
        };
      }
      return {
        ...prev,
        default_reminder_times: [...times, minutes].sort((a, b) => a - b)
      };
    });
  };

  const reminderOptions = [
    { value: 15, label: '15 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 60, label: '1 hora' },
    { value: 120, label: '2 horas' },
    { value: 1440, label: '24 horas' },
    { value: 2880, label: '48 horas' }
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações do WhatsApp</DialogTitle>
          <DialogDescription>
            Configure o envio de lembretes automáticos via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="connection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connection">Conexão</TabsTrigger>
            <TabsTrigger value="reminders">Lembretes</TabsTrigger>
            <TabsTrigger value="preferences">Preferências</TabsTrigger>
          </TabsList>

          {/* Aba de Conexão */}
          <TabsContent value="connection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status da Conexão</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  {connectionStatus === 'connected' ? (
                    <Badge className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  ) : connectionStatus === 'pending' ? (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Verificando...
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <X className="h-3 w-3 mr-1" />
                      Desconectado
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Número do WhatsApp
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleVerifyPhone}
                      disabled={verifying || !phoneNumber}
                    >
                      {verifying ? 'Verificando...' : 'Verificar'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Digite seu número com DDD. O código do país (+55) será adicionado automaticamente.
                  </p>
                </div>

                {showQRCode && (
                  <Alert>
                    <QrCode className="h-4 w-4" />
                    <AlertTitle>Escaneie o QR Code</AlertTitle>
                    <AlertDescription className="mt-2">
                      <div className="flex flex-col items-center gap-4">
                        <img src={qrCodeData} alt="QR Code WhatsApp" className="border rounded" />
                        <p className="text-sm text-center">
                          Abra o WhatsApp no seu celular, vá em Configurações → Aparelhos conectados → 
                          Conectar aparelho e escaneie este código.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {settings.whatsapp_verified && (
                  <Alert className="border-green-200 bg-green-50">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Número Verificado</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Seu WhatsApp está conectado e pronto para receber lembretes.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Lembretes */}
          <TabsContent value="reminders" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Lembretes Automáticos</CardTitle>
                  <Switch
                    checked={settings.enable_reminders}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, enable_reminders: checked }))
                    }
                  />
                </div>
                <CardDescription>
                  Receba lembretes automáticos antes dos seus compromissos
                </CardDescription>
              </CardHeader>
              {settings.enable_reminders && (
                <CardContent>
                  <Label className="text-sm font-medium mb-3 block">
                    Quando deseja receber lembretes?
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {reminderOptions.map(option => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={settings.default_reminder_times?.includes(option.value) || false}
                          onChange={() => toggleReminderTime(option.value)}
                          className="rounded border-input"
                        />
                        <span className="text-sm flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {option.label} antes
                        </span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Aba de Preferências */}
          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horário Silencioso</CardTitle>
                <CardDescription>
                  Não receber notificações durante este período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiet-start">
                      <Volume2 className="inline h-4 w-4 mr-1" />
                      Início
                    </Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-end">
                      <Bell className="inline h-4 w-4 mr-1" />
                      Fim
                    </Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={quietHoursEnd}
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Lembretes agendados neste período serão enviados após o horário de fim.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Idioma e Região</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Idioma das Mensagens</Label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                    <option value="America/Manaus">Manaus (GMT-4)</option>
                    <option value="America/Recife">Recife (GMT-3)</option>
                    <option value="America/Belem">Belém (GMT-3)</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {settings.whatsapp_verified && (
              <span className="flex items-center gap-1">
                <Smartphone className="h-4 w-4" />
                Conectado: {settings.whatsapp_number}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSettings} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}