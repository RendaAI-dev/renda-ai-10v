-- Add reminder fields to scheduled transactions table
ALTER TABLE public.poupeja_scheduled_transactions 
ADD COLUMN reminder_enabled BOOLEAN DEFAULT false,
ADD COLUMN reminder_time INTEGER, -- Minutes before the scheduled date
ADD COLUMN reminder_sent BOOLEAN DEFAULT false;