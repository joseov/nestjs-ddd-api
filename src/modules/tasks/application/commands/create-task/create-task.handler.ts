import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';

import { CreateTaskCommand } from './create-task.command';
import type { ITaskWriteRepository } from '../../../domain/repositories/i-task-write.repository';
import { TASK_WRITE_REPOSITORY } from '../../../domain/task-repository.tokens';
import { UnitOfWork } from '../../../../../shared/infrastructure/database/unit-of-work';
import { Task } from '../../../domain/entities/task.aggregate';
import { TaskId } from '../../../domain/value-objects/task-id.vo';

/**
 * Handles the CreateTaskCommand.
 *
 * Injected ports:
 *   - TASK_WRITE_REPOSITORY — write side only; no read port injected.
 *   - UnitOfWork            — provides a transactional EntityManager.
 *   - EventBus              — dispatches domain events after the transaction.
 *
 * Drain-after-commit (design D5):
 *   The aggregate is saved inside runInTransaction. Domain events are drained
 *   and published ONLY after the transaction resolves. If the transaction
 *   rejects, the catch propagates to the caller and no events are published —
 *   preventing phantom events for uncommitted writes.
 *
 * Publish failure contract: if EventBus.publish rejects after the commit, the
 * rejection propagates to the caller and the event is NOT retried — the write
 * is durable but the event is lost. Consumers needing guaranteed delivery
 * must add an outbox (out of scope for this boilerplate). Do not wrap the
 * publish loop in a swallowing try/catch.
 */
@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler implements ICommandHandler<CreateTaskCommand> {
  constructor(
    @Inject(TASK_WRITE_REPOSITORY)
    private readonly taskWriteRepo: ITaskWriteRepository,
    private readonly uow: UnitOfWork,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateTaskCommand): Promise<void> {
    const taskId = new TaskId(command.id);
    const task = Task.create(taskId, command.title);

    // Persist inside a write transaction; any failure rethrows (UoW contract)
    await this.uow.runInTransaction(async (ctx) => {
      await this.taskWriteRepo.save(task, ctx.manager);
    });

    // Drain-after-commit: only runs when the transaction above has committed
    const events = task.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
  }
}
