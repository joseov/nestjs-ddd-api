import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';

import { GetTaskByIdQuery } from './get-task-by-id.query';
import { TaskReadModel } from './task.read-model';
import type { ITaskReadRepository } from '../../../domain/repositories/i-task-read.repository';
import { TASK_READ_REPOSITORY } from '../../../domain/task-repository.tokens';
import { TaskId } from '../../../domain/value-objects/task-id.vo';

/**
 * Handles the GetTaskByIdQuery.
 *
 * Injected ports:
 *   - TASK_READ_REPOSITORY — read side only; no write port injected.
 *
 * Design decision (not-found behaviour): returns null when no task matches
 * the requested ID. The presentation layer decides the HTTP response code
 * (typically 404 Not Found). Throwing an application exception here would
 * couple the handler to HTTP semantics.
 *
 * Read-model (TaskReadModel): a plain DTO with { id, title, status } — not
 * the domain aggregate — so the caller is never coupled to the domain model.
 */
@QueryHandler(GetTaskByIdQuery)
export class GetTaskByIdHandler implements IQueryHandler<
  GetTaskByIdQuery,
  TaskReadModel | null
> {
  constructor(
    @Inject(TASK_READ_REPOSITORY)
    private readonly taskReadRepo: ITaskReadRepository,
  ) {}

  async execute(query: GetTaskByIdQuery): Promise<TaskReadModel | null> {
    const taskId = new TaskId(query.id);
    const task = await this.taskReadRepo.findById(taskId);

    if (!task) {
      return null;
    }

    return {
      id: task.id.value,
      title: task.title,
      status: task.status.value,
    };
  }
}
