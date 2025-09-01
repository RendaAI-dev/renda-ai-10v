import { supabase } from "@/integrations/supabase/client";
import { n8nIntegrationService } from "./n8nIntegrationService";
import { getCurrentUser } from "./userService";

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  appointmentDate: string; // ISO date string
  category: string;
  location?: string;
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'pending' | 'completed' | 'cancelled';
  reminderEnabled?: boolean;
  reminderTimes?: number[]; // Minutes before appointment
  reminderSent?: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const appointmentService = {
  async getAppointments(): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from("poupeja_appointments")
        .select("*")
        .order("appointment_date", { ascending: true });

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        appointmentDate: item.appointment_date,
        category: item.category,
        location: item.location,
        recurrence: item.recurrence as 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly',
        status: item.status as 'pending' | 'completed' | 'cancelled',
        reminderEnabled: item.reminder_enabled || false,
        reminderTimes: item.reminder_times || [],
        reminderSent: item.reminder_sent || false,
        userId: item.user_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    } catch (error) {
      console.error("Error fetching appointments:", error);
      throw error;
    }
  },

  async addAppointment(appointment: Omit<Appointment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("poupeja_appointments")
        .insert({
          user_id: userData.user.id,
          title: appointment.title,
          description: appointment.description,
          appointment_date: appointment.appointmentDate,
          category: appointment.category,
          location: appointment.location,
          recurrence: appointment.recurrence,
          status: appointment.status || 'pending',
          reminder_enabled: appointment.reminderEnabled || false,
          reminder_times: appointment.reminderTimes || [],
          reminder_sent: false
        })
        .select()
        .single();

      if (error) throw error;

      const newAppointment = {
        id: data.id,
        title: data.title,
        description: data.description,
        appointmentDate: data.appointment_date,
        category: data.category,
        location: data.location,
        recurrence: data.recurrence as 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly',
        status: data.status as 'pending' | 'completed' | 'cancelled',
        reminderEnabled: data.reminder_enabled || false,
        reminderTimes: data.reminder_times || [],
        reminderSent: data.reminder_sent || false,
        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      // Trigger N8N integration asynchronously (don't block appointment creation)
      try {
        console.log('=== N8N DEBUG: Starting appointment creation automation ===');
        const currentUser = await getCurrentUser();
        console.log('=== N8N DEBUG: Current user:', currentUser);
        
        if (currentUser && currentUser.phone) {
          console.log('=== N8N DEBUG: User has phone, triggering N8N automation for appointment:', newAppointment.id);
          const n8nResult = await n8nIntegrationService.onAppointmentCreated({
            id: data.id,
            title: data.title,
            description: data.description,
            appointment_date: data.appointment_date,
            category: data.category,
            status: data.status,
            reminder_enabled: data.reminder_enabled,
            reminder_times: data.reminder_times
          }, currentUser);
          console.log('=== N8N DEBUG: N8N automation result:', n8nResult);
        } else {
          console.warn('=== N8N DEBUG: N8N automation skipped - user not found or missing phone number');
          console.warn('=== N8N DEBUG: User data:', { 
            hasUser: !!currentUser, 
            hasPhone: currentUser?.phone ? 'YES' : 'NO',
            phone: currentUser?.phone 
          });
        }
      } catch (n8nError) {
        // Log error but don't throw - N8N failures shouldn't break appointment creation
        console.error('=== N8N DEBUG: N8N automation failed for appointment creation:', n8nError);
      }

      return newAppointment;
    } catch (error) {
      console.error("Error adding appointment:", error);
      throw error;
    }
  },

  async updateAppointment(appointment: Appointment): Promise<Appointment> {
    try {
      const { data, error } = await supabase
        .from("poupeja_appointments")
        .update({
          title: appointment.title,
          description: appointment.description,
          appointment_date: appointment.appointmentDate,
          category: appointment.category,
          location: appointment.location,
          recurrence: appointment.recurrence,
          status: appointment.status,
          reminder_enabled: appointment.reminderEnabled,
          reminder_times: appointment.reminderTimes,
          reminder_sent: appointment.reminderSent,
          updated_at: new Date().toISOString()
        })
        .eq("id", appointment.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        appointmentDate: data.appointment_date,
        category: data.category,
        location: data.location,
        recurrence: data.recurrence as 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly',
        status: data.status as 'pending' | 'completed' | 'cancelled',
        reminderEnabled: data.reminder_enabled || false,
        reminderTimes: data.reminder_times || [],
        reminderSent: data.reminder_sent || false,
        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error("Error updating appointment:", error);
      throw error;
    }
  },

  async deleteAppointment(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("poupeja_appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting appointment:", error);
      throw error;
    }
  },

  async markAsCompleted(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("poupeja_appointments")
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error marking appointment as completed:", error);
      throw error;
    }
  }
};