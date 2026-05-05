# ZBEAUTY Tenant Dashboard & CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the ZBEAUTY admin panel into an Enterprise-grade B2B SaaS dashboard featuring advanced analytics, a Calendar/Kanban appointment view, CRM (Customer Relationship Management), and newly added Campaign/Inventory management.

**Architecture:** 
- **Backend (NestJS):** Build robust analytics aggregation endpoints, calendar specific DTOs, and CRUD operations for the newly added Prisma models (`Campaign`, `Product`, `Review`, `Equipment`).
- **Frontend (Next.js 14+):** Create interactive UI components using Recharts (for analytics), a React Calendar library (like `react-big-calendar` or FullCalendar), and shadcn/ui for forms and data tables. State management via Zustand.
- **Testing:** TDD approach. Jest/Supertest for backend endpoints, Playwright for E2E frontend validation.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Next.js (App Router), TailwindCSS, Recharts, React Big Calendar, Jest, Playwright.

---

## Task 1: Backend - Advanced Analytics Endpoint

**Goal:** Provide aggregate data for the Tenant Dashboard (Revenue over time, top services, employee performance).

**Files:**
- Modify: `apps/api/src/modules/dashboard/dashboard.service.ts`
- Modify: `apps/api/src/modules/dashboard/dashboard.controller.ts`
- Modify: `apps/api/test/dashboard.e2e-spec.ts` (Create if missing)

