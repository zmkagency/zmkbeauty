import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TimeSlot {
  startTime: string; // "14:00"
  endTime: string;   // "14:45"
}

@Injectable()
export class SlotEngineService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate available time slots for a given employee, service, and date.
   * This is the HEART of the booking system.
   *
   * Rules enforced:
   * 1. Store must not be closed on this date
   * 2. Employee must not be on leave
   * 3. Employee must be working on this day of week
   * 4. Slots generated within employee's working hours (excluding breaks)
   * 5. Existing confirmed appointments are blocked
   * 6. Buffer time between appointments is respected
   * 7. Service duration determines slot length
   */
  async getAvailableSlots(
    tenantId: string,
    employeeId: string,
    serviceId: string,
    date: string, // "2026-04-15"
  ): Promise<TimeSlot[]> {
    const targetDate = new Date(date);
    const dayOfWeek = (targetDate.getDay() + 6) % 7; // Convert to Mon=0 format

    // Create safe boundaries for the day (UTC to avoid timezone offsets)
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // 1. Check store closure
    const closure = await this.prisma.storeClosure.findFirst({
      where: {
        tenantId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });
    if (closure?.isFullDay) return [];

    // 2. Check employee leave
    const leave = await this.prisma.employeeLeave.findFirst({
      where: {
        employeeId,
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
    });
    if (leave) return [];

    // 3. Get employee schedule for this day
    const schedule = await this.prisma.employeeSchedule.findUnique({
      where: { employeeId_dayOfWeek: { employeeId, dayOfWeek } },
    });
    if (!schedule || !schedule.isWorking) return [];

    // 4. Get service duration
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) return [];

    // 5. Get tenant buffer minutes
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { bufferMinutes: true },
    });
    const bufferMinutes = tenant?.bufferMinutes || 0;

    // 6. Get existing appointments for this employee on this date
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        employeeId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'PENDING_PAYMENT'] },
      },
      select: { startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
    });

    // 7. Generate all possible slots
    const serviceDuration = service.duration;
    const allSlots = this.generateTimeSlots(
      schedule.startTime,
      schedule.endTime,
      serviceDuration,
      bufferMinutes,
      schedule.breakStart || undefined,
      schedule.breakEnd || undefined,
    );

    // 8. Filter out conflicting slots
    const availableSlots = allSlots.filter((slot) => {
      return !existingAppointments.some((appt) => {
        return this.timesOverlap(
          slot.startTime,
          slot.endTime,
          appt.startTime,
          appt.endTime,
        );
      });
    });

    // 9. Filter out past slots if date is today
    const now = new Date();
    const isToday = targetDate.toDateString() === now.toDateString();
    if (isToday) {
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      return availableSlots.filter((slot) => slot.startTime > currentTime);
    }

    return availableSlots;
  }

  /**
   * Generate time slots from start to end, respecting duration and breaks
   */
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number,
    bufferMinutes: number,
    breakStart?: string,
    breakEnd?: string,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    let currentMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const breakStartMinutes = breakStart ? this.timeToMinutes(breakStart) : -1;
    const breakEndMinutes = breakEnd ? this.timeToMinutes(breakEnd) : -1;

    while (currentMinutes + durationMinutes <= endMinutes) {
      const slotEnd = currentMinutes + durationMinutes;

      // Check if slot overlaps with break
      if (breakStartMinutes >= 0 && breakEndMinutes >= 0) {
        const overlapsBreak =
          (currentMinutes < breakEndMinutes && slotEnd > breakStartMinutes);

        if (overlapsBreak) {
          // Skip to after break
          currentMinutes = breakEndMinutes;
          continue;
        }
      }

      slots.push({
        startTime: this.minutesToTime(currentMinutes),
        endTime: this.minutesToTime(slotEnd),
      });

      // Move to next slot (duration + buffer)
      currentMinutes = slotEnd + bufferMinutes;
    }

    return slots;
  }

  /**
   * Check if two time ranges overlap
   */
  private timesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);
    return s1 < e2 && s2 < e1;
  }

  /**
   * Convert "HH:MM" to total minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert total minutes to "HH:MM"
   */
  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
