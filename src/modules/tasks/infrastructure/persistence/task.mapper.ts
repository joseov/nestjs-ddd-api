import { Injectable } from '@nestjs/common';
import type { Mapper } from '../../../../shared/domain';
import { Task } from '../../domain/entities/task.aggregate';
import { TaskId } from '../../domain/value-objects/task-id.vo';
import {
  TaskStatus,
  TaskStatusValue,
} from '../../domain/value-objects/task-status.vo';
import { TaskOrmEntity } from './entities/task.orm-entity';

/**
 * Bridges the Task aggregate (domain) and TaskOrmEntity (infrastructure).
 *
 * toDomain uses Task.reconstitute — rehydration must NOT emit domain events.
 * toOrm maps aggregate value objects to plain column values.
 */
@Injectable()
export class TaskMapper implements Mapper<Task, TaskOrmEntity> {
  toDomain(orm: TaskOrmEntity): Task {
    const id = new TaskId(orm.id);
    const status = TaskMapper.statusFromValue(orm.status);
    // reconstitute: no domain events (design: rehydration trusts persisted state)
    return Task.reconstitute(id, orm.title, status);
  }

  toOrm(task: Task): TaskOrmEntity {
    const entity = new TaskOrmEntity();
    entity.id = task.id.value;
    entity.title = task.title;
    entity.status = task.status.value;
    return entity;
  }

  /**
   * Converts the persisted status string back to a TaskStatus value object.
   * Throws if the stored value is not a known TaskStatusValue — protects against
   * data corruption or schema drift introducing an unrecognised string.
   */
  private static statusFromValue(value: string): TaskStatus {
    switch (value as TaskStatusValue) {
      case 'PENDING':
        return TaskStatus.pending();
      case 'IN_PROGRESS':
        return TaskStatus.inProgress();
      case 'DONE':
        return TaskStatus.done();
      default:
        throw new Error(`Unknown TaskStatus value: "${value}"`);
    }
  }
}
