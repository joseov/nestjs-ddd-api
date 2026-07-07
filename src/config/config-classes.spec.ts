import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AppConfig } from './app.config';
import appConfigFactory from './app.config';
import { DatabaseWriteConfig } from './database-write.config';
import databaseWriteConfigFactory from './database-write.config';
import { DatabaseReadConfig } from './database-read.config';
import databaseReadConfigFactory from './database-read.config';

// ─────────────────────────────────────────────────────────────────────────────
// AppConfig
// ─────────────────────────────────────────────────────────────────────────────

describe('AppConfig', () => {
  it('passes validation with valid values', () => {
    const instance = plainToInstance(AppConfig, {
      nodeEnv: 'production',
      port: 8080,
    });
    expect(validateSync(instance)).toHaveLength(0);
  });

  it('rejects an invalid nodeEnv (not in allowed list)', () => {
    const instance = plainToInstance(AppConfig, {
      nodeEnv: 'staging',
      port: 8080,
    });
    const errors = validateSync(instance);
    expect(errors.some((e) => e.property === 'nodeEnv')).toBe(true);
  });

  it('rejects port=0 (below minimum)', () => {
    const instance = plainToInstance(AppConfig, {
      nodeEnv: 'development',
      port: 0,
    });
    const errors = validateSync(instance);
    expect(errors.some((e) => e.property === 'port')).toBe(true);
  });

  it('rejects port=65536 (above maximum)', () => {
    const instance = plainToInstance(AppConfig, {
      nodeEnv: 'development',
      port: 65536,
    });
    const errors = validateSync(instance);
    expect(errors.some((e) => e.property === 'port')).toBe(true);
  });

  it('accepts port=1 (minimum boundary)', () => {
    const instance = plainToInstance(AppConfig, {
      nodeEnv: 'development',
      port: 1,
    });
    expect(validateSync(instance)).toHaveLength(0);
  });

  it('accepts port=65535 (maximum boundary)', () => {
    const instance = plainToInstance(AppConfig, {
      nodeEnv: 'development',
      port: 65535,
    });
    expect(validateSync(instance)).toHaveLength(0);
  });
});

