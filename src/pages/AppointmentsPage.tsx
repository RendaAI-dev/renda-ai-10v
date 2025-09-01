import React, { useState } from "react";
import { Plus, Calendar, Clock, MapPin, Filter, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MainLayout from "@/components/layout/MainLayout";
import SubscriptionGuard from "@/components/subscription/SubscriptionGuard";
import { useAppointments } from "@/hooks/useAppointments";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { Appointment } from "@/services/appointmentService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const appointmentCategories = [
  { value: 'meeting', label: '🤝 Reunião', color: '#3B82F6' },
  { value: 'medical', label: '🏥 Consulta Médica', color: '#EF4444' },
  { value: 'personal', label: '👤 Pessoal', color: '#8B5CF6' },
  { value: 'work', label: '💼 Trabalho', color: '#F59E0B' },
  { value: 'social', label: '🎉 Social', color: '#10B981' },
  { value: 'education', label: '📚 Educação', color: '#6366F1' },
  { value: 'other', label: '📝 Outros', color: '#6B7280' }
];

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
};

export const AppointmentsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const {
    appointments,
    loading,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    markAsCompleted,
  } = useAppointments();

  const handleSubmit = async (appointmentData: Omit<Appointment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingAppointment) {
        await updateAppointment({ ...editingAppointment, ...appointmentData });
      } else {
        await addAppointment(appointmentData);
      }
      setShowForm(false);
      setEditingAppointment(undefined);
    } catch (error) {
      console.error("Error saving appointment:", error);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este compromisso?")) {
      await deleteAppointment(id);
    }
  };

  const getCategoryLabel = (categoryValue: string) => {
    const category = appointmentCategories.find(cat => cat.value === categoryValue);
    return category?.label || '📝 Outros';
  };

  const filteredAppointments = appointments.filter(appointment => {
    const categoryMatch = categoryFilter === "all" || appointment.category === categoryFilter;
    const statusMatch = statusFilter === "all" || appointment.status === statusFilter;
    return categoryMatch && statusMatch;
  });

  const upcomingAppointments = filteredAppointments
    .filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      const now = new Date();
      return appointmentDate >= now && appointment.status === 'pending';
    })
    .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando compromissos...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout title="Compromissos">
      <SubscriptionGuard feature="agenda de compromissos">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Compromissos</h1>
              <p className="text-muted-foreground">Gerencie sua agenda pessoal</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Compromisso
              </Button>
              <Button onClick={() => window.open('/test-n8n', '_blank')} variant="outline" className="flex items-center gap-2">
                🔧 Testar N8N
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {appointmentCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upcoming Appointments Summary */}
          {upcomingAppointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Calendar className="h-5 w-5" />
                  Próximos Compromissos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {upcomingAppointments.slice(0, 3).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{appointment.title}</span>
                          <Badge variant="secondary">{getCategoryLabel(appointment.category)}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {(() => {
                              // Convert UTC to Brazil time (UTC-3) for display
                              const utcDate = new Date(appointment.appointmentDate);
                              const brazilTime = new Date(utcDate.getTime() - 3 * 60 * 60 * 1000);
                              return format(brazilTime, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
                            })()}
                          </span>
                          {appointment.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {appointment.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsCompleted(appointment.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointments List */}
          <div className="grid gap-4">
            {filteredAppointments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    {appointments.length === 0 ? 
                      "Você ainda não tem nenhum compromisso." :
                      "Nenhum compromisso encontrado com os filtros selecionados."
                    }
                  </p>
                  <Button onClick={() => setShowForm(true)}>
                    Criar seu primeiro compromisso
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{appointment.title}</h3>
                          <Badge variant="secondary">{getCategoryLabel(appointment.category)}</Badge>
                          <Badge className={statusConfig[appointment.status]?.color || 'bg-gray-100 text-gray-800'}>
                            {statusConfig[appointment.status]?.label || appointment.status}
                          </Badge>
                        </div>
                        
                        {appointment.description && (
                          <p className="text-muted-foreground mb-2">{appointment.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {(() => {
                              // Convert UTC to Brazil time (UTC-3) for display
                              const utcDate = new Date(appointment.appointmentDate);
                              const brazilTime = new Date(utcDate.getTime() - 3 * 60 * 60 * 1000);
                              return format(brazilTime, "dd/MM/yyyy 'às' HH:mm");
                            })()}
                          </span>
                          {appointment.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {appointment.location}
                            </span>
                          )}
                          {appointment.reminderEnabled && (
                            <span className="flex items-center gap-1 text-primary">
                              🔔 Lembrete ativo
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {appointment.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsCompleted(appointment.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(appointment)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(appointment.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Form Dialog */}
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAppointment ? 'Editar Compromisso' : 'Novo Compromisso'}
                </DialogTitle>
              </DialogHeader>
              <AppointmentForm
                appointment={editingAppointment}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingAppointment(undefined);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </SubscriptionGuard>
    </MainLayout>
  );
};