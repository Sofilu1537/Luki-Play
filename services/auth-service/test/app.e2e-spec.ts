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

  it('POST /auth/app/login - success with canAccessOtt', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'CONTRACT-001',
        password: 'password123',
        deviceId: 'test-device-001',
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.canAccessOtt).toBe(true);
    expect(res.body.restrictionMessage).toBeNull();
  });

  it('POST /auth/app/login - suspended ISP user can login but OTT restricted', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'CONTRACT-003',
        password: 'password123',
        deviceId: 'test-device-suspended',
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.canAccessOtt).toBe(false);
    expect(res.body.restrictionMessage).toContain('SUSPENDIDO');
  });

  it('POST /auth/app/login - OTT-only customer can login', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'OTT-000001',
        password: 'password123',
        deviceId: 'test-device-ott',
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.canAccessOtt).toBe(true);
    expect(res.body.restrictionMessage).toBeNull();
  });

  it('POST /auth/app/login - CORTESIA ISP user has OTT access', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'CONTRACT-004',
        password: 'password123',
        deviceId: 'test-device-cortesia',
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.canAccessOtt).toBe(true);
    expect(res.body.restrictionMessage).toBeNull();
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

  it('POST /auth/cms/login - success', async () => {
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

  it('GET /auth/me - requires authentication', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('GET /auth/me - returns user profile with ISP info', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'CONTRACT-001',
        password: 'password123',
        deviceId: 'test-device-002',
      });

    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);

    expect(res.body.id).toBe('usr-001');
    expect(res.body.role).toBe('cliente');
    expect(res.body.contractType).toBe('ISP');
    expect(res.body.serviceStatus).toBe('ACTIVO');
    expect(res.body.canAccessOtt).toBe(true);
    expect(res.body.permissions).toContain('app:playback');
  });

  it('POST /auth/refresh - returns new tokens', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/app/login')
      .send({
        contractNumber: 'CONTRACT-002',
        password: 'password123',
        deviceId: 'test-device-003',
      });

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: loginRes.body.refreshToken })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.canAccessOtt).toBe(true);
  });

  it('POST /auth/otp/request - sends OTP', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ contractNumber: 'CONTRACT-001' })
      .expect(200);

    expect(res.body.message).toContain('OTP');
  });

  it('POST /auth/otp/verify - verifies OTP', async () => {
    // Request OTP first
    await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ contractNumber: 'CONTRACT-001' })
      .expect(200);

    // Verify with mock code 123456
    const res = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ contractNumber: 'CONTRACT-001', code: '123456' })
      .expect(200);

    expect(res.body.verified).toBe(true);
  });

  it('POST /auth/app/login - validation error for missing fields', () => {
    return request(app.getHttpServer())
      .post('/auth/app/login')
      .send({})
      .expect(400);
  });
});
