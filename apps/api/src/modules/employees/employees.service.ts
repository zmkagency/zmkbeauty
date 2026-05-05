import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateEmployeeDto) {
    const employee = await this.prisma.employee.create({
      data: {
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        title: dto.title,
        bio: dto.bio,
        sortOrder: dto.sortOrder || 0,
      },
    });

    // Create default weekly schedule (Mon-Sat 09:00-18:00)
    const defaultSchedules: any[] = [];
    for (let day = 0; day < 6; day++) {
      defaultSchedules.push({
        employeeId: employee.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        isWorking: true,
      });
    }
    // Sunday off
    defaultSchedules.push({
      employeeId: employee.id,
      dayOfWeek: 6,
      startTime: '09:00',
      endTime: '18:00',
      isWorking: false,
    });

    await this.prisma.employeeSchedule.createMany({ data: defaultSchedules });

    // Assign services if provided
    if (dto.serviceIds?.length) {
      await this.prisma.employeeService.createMany({
        data: dto.serviceIds.map((serviceId) => ({
          employeeId: employee.id,
          serviceId,
        })),
      });
    }

    return this.findById(employee.id);
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.employee.findMany({
      where: { tenantId, isActive: true },
      include: {
        schedules: { orderBy: { dayOfWeek: 'asc' } },
        services: {
          include: { service: { select: { id: true, name: true, price: true, duration: true } } },
        },
        _count: { select: { appointments: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        schedules: { orderBy: { dayOfWeek: 'asc' } },
        leaves: { where: { endDate: { gte: new Date() } }, orderBy: { startDate: 'asc' } },
        services: {
          include: { service: true },
        },
      },
    });
    if (!employee) throw new NotFoundException('Çalışan bulunamadı');
    return employee;
  }

  async update(id: string, data: Partial<CreateEmployeeDto>) {
    await this.findById(id);
    const { serviceIds, ...rest } = data;
    
    const updated = await this.prisma.employee.update({
      where: { id },
      data: rest,
    });

    if (serviceIds !== undefined) {
      // Replace all service assignments
      await this.prisma.employeeService.deleteMany({ where: { employeeId: id } });
      if (serviceIds.length) {
        await this.prisma.employeeService.createMany({
          data: serviceIds.map((serviceId) => ({ employeeId: id, serviceId })),
        });
      }
    }

    return this.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async addLeave(id: string, data: { startDate: string; endDate: string; reason?: string }) {
    await this.findById(id);
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (end < start) {
      throw new BadRequestException('Bitiş tarihi başlangıç tarihinden önce olamaz');
    }

    return this.prisma.employeeLeave.create({
      data: {
        employeeId: id,
        startDate: start,
        endDate: end,
        reason: data.reason,
      },
    });
  }

  async removeLeave(leaveId: string) {
    return this.prisma.employeeLeave.delete({ where: { id: leaveId } });
  }

  async getLeaves(employeeId: string) {
    return this.prisma.employeeLeave.findMany({
      where: { employeeId },
      orderBy: { startDate: 'desc' },
    });
  }
}
