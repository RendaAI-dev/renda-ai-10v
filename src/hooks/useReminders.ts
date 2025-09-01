import { useEffect, useRef } from 'react';
import { ScheduledTransaction } from '@/types';
import { notificationService } from '@/services/notificationService';

interface ReminderEntry {
  transactionId: string;
  scheduledFor: Date;
  timeoutId: NodeJS.Timeout;
}

export function useReminders(scheduledTransactions: ScheduledTransaction[]) {
  const activeReminders = useRef<Map<string, ReminderEntry>>(new Map());

  useEffect(() => {
    // Clear existing reminders
    activeReminders.current.forEach(({ timeoutId }) => {
      clearTimeout(timeoutId);
    });
    activeReminders.current.clear();

    // Set up new reminders
    scheduledTransactions
      .filter(transaction => 
        transaction.reminderEnabled && 
        transaction.reminderTime && 
        transaction.status === 'pending' &&
        !transaction.reminderSent
      )
      .forEach(transaction => {
        scheduleReminder(transaction);
      });

    return () => {
      // Cleanup on unmount
      activeReminders.current.forEach(({ timeoutId }) => {
        clearTimeout(timeoutId);
      });
      activeReminders.current.clear();
    };
  }, [scheduledTransactions]);

  const scheduleReminder = (transaction: ScheduledTransaction) => {
    if (!transaction.reminderTime || !transaction.scheduledDate) return;

    const scheduledDate = new Date(transaction.scheduledDate);
    const reminderDate = new Date(scheduledDate.getTime() - (transaction.reminderTime * 60 * 1000));
    const now = new Date();
    
    const msUntilReminder = reminderDate.getTime() - now.getTime();
    
    // Only schedule if reminder is in the future
    if (msUntilReminder > 0) {
      const timeoutId = setTimeout(async () => {
        await showReminderNotification(transaction);
        // Mark reminder as sent
        markReminderAsSent(transaction.id);
      }, msUntilReminder);

      activeReminders.current.set(transaction.id, {
        transactionId: transaction.id,
        scheduledFor: reminderDate,
        timeoutId,
      });

      console.log(`Reminder scheduled for transaction ${transaction.id} at ${reminderDate.toISOString()}`);
    } else if (msUntilReminder > -60000) { // Less than 1 minute ago
      // Show immediately if it's very recent
      showReminderNotification(transaction);
      markReminderAsSent(transaction.id);
    }
  };

  const showReminderNotification = async (transaction: ScheduledTransaction) => {
    if (!transaction.reminderTime) return;

    const scheduledDate = new Date(transaction.scheduledDate);
    const now = new Date();
    const minutesUntil = Math.round((scheduledDate.getTime() - now.getTime()) / (1000 * 60));

    try {
      await notificationService.showReminderNotification(
        transaction.type,
        transaction.amount,
        transaction.description || 'Transação agendada',
        minutesUntil
      );
    } catch (error) {
      console.error('Error showing reminder notification:', error);
    }
  };

  const markReminderAsSent = (transactionId: string) => {
    // This would typically update the database
    // For now, just remove from active reminders
    const reminder = activeReminders.current.get(transactionId);
    if (reminder) {
      clearTimeout(reminder.timeoutId);
      activeReminders.current.delete(transactionId);
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
    scheduleReminder,
  };
}