import { useState, useEffect } from "react";
import { appointmentsService, type Appointment } from "@/services/appointmentsService";
import { useToast } from "@/hooks/use-toast";
import { useWhatsAppNotifications } from "@/hooks/useWhatsAppNotifications";
import { supabase } from "@/integrations/supabase/client";

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { 
    scheduleAppointmentReminders,
    sendAppointmentConfirmation,
    sendAppointmentCancellation
  } = useWhatsAppNotifications();

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');
      
      const data = await appointmentsService.getAppointments(userData.user.id);
      setAppointments((data || []) as Appointment[]);
    } catch (error) {
      toast({
        title: "Erro ao carregar compromissos",
        description: "Não foi possível carregar seus compromissos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const newAppointment = await appointmentsService.createAppointment(appointment);
      setAppointments(prev => [...prev, newAppointment as Appointment]);
      
      // Schedule WhatsApp reminders for the new appointment
      if (newAppointment.id) {
        await scheduleAppointmentReminders({
          id: newAppointment.id,
          appointment_date: newAppointment.appointment_date,
          title: newAppointment.title,
          description: newAppointment.description,
          location: newAppointment.location,
          user_id: newAppointment.user_id || ""
        });
        
        // Send confirmation message
        await sendAppointmentConfirmation({
          id: newAppointment.id,
          appointment_date: newAppointment.appointment_date,
          title: newAppointment.title,
          description: newAppointment.description,
          location: newAppointment.location,
          user_id: newAppointment.user_id || ""
        });
      }
      
      toast({
        title: "Compromisso criado",
        description: "Seu compromisso foi criado com sucesso.",
      });
      return newAppointment;
    } catch (error) {
      toast({
        title: "Erro ao criar compromisso",
        description: "Não foi possível criar o compromisso.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateAppointment = async (appointment: Appointment) => {
    try {
      if (!appointment.id) throw new Error('ID do compromisso não encontrado');
      
      const updatedAppointment = await appointmentsService.updateAppointment(appointment.id, appointment);
      setAppointments(prev => prev.map(t => t.id === appointment.id ? updatedAppointment as Appointment : t));
      toast({
        title: "Compromisso atualizado",
        description: "Seu compromisso foi atualizado com sucesso.",
      });
      return updatedAppointment;
    } catch (error) {
      toast({
        title: "Erro ao atualizar compromisso",
        description: "Não foi possível atualizar o compromisso.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      // Get appointment details before deletion for cancellation message
      const appointmentToDelete = appointments.find(apt => apt.id === id);
      
      await appointmentsService.deleteAppointment(id);
      setAppointments(prev => prev.filter(t => t.id !== id));
      
      // Send cancellation message if appointment found
      if (appointmentToDelete) {
        await sendAppointmentCancellation({
          id: appointmentToDelete.id!,
          appointment_date: appointmentToDelete.appointment_date,
          title: appointmentToDelete.title,
          description: appointmentToDelete.description,
          location: appointmentToDelete.location,
          user_id: appointmentToDelete.user_id || ""
        });
      }
      
      toast({
        title: "Compromisso removido",
        description: "Seu compromisso foi removido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao remover compromisso",
        description: "Não foi possível remover o compromisso.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const markAsCompleted = async (id: string) => {
    try {
      await appointmentsService.completeAppointment(id);
      setAppointments(prev => prev.map(t => 
        t.id === id ? { ...t, status: 'completed' as const } : t
      ));
      toast({
        title: "Compromisso concluído",
        description: "Compromisso marcado como concluído.",
      });
    } catch (error) {
      toast({
        title: "Erro ao marcar como concluído",
        description: "Não foi possível marcar o compromisso como concluído.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const filterByCategory = (category?: string) => {
    if (!category) return appointments;
    return appointments.filter(appointment => appointment.category === category);
  };

  const filterByStatus = (status?: string) => {
    if (!status) return appointments;
    return appointments.filter(appointment => appointment.status === status);
  };

  const getUpcomingAppointments = (days: number = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_date);
      return appointmentDate >= now && appointmentDate <= futureDate && appointment.status === 'pending';
    });
  };

  return {
    appointments,
    loading,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    markAsCompleted,
    refreshAppointments: fetchAppointments,
    filterByCategory,
    filterByStatus,
    getUpcomingAppointments,
  };
};