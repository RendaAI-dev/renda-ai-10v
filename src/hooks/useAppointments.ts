import { useState, useEffect } from "react";
import { appointmentService, Appointment } from "@/services/appointmentService";
import { useToast } from "@/hooks/use-toast";

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAppointments();
      setAppointments(data);
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

  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newAppointment = await appointmentService.addAppointment(appointment);
      setAppointments(prev => [...prev, newAppointment]);
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
      const updatedAppointment = await appointmentService.updateAppointment(appointment);
      setAppointments(prev => prev.map(t => t.id === appointment.id ? updatedAppointment : t));
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
      await appointmentService.deleteAppointment(id);
      setAppointments(prev => prev.filter(t => t.id !== id));
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
      await appointmentService.markAsCompleted(id);
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
      const appointmentDate = new Date(appointment.appointmentDate);
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