import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../../../shared/infrastructure/database/base.repository';
import {
  WRITE_DATA_SOURCE,
  READ_DATA_SOURCE,
} from '../../../../shared/infrastructure/database/tokens';
import type { ITaskReadRepository } from '../../domain/repositories/i-task-read.repository';
import { Task } from '../../domain/entities/task.aggregate';
import { TaskId } from '../../domain/value-objects/task-id.vo';
import { TaskOrmEntity } from './entities/task.orm-entity';
import { TaskMapper } from './task.mapper';

/**
 * Read-side infrastructure repository for the tasks bounded context.
 *
 * Implements ITaskReadRepository via READ_DATA_SOURCE exclusively (design D3).
 * No manager parameter — reads outside a write transaction always go through
 * the read DataSource. Command handlers must NOT inject this class.
 */
@Injectable()
export class TaskReadRepository
  extends BaseRepository<TaskOrmEntity>
  implements ITaskReadRepository
{
  protected readonly entity = TaskOrmEntity;

  constructor(
    @Inject(WRITE_DATA_SOURCE) writeDs: DataSource,
    @Inject(READ_DATA_SOURCE) readDs: DataSource,
    private readonly mapper: TaskMapper,
  ) {
    super(writeDs, readDs);
  }

  async findById(id: TaskId): Promise<Task | null> {
    // Always use readRepo() — READ_DATA_SOURCE, no manager (design D3).
    const ormEntity = await this.readRepo().findOne({
      where: { id: id.value },
    });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }
}
