import { Injectable, Inject } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { WRITE_DATA_SOURCE } from './tokens';

export interface TransactionContext {
  readonly manager: EntityManager;
}

@Injectable()
export class UnitOfWork {
  constructor(
    @Inject(WRITE_DATA_SOURCE) private readonly writeDs: DataSource,
  ) {}

  /**
   * Runs work inside a database transaction on the WRITE DataSource.
   * Rethrows any rejection from the callback — does NOT swallow errors.
   * Callers should drain aggregate.pullDomainEvents() and publish AFTER this
   * resolves (drain-after-commit contract, design D5).
   */
  runInTransaction<T>(
    work: (ctx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.writeDs.transaction((manager) => work({ manager }));
  }
}
