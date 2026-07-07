import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

jest.mock('typeorm', () => ({
  DataSource: jest.fn(),
  // TypeORM class decorators — must be callable so that ORM entities imported
  // transitively (e.g. via database-pools.provider) do not throw at module load.
  Entity: () => () => undefined,
  PrimaryColumn: () => () => undefined,
  Column: () => () => undefined,
}));

import { buildDatabasePools } from './database-pools.provider';

const MockDataSource = DataSource as jest.MockedClass<typeof DataSource>;

const BASE_VARS: Record<string, string | number> = {
  DB_WRITE_HOST: 'wh',
  DB_WRITE_PORT: 5432,
  DB_WRITE_USERNAME: 'wu',
  DB_WRITE_PASSWORD: 'wp',
  DB_WRITE_DATABASE: 'wdb',
  DB_WRITE_POOL_SIZE: 10,
  DB_READ_HOST: 'rh',
  DB_READ_PORT: 5433,
  DB_READ_USERNAME: 'ru',
  DB_READ_PASSWORD: 'rp',
  DB_READ_DATABASE: 'rdb',
  DB_READ_POOL_SIZE: 5,
};

function makeConfigService(
  vars: Record<string, string | number | undefined>,
): ConfigService {
  return {
    getOrThrow: jest
      .fn()
      .mockImplementation(
        (key: string) => (vars as Record<string, unknown>)[key],
      ),
    get: jest
      .fn()
      .mockImplementation(
        (key: string) => (vars as Record<string, unknown>)[key] ?? undefined,
      ),
  } as unknown as ConfigService;
}

