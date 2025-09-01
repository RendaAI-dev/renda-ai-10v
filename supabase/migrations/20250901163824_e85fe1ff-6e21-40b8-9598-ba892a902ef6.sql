-- Create webhook logs table for Evolution API events
CREATE TABLE public.poupeja_webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance text NOT NULL,
  event_type text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  processed boolean NOT NULL DEFAULT false,
  message text,
  payload jsonb,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.poupeja_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policies - admins can view all webhook logs
CREATE POLICY "Admins can view all webhook logs" 
ON public.poupeja_webhook_logs 
FOR SELECT 
USING (is_admin_user());

-- Service role can insert logs
CREATE POLICY "Service role can insert webhook logs" 
ON public.poupeja_webhook_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_webhook_logs_instance ON public.poupeja_webhook_logs(instance);
CREATE INDEX idx_webhook_logs_event_type ON public.poupeja_webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_created_at ON public.poupeja_webhook_logs(created_at DESC);