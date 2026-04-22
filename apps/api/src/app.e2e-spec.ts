import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
const request = supertest;
import { AppModule } from './modules/app/app.module';
import { PrismaService } from './modules/prisma/prisma.service';
import { GlobalExceptionFilter } from './modules/app/http-exception.filter';
import { TransformInterceptor } from './modules/app/transform.interceptor';
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
        .send({ email: agentEmail, password, agencyName: `e2e-agency-${Date.now()}` })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(agentEmail);
      expect(res.body.data.user.role).toBe('agent');
      agentToken = res.body.data.accessToken;
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
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(agentEmail);
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

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(agentEmail);
    });

    it('GET /auth/me — should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('PATCH /auth/me — should update name', async () => {
      const res = await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Updated Name');
    });

    it('PATCH /auth/me — should update phone', async () => {
      const res = await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ phone: '+8801712345678' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.phone).toBe('+8801712345678');
    });

    it('PATCH /auth/me — should reject without token', async () => {
      await request(app.getHttpServer())
        .patch('/auth/me')
        .send({ name: 'Hacker' })
        .expect(401);
    });

    it('PATCH /auth/me — should reject short password', async () => {
      await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ password: 'short' })
        .expect(400);
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

      adminToken = res.body.data.accessToken;
    });

    it('POST /admin/agencies — should create agency (admin only)', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/agencies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `e2e-agency-${Date.now()}` })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toContain('e2e-agency');
      agencyId = res.body.data.id;
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

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(newAgentEmail);
      expect(res.body.data.role).toBe('agent');
      expect(res.body.data.agencyId).toBe(agencyId);
    });

    it('POST /admin/users/agents — should reject invalid agencyId', async () => {
      await request(app.getHttpServer())
        .post('/admin/users/agents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: `e2e-bad-${Date.now()}@test.com`, password, agencyId: 'nonexistent' })
        .expect(404);
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

      const tokenWithAgency = loginRes.body.data.accessToken;

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

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.totalPrice.currency).toBe('USD');
    });

    it('GET /bookings — should list bookings for agent', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: agentEmail, password });

      const tokenWithAgency = loginRes.body.data.accessToken;

      const res = await request(app.getHttpServer())
        .get('/bookings')
        .set('Authorization', `Bearer ${tokenWithAgency}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
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

  describe('Health endpoint', () => {
    it('GET /health — should return status', async () => {
      const res = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.db).toBe('ok');
    });
  });

  describe('Booking confirm/cancel flow', () => {
    let bookingId: string;

    it('should create a booking to operate on', async () => {
      const res = await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          offerId: 'offer-e2e-confirm',
          offerData: { test: true },
          currency: 'USD',
          amount: '300.00'
        })
        .expect(201);

      bookingId = res.body.data.id;
    });

    it('PATCH /bookings/:id/confirm — should confirm a draft booking', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('confirmed');
    });

    it('PATCH /bookings/:id/cancel — should cancel a confirmed booking', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('cancelled');
    });

    it('PATCH /bookings/:id/cancel — should reject cancelling already cancelled', async () => {
      await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(400);
    });
  });

  describe('Admin bookings access', () => {
    it('GET /bookings — admin should list all bookings', async () => {
      const res = await request(app.getHttpServer())
        .get('/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /bookings/:id — admin should get any booking', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/bookings')
        .set('Authorization', `Bearer ${adminToken}`);

      const firstBooking = listRes.body.data[0];
      if (!firstBooking) return;

      const res = await request(app.getHttpServer())
        .get(`/bookings/${firstBooking.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(firstBooking.id);
    });
  });

  describe('Admin user/agency listing', () => {
    it('GET /admin/agencies — should list agencies', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/agencies')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /admin/users — should list users', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Admin agency CRUD', () => {
    let crudAgencyId: string;

    it('PATCH /admin/agencies/:id — should update agency name', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/admin/agencies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `e2e-crud-agency-${Date.now()}` })
        .expect(201);

      crudAgencyId = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .patch(`/admin/agencies/${crudAgencyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'e2e-crud-updated' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('e2e-crud-updated');
    });

    it('PATCH /admin/agencies/:id — should reject nonexistent agency', async () => {
      await request(app.getHttpServer())
        .patch('/admin/agencies/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'nope' })
        .expect(404);
    });

    it('DELETE /admin/agencies/:id — should delete agency', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/admin/agencies/${crudAgencyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(crudAgencyId);
    });

    it('DELETE /admin/agencies/:id — should reject nonexistent agency', async () => {
      await request(app.getHttpServer())
        .delete('/admin/agencies/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Admin user CRUD', () => {
    let crudUserId: string;

    it('PATCH /admin/users/:id — should update user name', async () => {
      const agentRes = await request(app.getHttpServer())
        .post('/admin/users/agents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: `e2e-crud-user-${Date.now()}@test.com`, password, agencyId })
        .expect(201);

      crudUserId = agentRes.body.data.id;

      const res = await request(app.getHttpServer())
        .patch(`/admin/users/${crudUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated E2E User', phone: '+8801700000000' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated E2E User');
      expect(res.body.data.phone).toBe('+8801700000000');
    });

    it('PATCH /admin/users/:id — should reject nonexistent user', async () => {
      await request(app.getHttpServer())
        .patch('/admin/users/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'nope' })
        .expect(404);
    });

    it('DELETE /admin/users/:id — should delete user', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/admin/users/${crudUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(crudUserId);
    });

    it('DELETE /admin/users/:id — should reject nonexistent user', async () => {
      await request(app.getHttpServer())
        .delete('/admin/users/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Admin booking confirm/cancel', () => {
    let adminBookingId: string;

    it('should create a booking for admin to operate on', async () => {
      const res = await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          offerId: 'offer-e2e-admin-action',
          offerData: { test: true },
          currency: 'USD',
          amount: '200.00'
        })
        .expect(201);

      adminBookingId = res.body.data.id;
    });

    it('PATCH /bookings/:id/confirm — admin should confirm booking', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/bookings/${adminBookingId}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('confirmed');
    });

    it('PATCH /bookings/:id/cancel — admin should cancel booking', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/bookings/${adminBookingId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('cancelled');
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

  describe('Password reset flow', () => {
    it('POST /auth/forgot-password — should return message (does not reveal email existence)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: agentEmail })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBeDefined();
      // In dev mode, token is returned
      expect(res.body.data.token).toBeDefined();
    });

    it('POST /auth/forgot-password — should succeed even for nonexistent email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBeDefined();
      expect(res.body.data.token).toBe('');
    });

    it('POST /auth/reset-password — should reset password with valid token', async () => {
      // Request reset token
      const forgotRes = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: agentEmail })
        .expect(200);

      const resetToken = forgotRes.body.data.token;
      expect(resetToken).toBeTruthy();

      // Reset password
      const newPassword = 'newTestPassword456';
      const resetRes = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: resetToken, password: newPassword })
        .expect(200);

      expect(resetRes.body.success).toBe(true);
      expect(resetRes.body.data.message).toBeDefined();

      // Login with new password
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: agentEmail, password: newPassword })
        .expect(200);

      expect(loginRes.body.data.accessToken).toBeDefined();

      // Reset back to original password for other tests
      const forgotRes2 = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: agentEmail })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: forgotRes2.body.data.token, password })
        .expect(200);
    });

    it('POST /auth/reset-password — should reject invalid token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'invalid-token-12345', password: 'somePassword123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('POST /auth/reset-password — should reject short password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'sometoken', password: 'short' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Admin stats endpoint', () => {
    it('GET /admin/stats — should return admin stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.totalAgencies).toBeDefined();
      expect(data.totalUsers).toBeDefined();
      expect(data.totalAgents).toBeDefined();
      expect(data.totalBookings).toBeDefined();
      expect(data.bookingsByStatus).toBeDefined();
      expect(data.bookingsByStatus.draft).toBeDefined();
      expect(data.bookingsByStatus.confirmed).toBeDefined();
      expect(data.bookingsByStatus.cancelled).toBeDefined();
      expect(data.totalRevenue).toBeDefined();
      expect(data.revenueCurrency).toBeDefined();
      expect(data.topAgencies).toBeDefined();
      expect(Array.isArray(data.topAgencies)).toBe(true);
      expect(data.recentBookingsCount).toBeDefined();
    });

    it('GET /admin/stats — should reject agent role', async () => {
      await request(app.getHttpServer())
        .get('/admin/stats')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(403);
    });
  });

  describe('Agent stats endpoint', () => {
    it('GET /agent/stats — should return agent stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/agent/stats')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.totalBookings).toBeDefined();
      expect(data.bookingsByStatus).toBeDefined();
      expect(data.totalRevenue).toBeDefined();
      expect(data.revenueCurrency).toBeDefined();
      expect(data.recentBookingsCount).toBeDefined();
      expect(data.monthlyRevenue).toBeDefined();
      expect(Array.isArray(data.monthlyRevenue)).toBe(true);
    });

    it('GET /agent/stats — should reject admin role', async () => {
      await request(app.getHttpServer())
        .get('/agent/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });
  });

  describe('Booking CSV export', () => {
    it('GET /bookings/export/csv — should return CSV content', async () => {
      const res = await request(app.getHttpServer())
        .get('/bookings/export/csv')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(typeof res.body).toBe('string');
      expect(res.body).toContain('ID,Status,Offer ID,Currency,Amount,Agency,Agent Email,Created At,Updated At');
    });

    it('GET /bookings/export/csv — should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/bookings/export/csv?status=confirmed')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(typeof res.body).toBe('string');
      expect(res.body).toContain('ID,Status');
    });

    it('GET /bookings/export/csv — should filter by date range', async () => {
      const fromDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const toDate = new Date().toISOString();
      const res = await request(app.getHttpServer())
        .get(`/bookings/export/csv?fromDate=${fromDate}&toDate=${toDate}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(typeof res.body).toBe('string');
      expect(res.body).toContain('ID,Status');
    });

    it('GET /bookings/export/csv — admin should export all bookings', async () => {
      const res = await request(app.getHttpServer())
        .get('/bookings/export/csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(typeof res.body).toBe('string');
      expect(res.body).toContain('ID,Status');
    });

    it('GET /bookings/export/csv — should reject unauthenticated', async () => {
      await request(app.getHttpServer())
        .get('/bookings/export/csv')
        .expect(401);
    });
  });

  describe('Audit log filtering', () => {
    it('GET /audit — should return paginated audit logs', async () => {
      const res = await request(app.getHttpServer())
        .get('/audit?limit=5&offset=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.meta).toBeDefined();
    });

    it('GET /audit — should filter by action', async () => {
      const res = await request(app.getHttpServer())
        .get('/audit?action=auth.login&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('GET /audit — should filter by resource', async () => {
      const res = await request(app.getHttpServer())
        .get('/audit?resource=booking&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('GET /audit — should filter by both action and resource', async () => {
      const res = await request(app.getHttpServer())
        .get('/audit?action=booking.create&resource=booking&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });
});