describe('appConfigFactory (parseInt fallback behavior)', () => {
  let originalPort: string | undefined;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalPort = process.env.PORT;
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    if (originalPort === undefined) delete process.env.PORT;
    else process.env.PORT = originalPort;

    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  });

  it('falls back to port 3000 when PORT is not set', () => {
    delete process.env.PORT;
    const config = appConfigFactory();
    expect(config.port).toBe(3000);
  });

  it('parses PORT from env as integer', () => {
    process.env.PORT = '9000';
    const config = appConfigFactory();
    expect(config.port).toBe(9000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DatabaseWriteConfig
// ─────────────────────────────────────────────────────────────────────────────

describe('DatabaseWriteConfig', () => {
  const validWrite = {
    host: 'db-write',
    port: 5432,
    username: 'user',
    password: 'pass',
    database: 'mydb',
    poolSize: 10,
  };

  it('passes validation with valid values', () => {
    const instance = plainToInstance(DatabaseWriteConfig, validWrite);
    expect(validateSync(instance)).toHaveLength(0);
  });

  it('rejects absent host (undefined)', () => {
    // @IsString passes empty strings; undefined host must be caught as a missing required field
    const instance = plainToInstance(DatabaseWriteConfig, {
      ...validWrite,
      host: undefined,
    });
    const errors = validateSync(instance, { skipMissingProperties: false });
    expect(errors.some((e) => e.property === 'host')).toBe(true);
  });

  it('rejects port=0 (below minimum)', () => {
    const instance = plainToInstance(DatabaseWriteConfig, {
      ...validWrite,
      port: 0,
    });
    const errors = validateSync(instance);
    expect(errors.some((e) => e.property === 'port')).toBe(true);
  });

  it('rejects poolSize=0 (below minimum of 1)', () => {
    const instance = plainToInstance(DatabaseWriteConfig, {
      ...validWrite,
      poolSize: 0,
    });
    const errors = validateSync(instance);
    expect(errors.some((e) => e.property === 'poolSize')).toBe(true);
  });

  // MAJOR D — optional timeout fields
  it('passes validation without optional connectTimeoutMs and idleTimeoutMs', () => {
    const instance = plainToInstance(DatabaseWriteConfig, validWrite);
    expect(validateSync(instance)).toHaveLength(0);
  });

  it('rejects connectTimeoutMs=0 (below minimum of 1)', () => {
    const instance = plainToInstance(DatabaseWriteConfig, {
      ...validWrite,
      connectTimeoutMs: 0,
    });
    const errors = validateSync(instance);
    expect(errors.some((e) => e.property === 'connectTimeoutMs')).toBe(true);
  });

  it('accepts connectTimeoutMs=1 (minimum boundary)', () => {
    const instance = plainToInstance(DatabaseWriteConfig, {
      ...validWrite,
      connectTimeoutMs: 1,
    });
    expect(validateSync(instance)).toHaveLength(0);
  });

  it('accepts idleTimeoutMs=0 (0 disables idle eviction, boundary is valid)', () => {
    const instance = plainToInstance(DatabaseWriteConfig, {
      ...validWrite,
      idleTimeoutMs: 0,
    });
    expect(validateSync(instance)).toHaveLength(0);
  });
});

describe('databaseWriteConfigFactory (parseInt fallback behavior)', () => {
  let savedPort: string | undefined;
  let savedPoolSize: string | undefined;

  beforeEach(() => {
    savedPort = process.env.DB_WRITE_PORT;
    savedPoolSize = process.env.DB_WRITE_POOL_SIZE;
  });

  afterEach(() => {
    if (savedPort === undefined) delete process.env.DB_WRITE_PORT;
    else process.env.DB_WRITE_PORT = savedPort;

    if (savedPoolSize === undefined) delete process.env.DB_WRITE_POOL_SIZE;
    else process.env.DB_WRITE_POOL_SIZE = savedPoolSize;
  });

  it('falls back to port 5432 when DB_WRITE_PORT is not set', () => {
    delete process.env.DB_WRITE_PORT;
    const config = databaseWriteConfigFactory();
    expect(config.port).toBe(5432);
  });

  it('falls back to poolSize 10 when DB_WRITE_POOL_SIZE is not set', () => {
    delete process.env.DB_WRITE_POOL_SIZE;
    const config = databaseWriteConfigFactory();
    expect(config.poolSize).toBe(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DatabaseReadConfig
// ─────────────────────────────────────────────────────────────────────────────

describe('DatabaseReadConfig', () => {
  const validRead = {
    host: 'db-read',
    port: 5433,
    username: 'reader',
    password: 'pass',
    database: 'mydb',
    poolSize: 5,
  };

  it('passes validation with valid values', () => {
    const instance = plainToInstance(DatabaseReadConfig, validRead);
    expect(validateSync(instance)).toHaveLength(0);
  });

  it('rejects port=65536 (above maximum)', () => {
    const instance = plainToInstance(DatabaseReadConfig, {
      ...validRead,
      port: 65536,
    });
    const errors = validateSync(instance);
    expect(errors.some((e) => e.property === 'port')).toBe(true);
  });

  it('rejects poolSize=0 (below minimum of 1)', () => {
    const instance = plainToInstance(DatabaseReadConfig, {
      ...validRead,
      poolSize: 0,
    });
    const errors = validateSync(instance);
    expect(errors.some((e) => e.property === 'poolSize')).toBe(true);
  });

  // MAJOR D — optional timeout fields
  it('passes validation without optional connectTimeoutMs and idleTimeoutMs', () => {
    const instance = plainToInstance(DatabaseReadConfig, validRead);
    expect(validateSync(instance)).toHaveLength(0);
  });

  it('rejects connectTimeoutMs=0 (below minimum of 1)', () => {
    const instance = plainToInstance(DatabaseReadConfig, {
      ...validRead,
      connectTimeoutMs: 0,
    });
    const errors = validateSync(instance);
    expect(errors.some((e) => e.property === 'connectTimeoutMs')).toBe(true);
  });

  it('accepts idleTimeoutMs=0 (boundary is valid)', () => {
    const instance = plainToInstance(DatabaseReadConfig, {
      ...validRead,
      idleTimeoutMs: 0,
    });
    expect(validateSync(instance)).toHaveLength(0);
  });
});

describe('databaseReadConfigFactory (parseInt fallback behavior)', () => {
  let savedPort: string | undefined;
  let savedPoolSize: string | undefined;

  beforeEach(() => {
    savedPort = process.env.DB_READ_PORT;
    savedPoolSize = process.env.DB_READ_POOL_SIZE;
  });

  afterEach(() => {
    if (savedPort === undefined) delete process.env.DB_READ_PORT;
    else process.env.DB_READ_PORT = savedPort;

    if (savedPoolSize === undefined) delete process.env.DB_READ_POOL_SIZE;
    else process.env.DB_READ_POOL_SIZE = savedPoolSize;
  });

  it('falls back to port 5432 when DB_READ_PORT is not set', () => {
    delete process.env.DB_READ_PORT;
    const config = databaseReadConfigFactory();
    expect(config.port).toBe(5432);
  });

  it('falls back to poolSize 5 when DB_READ_POOL_SIZE is not set', () => {
    delete process.env.DB_READ_POOL_SIZE;
    const config = databaseReadConfigFactory();
    expect(config.poolSize).toBe(5);
  });
});
