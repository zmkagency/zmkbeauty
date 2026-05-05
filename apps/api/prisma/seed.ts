import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ZMK Beauty database...');

  // 1. Create Superadmin
  const superAdminHash = await bcrypt.hash('admin123', 12);
  const superadmin = await prisma.user.upsert({
    where: { email: 'admin@zmkbeauty.com' },
    update: {},
    create: {
      email: 'admin@zmkbeauty.com',
      firstName: 'ZMK',
      lastName: 'Admin',
      passwordHash: superAdminHash,
      role: Role.SUPERADMIN,
      phone: '05001234567',
    },
  });
  console.log('✅ Superadmin created:', superadmin.email);

  // 2. Create Demo Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'zmk-guzellik-merkezi' },
    update: {},
    create: {
      name: 'ZMK Güzellik Merkezi',
      slug: 'zmk-guzellik-merkezi',
      description: 'Kırıkkale\'nin en prestijli güzellik merkezi. Profesyonel ekibimizle saç bakımı, cilt bakımı, lazer epilasyon ve daha fazlası.',
      shortDescription: 'Profesyonel güzellik ve bakım hizmetleri',
      address: 'Yenişehir Mah. Atatürk Cad. No:42, Kırıkkale Merkez',
      phone: '0318 225 00 00',
      email: 'info@zmkguzellik.com',
      city: 'Kırıkkale',
      district: 'Merkez',
      latitude: 39.8468,
      longitude: 33.5153,
      themeColor: '#e11d48',
      workingHours: {
        mon: { open: '09:00', close: '20:00' },
        tue: { open: '09:00', close: '20:00' },
        wed: { open: '09:00', close: '20:00' },
        thu: { open: '09:00', close: '20:00' },
        fri: { open: '09:00', close: '20:00' },
        sat: { open: '10:00', close: '18:00' },
        sun: null,
      },
      socialLinks: {
        instagram: 'https://instagram.com/zmkguzellik',
        facebook: 'https://facebook.com/zmkguzellik',
      },
      seoTitle: 'ZMK Güzellik Merkezi Kırıkkale | Kuaför, Cilt Bakımı, Lazer Epilasyon',
      seoDescription: 'Kırıkkale\'de profesyonel güzellik hizmetleri. Saç kesimi, saç boyama, cilt bakımı, lazer epilasyon ve makyaj. Online randevu alın.',
      bufferMinutes: 5,
    },
  });
  console.log('✅ Demo tenant created:', tenant.name);

  // 3. Create Store Admin
  const storeAdminHash = await bcrypt.hash('store123', 12);
  const storeAdmin = await prisma.user.upsert({
    where: { email: 'magaza@zmkbeauty.com' },
    update: {},
    create: {
      email: 'magaza@zmkbeauty.com',
      firstName: 'Zeynep',
      lastName: 'Kılıç',
      passwordHash: storeAdminHash,
      role: Role.STORE_ADMIN,
      tenantId: tenant.id,
      phone: '05321234567',
    },
  });
  console.log('✅ Store admin created:', storeAdmin.email);

  // 4. Create Services
  const servicesData = [
    { name: 'Kadın Saç Kesimi', description: 'Profesyonel kadın saç kesimi', duration: 45, price: 350, category: 'Saç Hizmetleri', sortOrder: 1 },
    { name: 'Erkek Saç Kesimi', description: 'Modern erkek saç kesimi', duration: 30, price: 200, category: 'Saç Hizmetleri', sortOrder: 2 },
    { name: 'Saç Boyama', description: 'Tam saç boyama işlemi', duration: 90, price: 800, category: 'Saç Hizmetleri', sortOrder: 3 },
    { name: 'Röfle', description: 'Doğal görünümlü röfle uygulaması', duration: 120, price: 1200, category: 'Saç Hizmetleri', sortOrder: 4 },
    { name: 'Saç Bakımı (Keratin)', description: 'Keratin bakım uygulaması', duration: 60, price: 600, category: 'Saç Bakımı', sortOrder: 5 },
    { name: 'Fön', description: 'Profesyonel fön çekimi', duration: 30, price: 150, category: 'Saç Hizmetleri', sortOrder: 6 },
    { name: 'Cilt Bakımı', description: 'Derin cilt temizliği ve bakımı', duration: 60, price: 500, category: 'Cilt Bakımı', sortOrder: 7 },
    { name: 'Lazer Epilasyon (Tek Bölge)', description: 'Alexandrite lazer ile epilasyon', duration: 30, price: 400, category: 'Lazer', sortOrder: 8 },
    { name: 'Lazer Epilasyon (Full Body)', description: 'Tüm vücut lazer epilasyon', duration: 120, price: 2500, category: 'Lazer', sortOrder: 9 },
    { name: 'Makyaj', description: 'Profesyonel makyaj uygulaması', duration: 60, price: 700, category: 'Makyaj', sortOrder: 10 },
    { name: 'Gelin Makyajı', description: 'Özel gün gelin makyajı', duration: 90, price: 2000, category: 'Makyaj', sortOrder: 11 },
    { name: 'Kaş Dizaynı', description: 'İpek kirpik ve kaş şekillendirme', duration: 30, price: 200, category: 'Güzellik', sortOrder: 12 },
    { name: 'Manikür', description: 'El bakımı ve oje uygulaması', duration: 45, price: 250, category: 'El & Ayak Bakımı', sortOrder: 13 },
    { name: 'Pedikür', description: 'Ayak bakımı ve oje uygulaması', duration: 45, price: 300, category: 'El & Ayak Bakımı', sortOrder: 14 },
  ];

  const services: any[] = [];
  for (const svc of servicesData) {
    const service = await prisma.service.create({
      data: { ...svc, tenantId: tenant.id },
    });
    services.push(service);
  }
  console.log(`✅ ${services.length} services created`);

  // 5. Create Employees
  const employeesData = [
    { firstName: 'Ayşe', lastName: 'Yılmaz', title: 'Uzman Kuaför', serviceIndices: [0, 1, 2, 3, 4, 5] },
    { firstName: 'Fatma', lastName: 'Demir', title: 'Cilt Bakım Uzmanı', serviceIndices: [6, 11] },
    { firstName: 'Elif', lastName: 'Kaya', title: 'Lazer Teknisyeni', serviceIndices: [7, 8] },
    { firstName: 'Merve', lastName: 'Çelik', title: 'Makyaj Artisti', serviceIndices: [9, 10, 11] },
    { firstName: 'Selin', lastName: 'Öztürk', title: 'Güzellik Uzmanı', serviceIndices: [6, 12, 13] },
  ];

  for (const emp of employeesData) {
    const employee = await prisma.employee.create({
      data: {
        tenantId: tenant.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        title: emp.title,
      },
    });

    // Create weekly schedule (Mon-Fri 09:00-18:00, Sat 10:00-16:00, Sun off)
    const schedules: any[] = [];
    for (let day = 0; day < 5; day++) {
      schedules.push({
        employeeId: employee.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        isWorking: true,
      });
    }
    schedules.push({
      employeeId: employee.id,
      dayOfWeek: 5,
      startTime: '10:00',
      endTime: '16:00',
      isWorking: true,
    });
    schedules.push({
      employeeId: employee.id,
      dayOfWeek: 6,
      startTime: '09:00',
      endTime: '18:00',
      isWorking: false,
    });

    await prisma.employeeSchedule.createMany({ data: schedules });

    // Assign services
    for (const idx of emp.serviceIndices) {
      if (services[idx]) {
        await prisma.employeeService.create({
          data: { employeeId: employee.id, serviceId: services[idx].id },
        });
      }
    }
  }
  console.log(`✅ ${employeesData.length} employees created with schedules and service assignments`);

  // 6. Create Demo Customer
  const customerHash = await bcrypt.hash('musteri123', 12);
  await prisma.user.upsert({
    where: { email: 'musteri@example.com' },
    update: {},
    create: {
      email: 'musteri@example.com',
      firstName: 'Ahmet',
      lastName: 'Yıldız',
      passwordHash: customerHash,
      role: Role.CUSTOMER,
      tenantId: tenant.id,
      phone: '05551234567',
    },
  });
  console.log('✅ Demo customer created: musteri@example.com');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('   Superadmin: admin@zmkbeauty.com / admin123');
  console.log('   Store Admin: magaza@zmkbeauty.com / store123');
  console.log('   Customer: musteri@example.com / musteri123');
  console.log(`\n   Demo Store: zmkbeauty.com/${tenant.slug}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
