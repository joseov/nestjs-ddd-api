import type { FactoryProvider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WRITE_DATA_SOURCE } from './tokens';
import { DATABASE_POOLS, type DatabasePools } from './database-pools.provider';

/**
 * Sync factory provider for WRITE_DATA_SOURCE.
 * DataSource initialisation is handled atomically by the DATABASE_POOLS
 * provider (see database-pools.provider.ts — CRITICAL A fix).
 */
export const writeDataSourceProvider: FactoryProvider<DataSource> = {
  provide: WRITE_DATA_SOURCE,
  useFactory: (pools: DatabasePools): DataSource => pools.write,
  inject: [DATABASE_POOLS],
};
