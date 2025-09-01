import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Bell } from "lucide-react";
import { Appointment } from "@/services/appointmentService";
import { format } from "date-fns";

interface AppointmentFormProps {
  appointment?: Appointment;
  onSubmit: (appointment: Omit<Appointment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const appointmentCategories = [
  { value: 'meeting', label: '🤝 Reunião', color: '#3B82F6' },
  { value: 'medical', label: '🏥 Consulta Médica', color: '#EF4444' },
  { value: 'personal', label: '👤 Pessoal', color: '#8B5CF6' },
  { value: 'work', label: '💼 Trabalho', color: '#F59E0B' },
  { value: 'social', label: '🎉 Social', color: '#10B981' },
  { value: 'education', label: '📚 Educação', color: '#6366F1' },
  { value: 'other', label: '📝 Outros', color: '#6B7280' }
];

const reminderOptions = [
  { value: 15, label: '15 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 1440, label: '1 dia antes' },
  { value: 10080, label: '1 semana antes' }
];

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  onSubmit,
  onCancel
}) => {
  const [selectedReminderTimes, setSelectedReminderTimes] = useState<number[]>(
    appointment?.reminderTimes || []
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    appointment?.reminderEnabled || false
  );

  // Helper function to convert UTC to Brazil time for display
  const convertUTCToBrazilTime = (utcDate: string) => {
    const date = new Date(utcDate);
    // Brazil is UTC-3, so we subtract 3 hours from UTC for display
    const brazilTime = new Date(date.getTime() - 3 * 60 * 60 * 1000);
    return format(brazilTime, "yyyy-MM-dd'T'HH:mm");
  };

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      title: appointment?.title || "",
      description: appointment?.description || "",
      appointmentDate: appointment?.appointmentDate 
        ? convertUTCToBrazilTime(appointment.appointmentDate)
        : "",
      category: appointment?.category || "meeting",
      location: appointment?.location || "",
      recurrence: appointment?.recurrence || "once",
      status: appointment?.status || "pending"
    }
  });

  const handleReminderTimeChange = (reminderTime: number, checked: boolean) => {
    setSelectedReminderTimes(prev => {
      if (checked) {
        return [...prev, reminderTime];
      } else {
        return prev.filter(time => time !== reminderTime);
      }
    });
  };

  const handleFormSubmit = (data: any) => {
    // datetime-local input already provides local time, no need for manual conversion
    const localDateTime = new Date(data.appointmentDate);
    // toISOString() automatically converts to UTC
    const utcDateTime = localDateTime;
    
    const appointmentData: Omit<Appointment, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      title: data.title,
      description: data.description,
      appointmentDate: utcDateTime.toISOString(),
      category: data.category,
      location: data.location,
      recurrence: data.recurrence as 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly',
      status: data.status as 'pending' | 'completed' | 'cancelled',
      reminderEnabled,
      reminderTimes: reminderEnabled ? selectedReminderTimes : [],
      reminderSent: false
    };

    onSubmit(appointmentData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {appointment ? 'Editar Compromisso' : 'Novo Compromisso'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register("title", { required: "Título é obrigatório" })}
              placeholder="Ex: Reunião com cliente"
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Detalhes adicionais sobre o compromisso..."
              rows={3}
            />
          </div>

          {/* Date and Time */}
          <div>
            <Label htmlFor="appointmentDate" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Data e Hora *
            </Label>
            <Input
              id="appointmentDate"
              type="datetime-local"
              {...register("appointmentDate", { required: "Data e hora são obrigatórias" })}
            />
            {errors.appointmentDate && (
              <p className="text-sm text-destructive mt-1">{errors.appointmentDate.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <Label>Categoria</Label>
            <Select 
              value={watch("category")} 
              onValueChange={(value) => setValue("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {appointmentCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Local
            </Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="Ex: Escritório, Sala 201"
            />
          </div>

          {/* Recurrence */}
          <div>
            <Label>Recorrência</Label>
            <Select 
              value={watch("recurrence")} 
              onValueChange={(value) => setValue("recurrence", value as 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Apenas uma vez</SelectItem>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
                <SelectItem value="monthly">Mensalmente</SelectItem>
                <SelectItem value="yearly">Anualmente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reminder Settings */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Lembrete
              </Label>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>

            {reminderEnabled && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Quando você deseja ser lembrado?
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {reminderOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`reminder-${option.value}`}
                        checked={selectedReminderTimes.includes(option.value)}
                        onCheckedChange={(checked) =>
                          handleReminderTimeChange(option.value, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`reminder-${option.value}`}
                        className="text-sm font-normal"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {appointment ? 'Atualizar' : 'Criar'} Compromisso
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};