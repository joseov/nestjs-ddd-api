import 'reflect-metadata';
import { EventBus } from '@nestjs/cqrs';

import { CreateTaskCommand } from './create-task.command';
import { CreateTaskHandler } from './create-task.handler';
import type { ITaskWriteRepository } from '../../../domain/repositories/i-task-write.repository';
import {
  UnitOfWork,
  TransactionContext,
} from '../../../../../shared/infrastructure/database/unit-of-work';
import { TaskCreated } from '../../../domain/events/task-created.event';
import { TaskDomainError } from '../../../domain/errors/task-domain.error';

describe('CreateTaskHandler', () => {
  let handler: CreateTaskHandler;
  // Plain object types (not jest.Mocked<Interface>) avoid the unbound-method lint rule
  // because jest.Mock properties are not interface methods in TypeScript's type graph.
  let mockWriteRepo: { save: jest.Mock; findById: jest.Mock };
  let mockUow: { runInTransaction: jest.Mock };
  let mockEventBus: { publish: jest.Mock };

  // Branded so toHaveBeenCalledWith structural equality only matches THIS
  // instance — a bare {} would be satisfied by any freshly created object
  const mockManager = { __brand: 'test-entity-manager' };

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(null),
    };

    // Default: runs the callback (simulating a committed transaction)
    mockUow = {
      runInTransaction: jest
        .fn()
        .mockImplementation(
          (work: (ctx: TransactionContext) => Promise<unknown>) =>
            work({
              manager: mockManager as unknown as TransactionContext['manager'],
            }),
        ),
    };

    mockEventBus = {
      publish: jest.fn().mockReturnValue(undefined),
    };

    handler = new CreateTaskHandler(
      mockWriteRepo as unknown as ITaskWriteRepository,
      mockUow as unknown as UnitOfWork,
      mockEventBus as unknown as EventBus,
    );
  });

  // ── save-inside-transaction ────────────────────────────────────────────────

  describe('save inside transaction', () => {
    it('calls runInTransaction on the UnitOfWork', async () => {
      const command = new CreateTaskCommand('task-id-1', 'Write tests');

      await handler.execute(command);

      expect(mockUow.runInTransaction).toHaveBeenCalledTimes(1);
    });

    it('calls save on the write repository inside the transaction', async () => {
      const command = new CreateTaskCommand('task-id-2', 'Verify save');

      await handler.execute(command);

      expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
    });

    it('passes ctx.manager as the second argument to save', async () => {
      const command = new CreateTaskCommand('task-id-3', 'Check manager');

      await handler.execute(command);

      // The handler must forward ctx.manager explicitly — not undefined, not null
      expect(mockWriteRepo.save).toHaveBeenCalledWith(
        expect.any(Object), // the Task aggregate
        mockManager,
      );
    });
  });

  // ── drain-after-commit (D5) ────────────────────────────────────────────────

  describe('drain-after-commit (design D5)', () => {
    it('publishes events ONLY after the transaction callback resolves', async () => {
      const callOrder: string[] = [];

      mockUow.runInTransaction.mockImplementation(
        async (work: (ctx: TransactionContext) => Promise<unknown>) => {
          await work({
            manager: mockManager as unknown as TransactionContext['manager'],
          });
          callOrder.push('transaction-committed');
        },
      );

      mockEventBus.publish.mockImplementation(() => {
        callOrder.push('event-published');
      });

      const command = new CreateTaskCommand('task-id-4', 'Drain ordering');
      await handler.execute(command);

      expect(callOrder).toEqual(['transaction-committed', 'event-published']);
    });

    it('does NOT publish any event when the transaction rejects', async () => {
      mockUow.runInTransaction.mockRejectedValue(new Error('DB write failed'));

      const command = new CreateTaskCommand('task-id-5', 'Rollback guard');

      await expect(handler.execute(command)).rejects.toThrow('DB write failed');
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('propagates the transaction rejection to the caller', async () => {
      const dbError = new Error('unique constraint violation');
      mockUow.runInTransaction.mockRejectedValue(dbError);

      const command = new CreateTaskCommand('task-id-6', 'Error propagation');

      await expect(handler.execute(command)).rejects.toThrow(
        'unique constraint violation',
      );
    });

    it('publishes exactly the events drained from the aggregate — a TaskCreated', async () => {
      const command = new CreateTaskCommand('task-id-7', 'Event identity');

      await handler.execute(command);

      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
      const [publishedEvent] = mockEventBus.publish.mock.calls[0] as [unknown];
      expect(publishedEvent).toBeInstanceOf(TaskCreated);
      // Payload must be the drained event's data, not a re-created stub
      expect(publishedEvent).toEqual(
        expect.objectContaining({
          taskId: 'task-id-7',
          title: 'Event identity',
        }),
      );
    });

    it('drains the aggregate event queue: exactly one event per execution', async () => {
      const command = new CreateTaskCommand('task-id-8', 'Drain clear');

      await handler.execute(command);

      // Task.create adds exactly one TaskCreated event — no accidental double-drain
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });
  });

  // ── domain validation before transaction ──────────────────────────────────
  // Validate-then-transact is a load-bearing contract: an invalid command must
  // never open a transaction. If Task.create ever moves inside the UoW
  // callback, these tests fail.

  describe('domain validation', () => {
    it('rejects with TaskDomainError for an empty title without opening a transaction', async () => {
      const command = new CreateTaskCommand('task-id-9', '');

      await expect(handler.execute(command)).rejects.toThrow(TaskDomainError);
      expect(mockUow.runInTransaction).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('rejects with TaskDomainError for a whitespace-only title without opening a transaction', async () => {
      const command = new CreateTaskCommand('task-id-10', '   ');

      await expect(handler.execute(command)).rejects.toThrow(TaskDomainError);
      expect(mockUow.runInTransaction).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});