describe('buildDatabasePools', () => {
  let writeInitialize: jest.Mock;
  let readInitialize: jest.Mock;
  let writeDestroy: jest.Mock;
  let readDestroy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    writeInitialize = jest.fn().mockResolvedValue(undefined);
    readInitialize = jest.fn().mockResolvedValue(undefined);
    writeDestroy = jest.fn().mockResolvedValue(undefined);
    readDestroy = jest.fn().mockResolvedValue(undefined);

    let callCount = 0;
    MockDataSource.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return {
          initialize: writeInitialize,
          destroy: writeDestroy,
        } as unknown as DataSource;
      }
      return {
        initialize: readInitialize,
        destroy: readDestroy,
      } as unknown as DataSource;
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CRITICAL A — atomic pool creation: write init failure
  // ─────────────────────────────────────────────────────────────────────────

  it('rejects with a labeled error when write DataSource initialize fails', async () => {
    writeInitialize.mockRejectedValue(new Error('ECONNREFUSED write'));

    await expect(
      buildDatabasePools(makeConfigService(BASE_VARS)),
    ).rejects.toThrow(
      'Failed to initialize WRITE_DATA_SOURCE: ECONNREFUSED write',
    );
  });

  it('does NOT call read initialize when write initialize fails', async () => {
    writeInitialize.mockRejectedValue(new Error('write auth error'));

    await expect(
      buildDatabasePools(makeConfigService(BASE_VARS)),
    ).rejects.toThrow('WRITE_DATA_SOURCE');

    expect(readInitialize).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CRITICAL A — atomic pool creation: read init failure cleans up write
  // ─────────────────────────────────────────────────────────────────────────

  it('destroys the write DataSource when read DataSource initialize fails', async () => {
    readInitialize.mockRejectedValue(new Error('ECONNREFUSED read'));

    await expect(
      buildDatabasePools(makeConfigService(BASE_VARS)),
    ).rejects.toBeDefined();

    expect(writeDestroy).toHaveBeenCalledTimes(1);
  });

  it('rejects with a labeled error when read DataSource initialize fails', async () => {
    readInitialize.mockRejectedValue(new Error('conn timeout'));

    await expect(
      buildDatabasePools(makeConfigService(BASE_VARS)),
    ).rejects.toThrow('Failed to initialize READ_DATA_SOURCE: conn timeout');
  });

  it('still rejects with the labeled READ error when the write cleanup destroy also fails', async () => {
    readInitialize.mockRejectedValue(new Error('ECONNREFUSED read'));
    writeDestroy.mockRejectedValue(new Error('destroy blew up'));

    await expect(
      buildDatabasePools(makeConfigService(BASE_VARS)),
    ).rejects.toThrow(
      'Failed to initialize READ_DATA_SOURCE: ECONNREFUSED read',
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CRITICAL C — per-factory initialize rejection test
  // ─────────────────────────────────────────────────────────────────────────

  it('write initialize rejects → error message identifies WRITE_DATA_SOURCE', async () => {
    writeInitialize.mockRejectedValue(new Error('bad password'));

    let caughtMsg = '';
    try {
      await buildDatabasePools(makeConfigService(BASE_VARS));
    } catch (err) {
      caughtMsg = (err as Error).message;
    }

    expect(caughtMsg).toContain('WRITE_DATA_SOURCE');
    expect(caughtMsg).toContain('bad password');
  });

  it('read initialize rejects → error message identifies READ_DATA_SOURCE', async () => {
    readInitialize.mockRejectedValue(new Error('no route to host'));

    let caughtMsg = '';
    try {
      await buildDatabasePools(makeConfigService(BASE_VARS));
    } catch (err) {
      caughtMsg = (err as Error).message;
    }

    expect(caughtMsg).toContain('READ_DATA_SOURCE');
    expect(caughtMsg).toContain('no route to host');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // MINOR E — entities must be a function array, never glob strings
  // ─────────────────────────────────────────────────────────────────────────

  it('registers entities as an array where every element is a constructor function (no glob strings)', async () => {
    await buildDatabasePools(makeConfigService(BASE_VARS));

    for (const call of MockDataSource.mock.calls) {
      const options = call[0] as { entities: unknown[] };
      expect(Array.isArray(options.entities)).toBe(true);
      // Every element must be a constructor function, not a string/glob pattern
      expect(options.entities.every((el) => typeof el === 'function')).toBe(
        true,
      );
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // MAJOR D — connectionTimeoutMillis defaults (connect ≥1, idle ≥0)
  // ─────────────────────────────────────────────────────────────────────────

  it('sets write connectionTimeoutMillis to 5000 when DB_WRITE_CONNECT_TIMEOUT_MS is absent', async () => {
    await buildDatabasePools(makeConfigService(BASE_VARS));

    const writeOptions = MockDataSource.mock.calls[0][0] as {
      extra: Record<string, unknown>;
    };
    expect(writeOptions.extra.connectionTimeoutMillis).toBe(5000);
  });

  it('sets write idleTimeoutMillis to 30000 when DB_WRITE_IDLE_TIMEOUT_MS is absent', async () => {
    await buildDatabasePools(makeConfigService(BASE_VARS));

    const writeOptions = MockDataSource.mock.calls[0][0] as {
      extra: Record<string, unknown>;
    };
    expect(writeOptions.extra.idleTimeoutMillis).toBe(30000);
  });

  it('sets read connectionTimeoutMillis to 5000 when DB_READ_CONNECT_TIMEOUT_MS is absent', async () => {
    await buildDatabasePools(makeConfigService(BASE_VARS));

    const readOptions = MockDataSource.mock.calls[1][0] as {
      extra: Record<string, unknown>;
    };
    expect(readOptions.extra.connectionTimeoutMillis).toBe(5000);
  });

  it('sets read idleTimeoutMillis to 30000 when DB_READ_IDLE_TIMEOUT_MS is absent', async () => {
    await buildDatabasePools(makeConfigService(BASE_VARS));

    const readOptions = MockDataSource.mock.calls[1][0] as {
      extra: Record<string, unknown>;
    };
    expect(readOptions.extra.idleTimeoutMillis).toBe(30000);
  });

  it('uses the provided DB_WRITE_CONNECT_TIMEOUT_MS value', async () => {
    const vars = { ...BASE_VARS, DB_WRITE_CONNECT_TIMEOUT_MS: 3000 };
    await buildDatabasePools(makeConfigService(vars));

    const writeOptions = MockDataSource.mock.calls[0][0] as {
      extra: Record<string, unknown>;
    };
    expect(writeOptions.extra.connectionTimeoutMillis).toBe(3000);
  });

  it('uses the provided DB_WRITE_IDLE_TIMEOUT_MS value', async () => {
    const vars = { ...BASE_VARS, DB_WRITE_IDLE_TIMEOUT_MS: 60000 };
    await buildDatabasePools(makeConfigService(vars));

    const writeOptions = MockDataSource.mock.calls[0][0] as {
      extra: Record<string, unknown>;
    };
    expect(writeOptions.extra.idleTimeoutMillis).toBe(60000);
  });

  it('uses the provided DB_READ_CONNECT_TIMEOUT_MS value', async () => {
    const vars = { ...BASE_VARS, DB_READ_CONNECT_TIMEOUT_MS: 2000 };
    await buildDatabasePools(makeConfigService(vars));

    const readOptions = MockDataSource.mock.calls[1][0] as {
      extra: Record<string, unknown>;
    };
    expect(readOptions.extra.connectionTimeoutMillis).toBe(2000);
  });

  it('accepts DB_READ_IDLE_TIMEOUT_MS=0 (0 disables idle timeout, boundary is valid)', async () => {
    const vars = { ...BASE_VARS, DB_READ_IDLE_TIMEOUT_MS: 0 };
    await buildDatabasePools(makeConfigService(vars));

    const readOptions = MockDataSource.mock.calls[1][0] as {
      extra: Record<string, unknown>;
    };
    expect(readOptions.extra.idleTimeoutMillis).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Happy path
  // ─────────────────────────────────────────────────────────────────────────

  it('returns both write and read DataSources on success', async () => {
    const pools = await buildDatabasePools(makeConfigService(BASE_VARS));

    expect(pools.write).toBeDefined();
    expect(pools.read).toBeDefined();
  });

  it('initializes both DataSources', async () => {
    await buildDatabasePools(makeConfigService(BASE_VARS));

    expect(writeInitialize).toHaveBeenCalledTimes(1);
    expect(readInitialize).toHaveBeenCalledTimes(1);
  });

  it('always sets synchronize:false on both DataSources', async () => {
    await buildDatabasePools(makeConfigService(BASE_VARS));

    for (const call of MockDataSource.mock.calls) {
      expect((call[0] as { synchronize: boolean }).synchronize).toBe(false);
    }
  });
});
