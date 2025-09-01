import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Bell, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { appointmentsService, type Appointment } from '@/services/appointmentsService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const appointmentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  appointment_date: z.string().min(1, 'Data é obrigatória'),
  appointment_time: z.string().min(1, 'Horário é obrigatório'),
  location: z.string().optional(),
  category: z.string(),
  recurrence: z.enum(['once', 'daily', 'weekly', 'monthly', 'yearly']),
  reminder_enabled: z.boolean(),
  reminder_times: z.array(z.number()).optional()
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  appointment?: Appointment;
  onSubmit: (appointment: Omit<Appointment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ appointment, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState<number[]>([30, 1440]);
  
  const isEditing = !!appointment;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: appointment?.title || '',
      description: appointment?.description || '',
      appointment_date: appointment ? format(new Date(appointment.appointment_date), 'yyyy-MM-dd') : '',
      appointment_time: appointment ? format(new Date(appointment.appointment_date), 'HH:mm') : '',
      location: appointment?.location || '',
      category: appointment?.category || 'general',
      recurrence: appointment?.recurrence || 'once',
      reminder_enabled: appointment?.reminder_enabled ?? true,
      reminder_times: appointment?.reminder_times || [30, 1440]
    }
  });

  const reminderEnabled = watch('reminder_enabled');

  useEffect(() => {
    if (appointment?.reminder_times) {
      setSelectedReminders(appointment.reminder_times);
    }
  }, [appointment]);

  const toggleReminder = (minutes: number) => {
    setSelectedReminders(prev => {
      if (prev.includes(minutes)) {
        return prev.filter(m => m !== minutes);
      }
      return [...prev, minutes].sort((a, b) => a - b);
    });
  };

  const handleFormSubmit = async (data: AppointmentFormData) => {
    try {
      setLoading(true);
      
      // Combinar data e hora
      const dateTime = new Date(`${data.appointment_date}T${data.appointment_time}`);
      
      const appointmentData: Omit<Appointment, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        title: data.title,
        description: data.description,
        appointment_date: dateTime.toISOString(),
        location: data.location,
        category: data.category,
        recurrence: data.recurrence,
        status: 'pending',
        reminder_enabled: data.reminder_enabled,
        reminder_times: reminderEnabled ? selectedReminders : [],
        reminder_sent: false
      };

      onSubmit(appointmentData);
    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      toast.error('Erro ao processar dados do formulário');
    } finally {
      setLoading(false);
    }
  };

  const reminderOptions = [
    { value: 15, label: '15 minutos antes' },
    { value: 30, label: '30 minutos antes' },
    { value: 60, label: '1 hora antes' },
    { value: 120, label: '2 horas antes' },
    { value: 1440, label: '1 dia antes' },
    { value: 2880, label: '2 dias antes' }
  ];

  const categories = [
    { value: 'general', label: 'Geral', icon: '📌' },
    { value: 'meeting', label: 'Reunião', icon: '🤝' },
    { value: 'medical', label: 'Consulta Médica', icon: '🏥' },
    { value: 'personal', label: 'Pessoal', icon: '👤' },
    { value: 'work', label: 'Trabalho', icon: '💼' },
    { value: 'social', label: 'Social', icon: '🎉' },
    { value: 'education', label: 'Educação', icon: '📚' },
    { value: 'other', label: 'Outros', icon: '📝' }
  ];

  const recurrenceOptions = [
    { value: 'once', label: 'Única vez' },
    { value: 'daily', label: 'Diariamente' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'monthly', label: 'Mensalmente' },
    { value: 'yearly', label: 'Anualmente' }
  ];

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Compromisso' : 'Novo Compromisso'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edite os detalhes do seu compromisso' : 'Preencha os detalhes do seu novo compromisso'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Ex: Reunião com cliente"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Detalhes do compromisso..."
              rows={3}
            />
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_date">
                <Calendar className="inline h-4 w-4 mr-1" />
                Data *
              </Label>
              <Input
                id="appointment_date"
                type="date"
                {...register('appointment_date')}
                className={errors.appointment_date ? 'border-red-500' : ''}
              />
              {errors.appointment_date && (
                <p className="text-sm text-red-500">{errors.appointment_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment_time">
                <Clock className="inline h-4 w-4 mr-1" />
                Horário *
              </Label>
              <Input
                id="appointment_time"
                type="time"
                {...register('appointment_time')}
                className={errors.appointment_time ? 'border-red-500' : ''}
              />
              {errors.appointment_time && (
                <p className="text-sm text-red-500">{errors.appointment_time.message}</p>
              )}
            </div>
          </div>

          {/* Local */}
          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="inline h-4 w-4 mr-1" />
              Local
            </Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Ex: Sala de reuniões, Hospital, etc."
            />
          </div>

          {/* Categoria e Recorrência */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                <RefreshCw className="inline h-4 w-4 mr-1" />
                Recorrência
              </Label>
              <Select
                value={watch('recurrence')}
                onValueChange={(value: any) => setValue('recurrence', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recurrenceOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lembretes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <CardTitle className="text-base">Lembretes via WhatsApp</CardTitle>
                </div>
                <Switch
                  checked={reminderEnabled}
                  onCheckedChange={(checked) => setValue('reminder_enabled', checked)}
                />
              </div>
              <CardDescription className="text-xs">
                Receba lembretes automáticos no WhatsApp
              </CardDescription>
            </CardHeader>
            {reminderEnabled && (
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {reminderOptions.map(option => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedReminders.includes(option.value)}
                        onChange={() => toggleReminder(option.value)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};