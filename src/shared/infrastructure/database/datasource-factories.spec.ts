import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { writeDataSourceProvider } from './write-datasource.factory';
import { readDataSourceProvider } from './read-datasource.factory';
import { WRITE_DATA_SOURCE, READ_DATA_SOURCE } from './tokens';
import { DATABASE_POOLS } from './database-pools.provider';

/**
 * The DataSource-construction details (options, pool size, synchronize,
 * entities, timeout defaults) are covered by database-pools.spec.ts.
 *
 * These tests verify the DI provider contract: that WRITE_DATA_SOURCE and
 * READ_DATA_SOURCE are sync factories injecting DATABASE_POOLS and correctly
 * extracting the relevant DataSource from the pools object.
 */

const fakeWriteDs = { label: 'write' } as unknown as DataSource;
const fakeReadDs = { label: 'read' } as unknown as DataSource;
const fakePools = { write: fakeWriteDs, read: fakeReadDs };

describe('writeDataSourceProvider', () => {
  it('provides the WRITE_DATA_SOURCE token', () => {
    expect(writeDataSourceProvider.provide).toBe(WRITE_DATA_SOURCE);
  });

  it('injects DATABASE_POOLS', () => {
    expect(writeDataSourceProvider.inject).toContain(DATABASE_POOLS);
  });

  it('useFactory returns pools.write', () => {
    const result = writeDataSourceProvider.useFactory(fakePools);
    expect(result).toBe(fakeWriteDs);
  });
});

describe('readDataSourceProvider', () => {
  it('provides the READ_DATA_SOURCE token', () => {
    expect(readDataSourceProvider.provide).toBe(READ_DATA_SOURCE);
  });

  it('injects DATABASE_POOLS', () => {
    expect(readDataSourceProvider.inject).toContain(DATABASE_POOLS);
  });

  it('useFactory returns pools.read', () => {
    const result = readDataSourceProvider.useFactory(fakePools);
    expect(result).toBe(fakeReadDs);
  });
});
