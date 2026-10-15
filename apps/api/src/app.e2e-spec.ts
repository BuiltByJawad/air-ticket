import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from './modules/app/app.module';
import { PrismaService } from './modules/prisma/prisma.service';
import { GlobalExceptionFilter } from './modules/app/http-exception.filter';
import { TransformInterceptor } from './modules/app/transform.interceptor';

const request = supertest;
const dbUrl = process.env.DATABASE_URL;
const describeE2E = dbUrl ? describe : describe.skip;

describeE2E('App E2E (rebuilt)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken = '';
  let agentToken = '';
  let agencyId = '';

  const adminEmail = `e2e-admin-${Date.now()}@test.com`;
  const agentEmail = `e2e-agent-${Date.now()}@test.com`;
  const password = 'testPassword123';

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
  }, 30_000);

  afterAll(async () => {
    try {
      await prisma.auditLog.deleteMany({});
      await prisma.booking.deleteMany({});
      await prisma.asyncJob.deleteMany({});
      await prisma.user.deleteMany({ where: { email: { contains: 'e2e-' } } });
      await prisma.agency.deleteMany({ where: { name: { contains: 'e2e-' } } });
    } catch {
      // ignore cleanup errors
    }
    await app.close();
  });

  it('registers an agent', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: agentEmail, password, agencyName: `e2e-agency-${Date.now()}` })
      .expect(201);
    expect(res.body.success).toBe(true);
    agentToken = res.body.data.accessToken;
  });

  it('creates and logs in admin', async () => {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { email: adminEmail, passwordHash: hash, role: 'admin' } });
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);
    expect(res.body.success).toBe(true);
    adminToken = res.body.data.accessToken;
  });

  it('admin creates agency', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/agencies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `e2e-agency-${Date.now()}` })
      .expect(201);
    expect(res.body.success).toBe(true);
    agencyId = res.body.data.id;
  });

  it('admin creates agent under agency', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/users/agents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: `e2e-agent2-${Date.now()}@test.com`, password, agencyId })
      .expect(201);
    expect(res.body.success).toBe(true);
  });

  it('agent forbidden from admin agencies create', async () => {
    await request(app.getHttpServer())
      .post('/admin/agencies')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ name: 'forbidden' })
      .expect(403);
  });

  it('creates booking as agent', async () => {
    const agentUser = await prisma.user.findUnique({ where: { email: agentEmail } });
    if (agentUser && !agentUser.agencyId) {
      await prisma.user.update({ where: { id: agentUser.id }, data: { agencyId } });
    }
    const relogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: agentEmail, password })
      .expect(200);
    agentToken = relogin.body.data.accessToken;

    const res = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        offerId: `offer-e2e-${Date.now()}`,
        offerData: { test: true },
        currency: 'USD',
        amount: '250.00',
        passengers: [
          {
            firstName: 'Test',
            lastName: 'Passenger',
            email: 'pax@test.com',
            phone: '+8801700000000',
            dateOfBirth: '1995-01-01',
            gender: 'M',
            passportNumber: 'A12345678',
            passportExpiry: '2030-12-31',
            passportIssuingCountry: 'BD'
          }
        ]
      })
      .expect(201);
    expect(res.body.success).toBe(true);
  });

  it('admin stats allowed, agent forbidden', async () => {
    await request(app.getHttpServer())
      .get('/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get('/admin/stats')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(403);
  });

  it('admin jobs list allowed, agent forbidden', async () => {
    await request(app.getHttpServer())
      .get('/admin/jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get('/admin/jobs')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(403);
  });

  it('reconciliation summary allowed for admin, forbidden for agent', async () => {
    const adminRes = await request(app.getHttpServer())
      .get('/admin/reconciliation')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminRes.body.success).toBe(true);
    expect(adminRes.body.data.totals).toBeDefined();

    await request(app.getHttpServer())
      .get('/admin/reconciliation')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(403);
  });

  it('reconciliation export allowed for admin, forbidden for agent', async () => {
    await request(app.getHttpServer())
      .get('/admin/reconciliation/export')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get('/admin/reconciliation/export')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(403);
  });

  it('schedule reconciliation check job allowed for admin, forbidden for agent', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/jobs/schedule/reconciliation-check')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('reconciliation.check');

    await request(app.getHttpServer())
      .post('/admin/jobs/schedule/reconciliation-check')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({})
      .expect(403);
  });
});
