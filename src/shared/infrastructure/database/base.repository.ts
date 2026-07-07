import { Inject } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { WRITE_DATA_SOURCE, READ_DATA_SOURCE } from './tokens';

/**
 * Abstract base for all infrastructure repositories.
 *
 * Safety note (design D3): the read/write split is enforced at the DI port
 * boundary (ITaskWriteRepository / ITaskReadRepository), not here.
 * Both accessors are exposed as infra convenience; concrete subclasses pick the
 * right one depending on which port they implement.
 */
export abstract class BaseRepository<TOrm extends ObjectLiteral> {
  protected abstract readonly entity: EntityTarget<TOrm>;

  constructor(
    @Inject(WRITE_DATA_SOURCE) protected readonly writeDs: DataSource,
    @Inject(READ_DATA_SOURCE) protected readonly readDs: DataSource,
  ) {}

  /**
   * Returns a Repository scoped to the WRITE DataSource.
   * When an EntityManager is supplied (inside a UnitOfWork transaction),
   * uses that manager instead so all operations share the same transaction.
   */
  protected writeRepo(manager?: EntityManager): Repository<TOrm> {
    return (manager ?? this.writeDs.manager).getRepository(this.entity);
  }

  /**
   * Returns a Repository scoped to the READ DataSource.
   * Never call this inside a write transaction (design D3).
   */
  protected readRepo(): Repository<TOrm> {
    return this.readDs.manager.getRepository(this.entity);
  }
}
