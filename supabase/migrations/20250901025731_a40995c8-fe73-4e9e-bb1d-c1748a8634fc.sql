-- Create appointments table for personal appointments/meetings
CREATE TABLE public.poupeja_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  location TEXT,
  recurrence TEXT, -- 'once', 'daily', 'weekly', 'monthly', 'yearly'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_times INTEGER[], -- Array of minutes before appointment (e.g., [15, 60, 1440])
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.poupeja_appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for appointments
CREATE POLICY "Users can view their own appointments" 
ON public.poupeja_appointments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments" 
ON public.poupeja_appointments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" 
ON public.poupeja_appointments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments" 
ON public.poupeja_appointments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.poupeja_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_appointments_user_date ON public.poupeja_appointments(user_id, appointment_date);
CREATE INDEX idx_appointments_status ON public.poupeja_appointments(status);
CREATE INDEX idx_appointments_category ON public.poupeja_appointments(category);