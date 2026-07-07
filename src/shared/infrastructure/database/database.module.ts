import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WRITE_DATA_SOURCE, READ_DATA_SOURCE } from './tokens';
import { writeDataSourceProvider } from './write-datasource.factory';
import { readDataSourceProvider } from './read-datasource.factory';

/**
 * Global NestJS module that initialises both DataSources and exposes their
 * DI tokens to the entire application without requiring an explicit import
 * in every bounded-context module (design D2, spec: config-validation/
 * Global DatabaseModule).
 *
 * Implements OnModuleDestroy so that SIGTERM/enableShutdownHooks() cleanly
 * tears both connections down before the process exits (design D2).
 */
@Global()
@Module({
  providers: [writeDataSourceProvider, readDataSourceProvider],
  exports: [WRITE_DATA_SOURCE, READ_DATA_SOURCE],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(
    @Inject(WRITE_DATA_SOURCE) private readonly writeDs: DataSource,
    @Inject(READ_DATA_SOURCE) private readonly readDs: DataSource,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.writeDs.destroy();
    await this.readDs.destroy();
  }
}
