import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async getByEmployee(employeeId: string) {
    return this.prisma.employeeSchedule.findMany({
      where: { employeeId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async update(employeeId: string, schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
    isWorking: boolean;
  }>) {
    // Delete existing and re-create (upsert pattern)
    await this.prisma.employeeSchedule.deleteMany({ where: { employeeId } });

    const data = schedules.map((s) => ({
      employeeId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      breakStart: s.breakStart || null,
      breakEnd: s.breakEnd || null,
      isWorking: s.isWorking,
    }));

    await this.prisma.employeeSchedule.createMany({ data });

    return this.getByEmployee(employeeId);
  }

  async updateDay(employeeId: string, dayOfWeek: number, data: {
    startTime?: string;
    endTime?: string;
    breakStart?: string;
    breakEnd?: string;
    isWorking?: boolean;
  }) {
    const existing = await this.prisma.employeeSchedule.findUnique({
      where: { employeeId_dayOfWeek: { employeeId, dayOfWeek } },
    });

    if (!existing) {
      return this.prisma.employeeSchedule.create({
        data: { employeeId, dayOfWeek, startTime: '09:00', endTime: '18:00', isWorking: true, ...data },
      });
    }

    return this.prisma.employeeSchedule.update({
      where: { id: existing.id },
      data,
    });
  }
}
