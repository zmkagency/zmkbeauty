import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Mimic main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/api/auth/register (POST) should register a new customer', async () => {
    const testUser = {
      email: 'testcustomer@zmkbeauty.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Customer',
    };

    // Clean up before test
    await prisma.user.deleteMany({ where: { email: testUser.email } });

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(testUser.email);
    expect(response.headers['set-cookie']).toBeDefined(); // HttpOnly Cookies check
  });
});
