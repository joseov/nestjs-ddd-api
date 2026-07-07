import type { FactoryProvider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { READ_DATA_SOURCE } from './tokens';
import { DATABASE_POOLS, type DatabasePools } from './database-pools.provider';

/**
 * Sync factory provider for READ_DATA_SOURCE.
 * DataSource initialisation is handled atomically by the DATABASE_POOLS
 * provider (see database-pools.provider.ts — CRITICAL A fix).
 */
export const readDataSourceProvider: FactoryProvider<DataSource> = {
  provide: READ_DATA_SOURCE,
  useFactory: (pools: DatabasePools): DataSource => pools.read,
  inject: [DATABASE_POOLS],
};
