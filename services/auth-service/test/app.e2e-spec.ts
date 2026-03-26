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

  it('POST /auth/app/login - success', async () => {
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
  });

  it('GET /auth/me - requires authentication', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('GET /auth/me - returns user profile', async () => {
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
  });

  it('POST /auth/app/login - validation error for missing fields', () => {
    return request(app.getHttpServer())
      .post('/auth/app/login')
      .send({})
      .expect(400);
  });
});
