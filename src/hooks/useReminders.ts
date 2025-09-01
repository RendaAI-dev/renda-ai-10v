import { useRef, useEffect } from 'react';
import { ScheduledTransaction } from '@/types';
import { Appointment } from '@/services/appointmentService';
import { notificationService } from '@/services/notificationService';
import { supabase } from '@/integrations/supabase/client';

interface ReminderEntry {
  transactionId: string;
  scheduledTime: Date;
  timeoutId: NodeJS.Timeout;
}

export const useReminders = (
  scheduledTransactions: ScheduledTransaction[] = [], 
  appointments: Appointment[] = []
) => {
  const activeReminders = useRef<Map<string, ReminderEntry>>(new Map());

  // Clear existing reminders and schedule new ones when data changes
  useEffect(() => {
    // Clear existing reminders
    activeReminders.current.forEach(({ timeoutId }) => {
      clearTimeout(timeoutId);
    });
    activeReminders.current.clear();

    // Schedule reminders for transactions
    scheduledTransactions.forEach(transaction => {
      if (transaction.reminderEnabled && !transaction.reminderSent) {
        scheduleTransactionReminder(transaction);
      }
    });

    // Schedule reminders for appointments
    appointments.forEach(appointment => {
      if (appointment.reminderEnabled && !appointment.reminderSent && appointment.reminderTimes) {
        appointment.reminderTimes.forEach(reminderTime => {
          scheduleAppointmentReminder(appointment, reminderTime);
        });
      }
    });

    // Cleanup on unmount
    return () => {
      activeReminders.current.forEach(({ timeoutId }) => {
        clearTimeout(timeoutId);
      });
      activeReminders.current.clear();
    };
  }, [scheduledTransactions, appointments]);

  const scheduleTransactionReminder = (transaction: ScheduledTransaction) => {
    if (!transaction.reminderTime) return;

    const scheduledDate = new Date(transaction.scheduledDate);
    const reminderDate = new Date(scheduledDate.getTime() - transaction.reminderTime * 60 * 1000);
    const now = new Date();
    const timeUntilReminder = reminderDate.getTime() - now.getTime();

    // Only schedule if the reminder time is in the future
    if (timeUntilReminder > 0) {
      const timeoutId = setTimeout(() => {
        showTransactionReminderNotification(transaction);
        markReminderAsSent(transaction.id);
      }, timeUntilReminder);

      activeReminders.current.set(`transaction-${transaction.id}`, {
        transactionId: transaction.id,
        scheduledTime: reminderDate,
        timeoutId
      });
    }
  };

  const scheduleAppointmentReminder = (appointment: Appointment, reminderTime: number) => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const reminderDate = new Date(appointmentDate.getTime() - reminderTime * 60 * 1000);
    const now = new Date();
    const timeUntilReminder = reminderDate.getTime() - now.getTime();

    // Only schedule if the reminder time is in the future
    if (timeUntilReminder > 0) {
      const timeoutId = setTimeout(() => {
        showAppointmentReminderNotification(appointment, reminderTime);
      }, timeUntilReminder);

      activeReminders.current.set(`appointment-${appointment.id}-${reminderTime}`, {
        transactionId: appointment.id,
        scheduledTime: reminderDate,
        timeoutId
      });
    }
  };

  const showTransactionReminderNotification = async (transaction: ScheduledTransaction) => {
    // Get user data for WhatsApp notification
    const { data: { user } } = await supabase.auth.getUser();
    let userPhone = '';
    let userName = '';

    if (user) {
      const { data: userData } = await supabase
        .from('poupeja_users')
        .select('phone, name')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        userPhone = userData.phone || '';
        userName = userData.name || user.email?.split('@')[0] || '';
      }
    }

    await notificationService.showTransactionReminderNotification(
      transaction.type,
      transaction.amount,
      transaction.description || `${transaction.category} - ${transaction.type === 'income' ? 'Receita' : 'Despesa'}`,
      0, // Show now
      userPhone,
      userName
    );
  };

  const showAppointmentReminderNotification = async (appointment: Appointment, minutesUntil: number) => {
    // Get user data for WhatsApp notification
    const { data: { user } } = await supabase.auth.getUser();
    let userPhone = '';
    let userName = '';

    if (user) {
      const { data: userData } = await supabase
        .from('poupeja_users')
        .select('phone, name')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        userPhone = userData.phone || '';
        userName = userData.name || user.email?.split('@')[0] || '';
      }
    }

    await notificationService.showAppointmentReminderNotification(
      appointment, 
      minutesUntil, 
      userPhone, 
      userName
    );
  };

  const markReminderAsSent = (transactionId: string) => {
    // This would typically update the database
    // For now, just remove from active reminders
    const reminder = activeReminders.current.get(`transaction-${transactionId}`);
    if (reminder) {
      clearTimeout(reminder.timeoutId);
      activeReminders.current.delete(`transaction-${transactionId}`);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    return await notificationService.requestPermission();
  };

  const isNotificationSupported = (): boolean => {
    return 'Notification' in window;
  };

  const isPermissionGranted = (): boolean => {
    return notificationService.isPermissionGranted();
  };

  return {
    requestNotificationPermission,
    isNotificationSupported,
    isPermissionGranted,
    scheduleTransactionReminder,
    scheduleAppointmentReminder,
  };
};