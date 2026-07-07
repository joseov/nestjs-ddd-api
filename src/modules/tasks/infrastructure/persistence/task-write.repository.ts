import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { BaseRepository } from '../../../../shared/infrastructure/database/base.repository';
import {
  WRITE_DATA_SOURCE,
  READ_DATA_SOURCE,
} from '../../../../shared/infrastructure/database/tokens';
import type { ITaskWriteRepository } from '../../domain/repositories/i-task-write.repository';
import { Task } from '../../domain/entities/task.aggregate';
import { TaskId } from '../../domain/value-objects/task-id.vo';
import { TaskOrmEntity } from './entities/task.orm-entity';
import { TaskMapper } from './task.mapper';

/**
 * Write-side infrastructure repository for the tasks bounded context.
 *
 * Implements ITaskWriteRepository via WRITE_DATA_SOURCE exclusively (design D3).
 * The `manager` parameter on both methods is typed as `unknown` in the domain
 * port (keeping the domain ORM-free); this class casts it to EntityManager at
 * the infrastructure boundary — the only place TypeORM types are permitted.
 *
 * save(task, manager?)   — persists via writeRepo(manager as EntityManager)
 * findById(id, manager)  — queries via the PASSED manager (transactional-read path)
 */
@Injectable()
export class TaskWriteRepository
  extends BaseRepository<TaskOrmEntity>
  implements ITaskWriteRepository
{
  protected readonly entity = TaskOrmEntity;

  constructor(
    @Inject(WRITE_DATA_SOURCE) writeDs: DataSource,
    @Inject(READ_DATA_SOURCE) readDs: DataSource,
    private readonly mapper: TaskMapper,
  ) {
    super(writeDs, readDs);
  }

  async save(task: Task, manager?: unknown): Promise<void> {
    const ormEntity = this.mapper.toOrm(task);
    await this.writeRepo(manager as EntityManager | undefined).save(ormEntity);
  }

  async findById(id: TaskId, manager: unknown): Promise<Task | null> {
    // Use the passed manager — this is the only transactional-read path.
    // readRepo() must never be called here (design D3).
    const ormEntity = await this.writeRepo(manager as EntityManager).findOne({
      where: { id: id.value },
    });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }
}
