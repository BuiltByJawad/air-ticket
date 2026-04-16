import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
const request = supertest;
import { AppModule } from './modules/app/app.module';
import { PrismaService } from './modules/prisma/prisma.service';
import { GlobalExceptionFilter } from './modules/app/http-exception.filter';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * E2E tests require a running PostgreSQL database.
 * Run `pnpm --filter @air-ticket/api prisma:migrate` before these tests.
 * Skipped automatically when DATABASE_URL is not set or DB is unreachable.
 */
const dbUrl = process.env.DATABASE_URL;
const describeE2E = dbUrl ? describe : describe.skip;

describeE2E('App E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let agentToken: string;
  let agencyId: string;

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

    const { loadEnv } = await import('./config/env');
    const env = loadEnv();
    app.enableCors({ origin: env.CORS_ORIGIN, credentials: true });
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();
    prisma = app.get(PrismaService);
  }, 30_000);

  afterAll(async () => {
    try {
      await prisma.auditLog.deleteMany({});
      await prisma.booking.deleteMany({});
      await prisma.user.deleteMany({ where: { email: { contains: 'e2e-' } } });
      await prisma.agency.deleteMany({ where: { name: { contains: 'e2e-' } } });
    } catch {
      // ignore cleanup errors
    }
    await app.close();
  });

  describe('Auth flow', () => {
    it('POST /auth/register — should register a new agent', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: agentEmail, password })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(agentEmail);
      expect(res.body.user.role).toBe('agent');
      agentToken = res.body.accessToken;
    });

    it('POST /auth/register — should reject invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'bad', password })
        .expect(400);
    });

    it('POST /auth/register — should reject short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'a@b.com', password: 'short' })
        .expect(400);
    });

    it('POST /auth/login — should login with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: agentEmail, password })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(agentEmail);
    });

    it('POST /auth/login — should reject wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: agentEmail, password: 'wrongPassword' })
        .expect(401);
    });

    it('GET /auth/me — should return user with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(res.body.user.email).toBe(agentEmail);
    });

    it('GET /auth/me — should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('Admin flow', () => {
    beforeAll(async () => {
      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.hash(password, 12);
      await prisma.user.create({
        data: { email: adminEmail, passwordHash: hash, role: 'admin' }
      });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: adminEmail, password });

      adminToken = res.body.accessToken;
    });

    it('POST /admin/agencies — should create agency (admin only)', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/agencies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `e2e-agency-${Date.now()}` })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toContain('e2e-agency');
      agencyId = res.body.id;
    });

    it('POST /admin/agencies — should reject agent', async () => {
      await request(app.getHttpServer())
        .post('/admin/agencies')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ name: 'forbidden' })
        .expect(403);
    });

    it('POST /admin/users/agents — should create agent under agency', async () => {
      const newAgentEmail = `e2e-agent2-${Date.now()}@test.com`;
      const res = await request(app.getHttpServer())
        .post('/admin/users/agents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: newAgentEmail, password, agencyId })
        .expect(201);

      expect(res.body.email).toBe(newAgentEmail);
      expect(res.body.role).toBe('agent');
      expect(res.body.agencyId).toBe(agencyId);
    });

    it('POST /admin/users/agents — should reject invalid agencyId', async () => {
      await request(app.getHttpServer())
        .post('/admin/users/agents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: `e2e-bad-${Date.now()}@test.com`, password, agencyId: 'nonexistent' })
        .expect(400);
    });
  });

  describe('Booking flow', () => {
    it('POST /bookings — should create booking as agent', async () => {
      const agentUser = await prisma.user.findUnique({ where: { email: agentEmail } });
      if (agentUser && !agentUser.agencyId) {
        await prisma.user.update({ where: { id: agentUser.id }, data: { agencyId } });
      }

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: agentEmail, password });

      const tokenWithAgency = loginRes.body.accessToken;

      const res = await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${tokenWithAgency}`)
        .send({
          offerId: 'offer-e2e-1',
          offerData: { test: true },
          currency: 'USD',
          amount: '500.00'
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe('draft');
      expect(res.body.totalPrice.currency).toBe('USD');
    });

    it('GET /bookings — should list bookings for agent', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: agentEmail, password });

      const tokenWithAgency = loginRes.body.accessToken;

      const res = await request(app.getHttpServer())
        .get('/bookings')
        .set('Authorization', `Bearer ${tokenWithAgency}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /bookings — should reject unauthenticated', async () => {
      await request(app.getHttpServer())
        .get('/bookings')
        .expect(401);
    });
  });

  describe('Request ID propagation', () => {
    it('should return x-request-id header', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);

      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('should propagate incoming x-request-id', async () => {
      const customId = 'my-custom-request-id';
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('x-request-id', customId)
        .expect(401);

      expect(res.headers['x-request-id']).toBe(customId);
    });
  });

  describe('Error response format', () => {
    it('should include requestId in error responses', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);

      expect(res.body.requestId).toBeDefined();
      expect(res.body.statusCode).toBe(401);
    });
  });
});
