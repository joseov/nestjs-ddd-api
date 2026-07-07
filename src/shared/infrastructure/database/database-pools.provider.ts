import type { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { TaskOrmEntity } from '../../../modules/tasks/infrastructure/persistence/entities/task.orm-entity';

/**
 * Internal DI token for the atomic pool object that holds both DataSources.
 * Not exported as a public API — consumers inject WRITE_DATA_SOURCE /
 * READ_DATA_SOURCE directly (design D2). The internal token ensures that both
 * DataSources are initialised inside a single try/catch so a read-DS failure
 * cannot leave a write-DS connection pool open (CRITICAL A fix).
 */
export const DATABASE_POOLS = Symbol('DATABASE_POOLS');

export interface DatabasePools {
  readonly write: DataSource;
  readonly read: DataSource;
}

/**
 * Initialises both DataSources atomically.
 *
 * Error handling contract:
 *  - If write DS initialize() fails → rethrow with label "Failed to initialize
 *    WRITE_DATA_SOURCE: <original message>". Nothing to clean up.
 *  - If read DS initialize() fails → destroy the already-initialised write DS
 *    to prevent pool leak, then rethrow with label "Failed to initialize
 *    READ_DATA_SOURCE: <original message>".
 *
 * Timeout defaults (pg pool options):
 *  - connectionTimeoutMillis: DB_{WRITE|READ}_CONNECT_TIMEOUT_MS  (default 5000 ms)
 *  - idleTimeoutMillis:       DB_{WRITE|READ}_IDLE_TIMEOUT_MS     (default 30000 ms)
 *    idle=0 is allowed (disables idle timeout); connect=0 would mean infinite wait,
 *    which is why @Min(1) is enforced on the env-var validator.
 */
export async function buildDatabasePools(
  configService: ConfigService,
): Promise<DatabasePools> {
  // ── Write DataSource ────────────────────────────────────────────────────
  const writeDs = new DataSource({
    type: 'postgres',
    host: configService.getOrThrow<string>('DB_WRITE_HOST'),
    port: configService.getOrThrow<number>('DB_WRITE_PORT'),
    username: configService.getOrThrow<string>('DB_WRITE_USERNAME'),
    password: configService.getOrThrow<string>('DB_WRITE_PASSWORD'),
    database: configService.getOrThrow<string>('DB_WRITE_DATABASE'),
    extra: {
      max: configService.getOrThrow<number>('DB_WRITE_POOL_SIZE'),
      connectionTimeoutMillis:
        configService.get<number>('DB_WRITE_CONNECT_TIMEOUT_MS') ?? 5000,
      idleTimeoutMillis:
        configService.get<number>('DB_WRITE_IDLE_TIMEOUT_MS') ?? 30000,
    },
    entities: [TaskOrmEntity],
    synchronize: false,
  });

  try {
    await writeDs.initialize();
  } catch (err) {
    throw new Error(
      `Failed to initialize WRITE_DATA_SOURCE: ${(err as Error).message}`,
      { cause: err },
    );
  }

  // ── Read DataSource — clean up write pool on failure ───────────────────
  const readDs = new DataSource({
    type: 'postgres',
    host: configService.getOrThrow<string>('DB_READ_HOST'),
    port: configService.getOrThrow<number>('DB_READ_PORT'),
    username: configService.getOrThrow<string>('DB_READ_USERNAME'),
    password: configService.getOrThrow<string>('DB_READ_PASSWORD'),
    database: configService.getOrThrow<string>('DB_READ_DATABASE'),
    extra: {
      max: configService.getOrThrow<number>('DB_READ_POOL_SIZE'),
      connectionTimeoutMillis:
        configService.get<number>('DB_READ_CONNECT_TIMEOUT_MS') ?? 5000,
      idleTimeoutMillis:
        configService.get<number>('DB_READ_IDLE_TIMEOUT_MS') ?? 30000,
    },
    entities: [TaskOrmEntity],
    synchronize: false,
  });

  try {
    await readDs.initialize();
  } catch (err) {
    // Best-effort cleanup: a failing destroy must not mask the init error,
    // which is the actionable root cause for whoever reads the boot logs
    try {
      await writeDs.destroy();
    } catch {
      // swallowed intentionally — the labeled init error below wins
    }
    throw new Error(
      `Failed to initialize READ_DATA_SOURCE: ${(err as Error).message}`,
      { cause: err },
    );
  }

  return { write: writeDs, read: readDs };
}

export const databasePoolsProvider: FactoryProvider<DatabasePools> = {
  provide: DATABASE_POOLS,
  useFactory: buildDatabasePools,
  inject: [ConfigService],
};
