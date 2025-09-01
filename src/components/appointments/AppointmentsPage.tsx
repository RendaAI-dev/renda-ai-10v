import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, MapPin, Bell, BellOff, Filter, Search, Settings, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO, isPast, isToday, isTomorrow, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { appointmentsService, type Appointment } from '@/services/appointmentsService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import WhatsAppSettings from '@/components/whatsapp/WhatsAppSettings';
import { cn } from '@/lib/utils';

export default function AppointmentsPage() {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    notificationsSent: 0
  });

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadAppointments();
      loadStats();
    }
  }, [user]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, selectedCategory, selectedStatus]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentsService.getAppointments(user!.id);
      setAppointments((data || []) as Appointment[]);
    } catch (error) {
      console.error('Erro ao carregar compromissos:', error);
      toast.error('Erro ao carregar compromissos');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await appointmentsService.getAppointmentStats(user!.id);
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filtro por status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(app => app.status === selectedStatus);
    }

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(app => app.category === selectedCategory);
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleComplete = async (id: string) => {
    try {
      await appointmentsService.completeAppointment(id);
      toast.success('Compromisso marcado como concluído');
      loadAppointments();
      loadStats();
    } catch (error) {
      toast.error('Erro ao atualizar compromisso');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await appointmentsService.cancelAppointment(id);
      toast.success('Compromisso cancelado');
      loadAppointments();
      loadStats();
    } catch (error) {
      toast.error('Erro ao cancelar compromisso');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este compromisso?')) return;
    
    try {
      await appointmentsService.deleteAppointment(id);
      toast.success('Compromisso excluído');
      loadAppointments();
      loadStats();
    } catch (error) {
      toast.error('Erro ao excluir compromisso');
    }
  };

  const getAppointmentBadge = (appointment: Appointment) => {
    const date = parseISO(appointment.appointment_date);
    
    if (isPast(date) && appointment.status === 'pending') {
      return <Badge variant="destructive">Atrasado</Badge>;
    }
    if (isToday(date)) {
      return <Badge variant="default">Hoje</Badge>;
    }
    if (isTomorrow(date)) {
      return <Badge variant="secondary">Amanhã</Badge>;
    }
    if (appointment.status === 'completed') {
      return <Badge variant="outline" className="border-green-500 text-green-600">Concluído</Badge>;
    }
    if (appointment.status === 'cancelled') {
      return <Badge variant="outline" className="border-red-500 text-red-600">Cancelado</Badge>;
    }
    return null;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      work: 'bg-blue-100 text-blue-800',
      personal: 'bg-green-100 text-green-800',
      health: 'bg-red-100 text-red-800',
      finance: 'bg-yellow-100 text-yellow-800',
      general: 'bg-gray-100 text-gray-800',
      meeting: 'bg-blue-100 text-blue-800',
      medical: 'bg-red-100 text-red-800',
      social: 'bg-green-100 text-green-800',
      education: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.general;
  };

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'meeting', label: 'Reunião' },
    { value: 'medical', label: 'Consulta Médica' },
    { value: 'personal', label: 'Pessoal' },
    { value: 'work', label: 'Trabalho' },
    { value: 'social', label: 'Social' },
    { value: 'education', label: 'Educação' },
    { value: 'other', label: 'Outros' }
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendentes</CardDescription>
            <CardTitle className="text-2xl text-orange-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Concluídos</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lembretes Enviados</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.notificationsSent}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Barra de Ações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Meus Compromissos</CardTitle>
              <CardDescription>Gerencie sua agenda e receba lembretes via WhatsApp</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button onClick={() => {
                setEditingAppointment(null);
                setShowForm(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Compromisso
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar compromissos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="completed">Concluídos</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
          </div>

          {/* Lista de Compromissos */}
          <ScrollArea className="h-[500px]">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nenhum compromisso encontrado</p>
                <Button 
                  variant="link" 
                  onClick={() => setShowForm(true)}
                  className="mt-2"
                >
                  Criar primeiro compromisso
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{appointment.title}</h3>
                            {getAppointmentBadge(appointment)}
                            <Badge className={cn("text-xs", getCategoryColor(appointment.category))}>
                              {appointment.category}
                            </Badge>
                            {appointment.reminder_enabled ? (
                              <Bell className="h-4 w-4 text-green-500" />
                            ) : (
                              <BellOff className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          
                          {appointment.description && (
                            <p className="text-sm text-gray-600 mb-2">{appointment.description}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(appointment.appointment_date), "dd 'de' MMMM", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(appointment.appointment_date), 'HH:mm')}
                            </div>
                            {appointment.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {appointment.location}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1 ml-4">
                          {appointment.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleComplete(appointment.id!)}
                                title="Marcar como concluído"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingAppointment(appointment);
                                  setShowForm(true);
                                }}
                                title="Editar"
                              >
                                ✏️
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(appointment.id!)}
                            title="Excluir"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      {showForm && (
        <AppointmentForm
          appointment={editingAppointment || undefined}
          onSubmit={async (appointmentData) => {
            try {
              if (editingAppointment) {
                await appointmentsService.updateAppointment(editingAppointment.id!, appointmentData);
                toast.success('Compromisso atualizado com sucesso!');
              } else {
                await appointmentsService.createAppointment(appointmentData);
                toast.success('Compromisso criado com sucesso!');
              }
              setShowForm(false);
              setEditingAppointment(null);
              loadAppointments();
              loadStats();
            } catch (error) {
              toast.error('Erro ao salvar compromisso');
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingAppointment(null);
          }}
        />
      )}

      {/* Modal de Configurações */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Configurações WhatsApp</CardTitle>
              <CardDescription>Configure suas preferências de notificação</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Em breve você poderá configurar seu número do WhatsApp e preferências de lembretes aqui.
              </p>
              <Button onClick={() => setShowSettings(false)} className="w-full">
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}