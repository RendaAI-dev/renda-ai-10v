import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from "date-fns-tz";

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