- [ ] **Step 1: Write the failing E2E test**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('DashboardController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Assuming a test seeder has run to provide a tenant and a store admin user
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@testsalon.com', password: 'password123' });
    
    // We expect the HttpOnly cookie 'accessToken' to be set.
    const cookies = loginRes.headers['set-cookie'];
    accessToken = cookies.find(c => c.startsWith('accessToken=')).split(';')[0];
    tenantId = loginRes.body.user.tenantId;
  });

  it('/api/dashboard/analytics (GET) should return revenue and top services', async () => {
    const response = await request(app.getHttpServer())
      .get('/dashboard/analytics?range=30d')
      .set('Cookie', [accessToken])
      .set('x-tenant-id', tenantId)
      .expect(200);

    expect(response.body).toHaveProperty('revenueData');
    expect(response.body).toHaveProperty('topServices');
    expect(Array.isArray(response.body.revenueData)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd apps/api && npm run test:e2e`
Expected: FAIL (Endpoint not found or structure mismatch)

- [ ] **Step 3: Implement `getAdvancedAnalytics` in Service**
```typescript
// apps/api/src/modules/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdvancedAnalytics(tenantId: string, range: string = '30d') {
    // Determine date range (simplified for 30d)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // 1. Revenue over time (Grouped by Day)
    const payments = await this.prisma.payment.findMany({
      where: {
        tenantId,
        status: 'SUCCESS',
        createdAt: { gte: startDate }
      },
      select: { amount: true, createdAt: true }
    });

    const revenueMap = new Map<string, number>();
    payments.forEach(p => {
      const dateStr = p.createdAt.toISOString().split('T')[0];
      revenueMap.set(dateStr, (revenueMap.get(dateStr) || 0) + Number(p.amount));
    });

    const revenueData = Array.from(revenueMap.entries()).map(([date, total]) => ({ date, total }));

    // 2. Top Services
    const appointments = await this.prisma.appointment.findMany({
      where: { tenantId, status: 'COMPLETED', date: { gte: startDate } },
      include: { service: true }
    });

    const serviceMap = new Map<string, { name: string, count: number, revenue: number }>();
    appointments.forEach(app => {
      const srv = serviceMap.get(app.serviceId) || { name: app.service.name, count: 0, revenue: 0 };
      srv.count += 1;
      srv.revenue += Number(app.totalPrice);
      serviceMap.set(app.serviceId, srv);
    });

    const topServices = Array.from(serviceMap.values()).sort((a, b) => b.count - a.count).slice(0, 5);

    return { revenueData, topServices };
  }
}
```

- [ ] **Step 4: Implement Controller Endpoint**
```typescript
// apps/api/src/modules/dashboard/dashboard.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@Roles('STORE_ADMIN', 'SUPERADMIN')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('analytics')
  async getAnalytics(
    @CurrentUser('tenantId') tenantId: string,
    @Query('range') range: string
  ) {
    return this.dashboardService.getAdvancedAnalytics(tenantId, range);
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**
Run: `cd apps/api && npm run test:e2e`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add apps/api/src/modules/dashboard apps/api/test/dashboard.e2e-spec.ts
git commit -m "feat(backend): add advanced analytics endpoint for tenant dashboard"
```

---

## Task 2: Frontend - Dashboard Analytics UI

**Goal:** Create visual charts for Revenue and Top Services using Recharts in the admin panel.

**Files:**
- Create/Modify: `apps/web/src/app/admin/page.tsx`
- Create: `apps/web/src/components/admin/RevenueChart.tsx`
- Create: `apps/web/src/components/admin/TopServicesList.tsx`

- [ ] **Step 1: Install Recharts**
Run: `cd apps/web && npm install recharts`

- [ ] **Step 2: Create RevenueChart Component**
```tsx
// apps/web/src/components/admin/RevenueChart.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueChart({ data }: { data: { date: string, total: number }[] }) {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-500">Veri bulunamadı</div>;

  return (
    <div className="h-80 w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Son 30 Günlük Ciro</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(val) => `₺${val}`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => [`₺${value}`, 'Ciro']} labelStyle={{ color: '#374151' }} />
          <Line type="monotone" dataKey="total" stroke="#e11d48" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 3: Integrate into Admin Dashboard Page**
```tsx
// apps/web/src/app/admin/page.tsx
"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import RevenueChart from "@/components/admin/RevenueChart";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<{revenueData: any[], topServices: any[]} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/dashboard/analytics?range=30d');
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">İşletme Özeti</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={analytics?.revenueData || []} />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">En Çok Tercih Edilen Hizmetler</h3>
          <ul className="space-y-4">
            {analytics?.topServices.map((srv, idx) => (
              <li key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{srv.name}</p>
                  <p className="text-xs text-gray-500">{srv.count} Randevu</p>
                </div>
                <span className="font-bold text-rose-600">₺{srv.revenue}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**
```bash
git add apps/web/src/app/admin apps/web/src/components/admin
git commit -m "feat(frontend): implement dashboard analytics charts with recharts"
```

---

## Task 3: Backend - Campaign Management (CRUD)

**Goal:** Allow Store Admins to create, read, update, and delete discount campaigns.

**Files:**
- Create: `apps/api/src/modules/campaigns/campaigns.module.ts`
- Create: `apps/api/src/modules/campaigns/campaigns.controller.ts`
- Create: `apps/api/src/modules/campaigns/campaigns.service.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Generate Module, Service, Controller**
Run: `cd apps/api && npx nest g module modules/campaigns && npx nest g service modules/campaigns && npx nest g controller modules/campaigns`

- [ ] **Step 2: Write Service Implementation**
```typescript
// apps/api/src/modules/campaigns/campaigns.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountType } from '@prisma/client';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.campaign.create({
      data: {
        ...data,
        tenantId,
        discountType: data.discountType as DiscountType,
      }
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async toggleActive(id: string, tenantId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id, tenantId } });
    if (!campaign) throw new NotFoundException('Kampanya bulunamadı');
    
    return this.prisma.campaign.update({
      where: { id },
      data: { isActive: !campaign.isActive }
    });
  }
}
```

- [ ] **Step 3: Write Controller Implementation**
```typescript
// apps/api/src/modules/campaigns/campaigns.controller.ts
import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CampaignsService } from './campaigns.service';

@Controller('campaigns')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@Roles('STORE_ADMIN')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@CurrentUser('tenantId') tenantId: string, @Body() data: any) {
    return this.campaignsService.create(tenantId, data);
  }

  @Get()
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.campaignsService.findAll(tenantId);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.campaignsService.toggleActive(id, tenantId);
  }
}
```

- [ ] **Step 4: Commit**
```bash
git add apps/api/src/modules/campaigns apps/api/src/app.module.ts
git commit -m "feat(backend): add CRUD operations for campaigns"
```

---

## Task 4: Frontend - Calendar View Integration

**Goal:** Add a calendar view to the appointments page for visual management.

**Files:**
- Install: `react-big-calendar` and `date-fns`
- Create: `apps/web/src/components/admin/AppointmentCalendar.tsx`
- Modify: `apps/web/src/app/admin/appointments/page.tsx`

- [ ] **Step 1: Install Calendar dependencies**
Run: `cd apps/web && npm install react-big-calendar date-fns && npm install -D @types/react-big-calendar`

- [ ] **Step 2: Create AppointmentCalendar Component**
```tsx
// apps/web/src/components/admin/AppointmentCalendar.tsx
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
        title: `${app.customer.firstName} - ${app.service.name}`,
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
```

- [ ] **Step 3: Integrate into Appointments Page**
```tsx
// apps/web/src/app/admin/appointments/page.tsx
"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import AppointmentCalendar from "@/components/admin/AppointmentCalendar";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [view, setView] = useState<'list' | 'calendar'>('calendar');

  useEffect(() => {
    api.get('/appointments').then(res => setAppointments(res.data));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Randevular</h1>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button 
            onClick={() => setView('calendar')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${view === 'calendar' ? 'bg-white shadow text-gray-900 font-medium' : 'text-gray-500'}`}
          >
            Takvim
          </button>
          <button 
            onClick={() => setView('list')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${view === 'list' ? 'bg-white shadow text-gray-900 font-medium' : 'text-gray-500'}`}
          >
            Liste
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <AppointmentCalendar appointments={appointments} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-gray-500">
          Liste görünümü (Mevcut Table implementasyonu buraya gelecek)
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**
```bash
git add apps/web/src/app/admin/appointments apps/web/src/components/admin
git commit -m "feat(frontend): implement react-big-calendar for admin appointments"
```

---

## Task 5: CRM (Customer Relationship Management) View

**Goal:** Create a dedicated Customer Detail view for the store admin, showing past appointments, total LTV (Lifetime Value), and reviews left.

**Files:**
- Create: `apps/api/src/modules/users/users.controller.ts` (Add `getTenantCustomerDetails`)
- Create: `apps/web/src/app/admin/customers/[id]/page.tsx`

- [ ] **Step 1: Backend Endpoint for Customer CRM Data**
```typescript
// Add to apps/api/src/modules/users/users.service.ts
async getTenantCustomerDetails(tenantId: string, customerId: string) {
  const customer = await this.prisma.user.findFirst({
    where: { id: customerId, appointments: { some: { tenantId } } },
    include: {
      appointments: {
        where: { tenantId },
        include: { service: true, employee: true },
        orderBy: { date: 'desc' }
      },
      reviews: {
        where: { tenantId }
      }
    }
  });

  if (!customer) throw new NotFoundException('Müşteri bulunamadı');

  const ltv = customer.appointments
    .filter(a => a.status === 'COMPLETED')
    .reduce((sum, a) => sum + Number(a.totalPrice), 0);

  return { ...customer, ltv };
}
```
*(Wire this to the controller in a new step/commit)*

- [ ] **Step 2: Frontend CRM View**
```tsx
// apps/web/src/app/admin/customers/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { User, Star, Calendar as CalendarIcon, DollarSign } from "lucide-react";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    api.get(`/users/tenant-customers/${id}`).then(res => setCustomer(res.data));
  }, [id]);

  if (!customer) return <div>Yükleniyor...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Profile */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center">
          <User className="w-10 h-10 text-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.firstName} {customer.lastName}</h1>
          <p className="text-gray-500">{customer.email} • {customer.phone || 'Telefon yok'}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-gray-500 mb-1">Toplam Ciro (LTV)</p>
          <p className="text-3xl font-bold text-emerald-600">₺{customer.ltv}</p>
        </div>
      </div>

      {/* Appointment History */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          Randevu Geçmişi
        </h3>
        <div className="space-y-3">
          {customer.appointments.map((app: any) => (
            <div key={app.id} className="flex justify-between items-center p-4 rounded-xl border border-gray-50 bg-gray-50/50">
              <div>
                <p className="font-semibold text-gray-900">{app.service.name}</p>
                <p className="text-sm text-gray-500">{new Date(app.date).toLocaleDateString('tr-TR')} • {app.startTime}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${app.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>
                  {app.status}
                </span>
                <p className="mt-2 font-bold text-gray-900">₺{app.totalPrice}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add apps/api/src/modules/users apps/web/src/app/admin/customers
git commit -m "feat: implement Customer CRM view with LTV calculation"
```

---
