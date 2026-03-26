/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { globalValidationPipe } from './../src/common/pipes/validation.pipe';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(globalValidationPipe);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Two-phase app login flow ──────────────────────────────────────

  it('POST /auth/app/login - returns OTP challenge (no JWT)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'CONTRACT-001',
        password: 'password123',
        deviceId: 'test-device-001',
      })
      .expect(200);

    // Phase 1: should return challenge, NOT JWT tokens
    expect(res.body.otpRequired).toBe(true);
    expect(res.body.loginToken).toBeDefined();
    expect(res.body.message).toContain('OTP');
    expect(res.body.canAccessOtt).toBe(true);
    expect(res.body.restrictionMessage).toBeNull();
    // Should NOT include JWT tokens
    expect(res.body.accessToken).toBeUndefined();
    expect(res.body.refreshToken).toBeUndefined();
  });

  it('POST /auth/app/verify-otp - completes login with JWT after OTP', async () => {
    // Phase 1: Get login challenge
    const loginRes = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'CONTRACT-001',
        password: 'password123',
        deviceId: 'test-device-otp',
      })
      .expect(200);

    // Phase 2: Complete login with OTP (mock code 123456)
    const res = await request(app.getHttpServer())
      .post('/auth/app/verify-otp')
      .send({
        loginToken: loginRes.body.loginToken,
        code: '123456',
      })
      .expect(200);

    // Now should have JWT tokens
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.canAccessOtt).toBe(true);
    expect(res.body.restrictionMessage).toBeNull();
  });

  it('POST /auth/app/verify-otp - fails with wrong OTP', async () => {
    // Phase 1: Get login challenge
    const loginRes = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'CONTRACT-001',
        password: 'password123',
        deviceId: 'test-device-wrong-otp',
      })
      .expect(200);

    // Phase 2: Wrong OTP
    await request(app.getHttpServer())
      .post('/auth/app/verify-otp')
      .send({
        loginToken: loginRes.body.loginToken,
        code: '999999',
      })
      .expect(401);
  });

  it('POST /auth/app/login - suspended ISP user gets challenge with OTT restriction', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'CONTRACT-003',
        password: 'password123',
        deviceId: 'test-device-suspended',
      })
      .expect(200);

    expect(res.body.otpRequired).toBe(true);
    expect(res.body.loginToken).toBeDefined();
    expect(res.body.canAccessOtt).toBe(false);
    expect(res.body.restrictionMessage).toContain('SUSPENDIDO');
  });

  it('full two-phase login for suspended user issues tokens with OTT restriction', async () => {
    // Phase 1
    const loginRes = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'CONTRACT-003',
        password: 'password123',
        deviceId: 'test-device-suspended-2',
      })
      .expect(200);

    // Phase 2
    const res = await request(app.getHttpServer())
      .post('/auth/app/verify-otp')
      .send({
        loginToken: loginRes.body.loginToken,
        code: '123456',
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.canAccessOtt).toBe(false);
    expect(res.body.restrictionMessage).toContain('SUSPENDIDO');
  });

  it('POST /auth/app/login - OTT-only customer gets challenge', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'OTT-000001',
        password: 'password123',
        deviceId: 'test-device-ott',
      })
      .expect(200);

    expect(res.body.otpRequired).toBe(true);
    expect(res.body.loginToken).toBeDefined();
    expect(res.body.canAccessOtt).toBe(true);
  });

  it('POST /auth/app/login - CORTESIA ISP user gets challenge with OTT access', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'CONTRACT-004',
        password: 'password123',
        deviceId: 'test-device-cortesia',
      })
      .expect(200);

    expect(res.body.otpRequired).toBe(true);
    expect(res.body.canAccessOtt).toBe(true);
  });

  it('POST /auth/app/login - invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'INVALID',
        password: 'wrongpassword',
        deviceId: 'test-device',
      })
      .expect(401);
  });

  // ── CMS login (no OTP required) ──────────────────────────────────

  it('POST /auth/cms/login - success (direct JWT, no OTP)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/cms/login')
      .send({
        email: 'admin@lukiplay.com',
        password: 'password123',
        deviceId: 'cms-browser-001',
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.canAccessOtt).toBe(true);
  });

  // ── Authenticated endpoints ───────────────────────────────────────

  it('GET /auth/me - requires authentication', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('GET /auth/me - returns user profile after full two-phase login', async () => {
    // Phase 1
    const loginRes = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'CONTRACT-001',
        password: 'password123',
        deviceId: 'test-device-me',
      });

    // Phase 2
    const verifyRes = await request(app.getHttpServer())
      .post('/auth/app/verify-otp')
      .send({
        loginToken: loginRes.body.loginToken,
        code: '123456',
      });

    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${verifyRes.body.accessToken}`)
      .expect(200);

    expect(res.body.id).toBe('usr-001');
    expect(res.body.role).toBe('cliente');
    expect(res.body.contractType).toBe('ISP');
    expect(res.body.serviceStatus).toBe('ACTIVO');
    expect(res.body.canAccessOtt).toBe(true);
    expect(res.body.permissions).toContain('app:playback');
  });

  it('POST /auth/refresh - returns new tokens after full two-phase login', async () => {
    // Phase 1
    const loginRes = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'CONTRACT-002',
        password: 'password123',
        deviceId: 'test-device-refresh',
      });

    // Phase 2
    const verifyRes = await request(app.getHttpServer())
      .post('/auth/app/verify-otp')
      .send({
        loginToken: loginRes.body.loginToken,
        code: '123456',
      });

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: verifyRes.body.refreshToken })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.canAccessOtt).toBe(true);
  });

  // ── OTP standalone endpoints ──────────────────────────────────────

  it('POST /auth/otp/request - sends OTP (resend)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ contractNumber: 'CONTRACT-001' })
      .expect(200);

    expect(res.body.message).toContain('OTP');
  });

  it('POST /auth/otp/verify - verifies OTP standalone', async () => {
    await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ contractNumber: 'CONTRACT-001' })
      .expect(200);

    const res = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ contractNumber: 'CONTRACT-001', code: '123456' })
      .expect(200);

    expect(res.body.verified).toBe(true);
  });

  // ── Validation ────────────────────────────────────────────────────

  it('POST /auth/app/login - validation error for missing fields', () => {
    return request(app.getHttpServer())
      .post('/auth/app/login')
      .send({})
      .expect(400);
  });

  it('POST /auth/app/verify-otp - validation error for missing fields', () => {
    return request(app.getHttpServer())
      .post('/auth/app/verify-otp')
      .send({})
      .expect(400);
  });
});
