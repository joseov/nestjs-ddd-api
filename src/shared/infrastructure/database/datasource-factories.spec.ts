/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

jest.mock('typeorm', () => ({
  DataSource: jest.fn(),
}));

import { buildWriteDataSource } from './write-datasource.factory';
import { buildReadDataSource } from './read-datasource.factory';

const MockDataSource = DataSource as jest.MockedClass<typeof DataSource>;

function makeConfigService(
  vars: Record<string, string | number>,
): ConfigService {
  return {
    getOrThrow: jest.fn().mockImplementation((key: string) => vars[key]),
  } as unknown as ConfigService;
}

// ---------------------------------------------------------------------------
// write factory
// ---------------------------------------------------------------------------

describe('buildWriteDataSource', () => {
  const mockInitialize = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    MockDataSource.mockImplementation(
      () => ({ initialize: mockInitialize }) as unknown as DataSource,
    );
    mockInitialize.mockResolvedValue(undefined);
  });

  it('constructs DataSource with write host, port, username, password, database', async () => {
    const cs = makeConfigService({
      DB_WRITE_HOST: 'write-host',
      DB_WRITE_PORT: 5432,
      DB_WRITE_USERNAME: 'wuser',
      DB_WRITE_PASSWORD: 'wpass',
      DB_WRITE_DATABASE: 'writedb',
      DB_WRITE_POOL_SIZE: 10,
    });

    await buildWriteDataSource(cs);

    expect(MockDataSource).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'write-host',
        port: 5432,
        username: 'wuser',
        password: 'wpass',
        database: 'writedb',
      }),
    );
  });

  it('always sets synchronize:false', async () => {
    const cs = makeConfigService({
      DB_WRITE_HOST: 'h',
      DB_WRITE_PORT: 5432,
      DB_WRITE_USERNAME: 'u',
      DB_WRITE_PASSWORD: 'p',
      DB_WRITE_DATABASE: 'db',
      DB_WRITE_POOL_SIZE: 5,
    });

    await buildWriteDataSource(cs);

    expect(MockDataSource).toHaveBeenCalledWith(
      expect.objectContaining({ synchronize: false }),
    );
  });

  it('registers entities as an explicit array (no glob strings)', async () => {
    const cs = makeConfigService({
      DB_WRITE_HOST: 'h',
      DB_WRITE_PORT: 5432,
      DB_WRITE_USERNAME: 'u',
      DB_WRITE_PASSWORD: 'p',
      DB_WRITE_DATABASE: 'db',
      DB_WRITE_POOL_SIZE: 5,
    });

    await buildWriteDataSource(cs);

    expect(MockDataSource).toHaveBeenCalledWith(
      expect.objectContaining({ entities: expect.any(Array) }),
    );
  });

  it('passes pool size via extra.max', async () => {
    const cs = makeConfigService({
      DB_WRITE_HOST: 'h',
      DB_WRITE_PORT: 5432,
      DB_WRITE_USERNAME: 'u',
      DB_WRITE_PASSWORD: 'p',
      DB_WRITE_DATABASE: 'db',
      DB_WRITE_POOL_SIZE: 20,
    });

    await buildWriteDataSource(cs);

    expect(MockDataSource).toHaveBeenCalledWith(
      expect.objectContaining({
        extra: expect.objectContaining({ max: 20 }),
      }),
    );
  });

  it('calls initialize() and returns the DataSource instance', async () => {
    const cs = makeConfigService({
      DB_WRITE_HOST: 'h',
      DB_WRITE_PORT: 5432,
      DB_WRITE_USERNAME: 'u',
      DB_WRITE_PASSWORD: 'p',
      DB_WRITE_DATABASE: 'db',
      DB_WRITE_POOL_SIZE: 5,
    });

    const ds = await buildWriteDataSource(cs);

    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(ds).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// read factory
// ---------------------------------------------------------------------------

describe('buildReadDataSource', () => {
  const mockInitialize = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    MockDataSource.mockImplementation(
      () => ({ initialize: mockInitialize }) as unknown as DataSource,
    );
    mockInitialize.mockResolvedValue(undefined);
  });

  it('constructs DataSource with read host, port, username, password, database', async () => {
    const cs = makeConfigService({
      DB_READ_HOST: 'read-host',
      DB_READ_PORT: 5433,
      DB_READ_USERNAME: 'ruser',
      DB_READ_PASSWORD: 'rpass',
      DB_READ_DATABASE: 'readdb',
      DB_READ_POOL_SIZE: 5,
    });

    await buildReadDataSource(cs);

    expect(MockDataSource).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'read-host',
        port: 5433,
        username: 'ruser',
        password: 'rpass',
        database: 'readdb',
      }),
    );
  });

  it('always sets synchronize:false and entities as an explicit array', async () => {
    const cs = makeConfigService({
      DB_READ_HOST: 'rh',
      DB_READ_PORT: 5433,
      DB_READ_USERNAME: 'ru',
      DB_READ_PASSWORD: 'rp',
      DB_READ_DATABASE: 'rdb',
      DB_READ_POOL_SIZE: 5,
    });

    await buildReadDataSource(cs);

    expect(MockDataSource).toHaveBeenCalledWith(
      expect.objectContaining({
        synchronize: false,
        entities: expect.any(Array),
      }),
    );
  });

  it('calls initialize() and returns the DataSource instance', async () => {
    const cs = makeConfigService({
      DB_READ_HOST: 'rh',
      DB_READ_PORT: 5433,
      DB_READ_USERNAME: 'ru',
      DB_READ_PASSWORD: 'rp',
      DB_READ_DATABASE: 'rdb',
      DB_READ_POOL_SIZE: 5,
    });

    const ds = await buildReadDataSource(cs);

    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(ds).not.toBeNull();
  });
});
