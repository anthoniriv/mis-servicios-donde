import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';

const databaseUrl = process.env.DATABASE_URL ??
  'postgresql://mis_servicios:mis_servicios@127.0.0.1:54329/mis_servicios_test';

describe('executable API foundation', () => {
  let app: INestApplication;
  let database: pg.Pool;

  beforeAll(async () => {
    database = new pg.Pool({ connectionString: databaseUrl });
    await database.query('CREATE TABLE IF NOT EXISTS fixture_probe (id integer PRIMARY KEY)');
    await database.query('TRUNCATE fixture_probe');

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await database?.end();
  });

  it('serves health through Supertest', async () => {
    // Nest intentionally exposes the underlying adapter without a concrete server type.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.text).toBe('{"status":"ok"}');
  });

  it('uses a real PostgreSQL fixture', async () => {
    await database.query('INSERT INTO fixture_probe (id) VALUES (1)');
    const result = await database.query<{ count: string }>('SELECT COUNT(*) AS count FROM fixture_probe');
    expect(result.rows[0]?.count).toBe('1');
  });
});
