import { validateEnv } from './env.validation';

const validEnv: Record<string, string> = {
  NODE_ENV: 'development',
  PORT: '3000',
  DB_WRITE_HOST: 'localhost',
  DB_WRITE_PORT: '5432',
  DB_WRITE_USERNAME: 'postgres',
  DB_WRITE_PASSWORD: 'secret',
  DB_WRITE_DATABASE: 'app_write',
  DB_WRITE_POOL_SIZE: '10',
  DB_READ_HOST: 'localhost',
  DB_READ_PORT: '5433',
  DB_READ_USERNAME: 'postgres',
  DB_READ_PASSWORD: 'secret',
  DB_READ_DATABASE: 'app_read',
  DB_READ_POOL_SIZE: '5',
};

describe('validateEnv', () => {
  it('should return a validated EnvironmentVariables instance when all required vars are present and valid', () => {
    const result = validateEnv({ ...validEnv });
    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe('development');
    expect(result.DB_WRITE_PORT).toBe(5432);
    expect(result.DB_READ_PORT).toBe(5433);
    expect(result.DB_WRITE_POOL_SIZE).toBe(10);
    expect(result.DB_READ_POOL_SIZE).toBe(5);
  });

  it('should throw when a required env var is missing', () => {
    const incomplete = { ...validEnv };
    delete incomplete.PORT;

    expect(() => validateEnv(incomplete)).toThrow();
  });

  it('should throw when PORT is a non-numeric string', () => {
    const invalid = { ...validEnv, PORT: 'abc' };

    expect(() => validateEnv(invalid)).toThrow(/PORT/);
  });

  it('should throw when PORT is out of the valid range', () => {
    const invalid = { ...validEnv, PORT: '99999' };

    expect(() => validateEnv(invalid)).toThrow(/PORT/);
  });

  it('should throw when NODE_ENV is an unsupported value', () => {
    const invalid = { ...validEnv, NODE_ENV: 'staging' };

    expect(() => validateEnv(invalid)).toThrow(/NODE_ENV/);
  });

  it('should list each failing constraint in the error message', () => {
    const invalid = { ...validEnv, PORT: 'abc', NODE_ENV: 'staging' };

    let errorMessage = '';
    try {
      validateEnv(invalid);
    } catch (err: unknown) {
      errorMessage = (err as Error).message;
    }

    expect(errorMessage).toContain('PORT');
    expect(errorMessage).toContain('NODE_ENV');
  });

  it('should throw when DB_WRITE_POOL_SIZE is a non-numeric string', () => {
    const invalid = { ...validEnv, DB_WRITE_POOL_SIZE: 'many' };

    expect(() => validateEnv(invalid)).toThrow(/DB_WRITE_POOL_SIZE/);
  });

  // MAJOR 3 — missing-var coverage for DB_WRITE_* and DB_READ_* groups
  it('should throw and name DB_WRITE_HOST when that variable is absent', () => {
    const incomplete = { ...validEnv };
    delete incomplete.DB_WRITE_HOST;

    expect(() => validateEnv(incomplete)).toThrow(/DB_WRITE_HOST/);
  });

  it('should throw and name DB_READ_DATABASE when that variable is absent', () => {
    const incomplete = { ...validEnv };
    delete incomplete.DB_READ_DATABASE;

    expect(() => validateEnv(incomplete)).toThrow(/DB_READ_DATABASE/);
  });

  // MAJOR 4 — port boundary tests (parameterized)
  it('should reject PORT=0 (below minimum of 1)', () => {
    expect(() => validateEnv({ ...validEnv, PORT: '0' })).toThrow(/PORT/);
  });

  it('should accept PORT=1 (minimum boundary)', () => {
    expect(() => validateEnv({ ...validEnv, PORT: '1' })).not.toThrow();
  });

  it('should accept PORT=65535 (maximum boundary)', () => {
    expect(() => validateEnv({ ...validEnv, PORT: '65535' })).not.toThrow();
  });

  it('should reject PORT=65536 (above maximum of 65535)', () => {
    expect(() => validateEnv({ ...validEnv, PORT: '65536' })).toThrow(/PORT/);
  });
});
