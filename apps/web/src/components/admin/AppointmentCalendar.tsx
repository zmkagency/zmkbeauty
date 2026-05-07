"use client";
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useMemo } from 'react';

const locales = { 'tr': tr };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function AppointmentCalendar({ appointments }: { appointments: any[] }) {
  const events = useMemo(() => {
    return appointments.map(app => {
      // Parse ISO date and time strings "14:00"
      const dateStr = app.date.split('T')[0];
      const start = new Date(`${dateStr}T${app.startTime}:00`);
      const end = new Date(`${dateStr}T${app.endTime}:00`);
      
      return {
        id: app.id,
        title: `${app.customer?.firstName} - ${app.service?.name}`,
        start,
        end,
        resource: app
      };
    });
  }, [appointments]);

  return (
    <div className="h-[600px] bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.WEEK}
        views={['week', 'day', 'agenda']}
        culture="tr"
        messages={{
          next: "İleri",
          previous: "Geri",
          today: "Bugün",
          week: "Hafta",
          day: "Gün",
          agenda: "Liste"
        }}
      />
    </div>
  );
}