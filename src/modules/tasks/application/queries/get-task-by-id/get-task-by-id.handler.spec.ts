import 'reflect-metadata';

import { GetTaskByIdQuery } from './get-task-by-id.query';
import { GetTaskByIdHandler } from './get-task-by-id.handler';
import type { ITaskReadRepository } from '../../../domain/repositories/i-task-read.repository';
import { Task } from '../../../domain/entities/task.aggregate';
import { TaskId } from '../../../domain/value-objects/task-id.vo';
import { TaskStatus } from '../../../domain/value-objects/task-status.vo';

describe('GetTaskByIdHandler', () => {
  let handler: GetTaskByIdHandler;
  // Plain object type (not jest.Mocked<Interface>) avoids the unbound-method lint rule.
  let mockReadRepo: { findById: jest.Mock };

  beforeEach(() => {
    mockReadRepo = {
      findById: jest.fn(),
    };

    handler = new GetTaskByIdHandler(
      mockReadRepo as unknown as ITaskReadRepository,
    );
  });

  // ── found path ─────────────────────────────────────────────────────────────

  describe('found path', () => {
    it('calls findById on the read repository with a TaskId wrapping the query id', async () => {
      const task = Task.reconstitute(
        new TaskId('task-abc'),
        'Read me',
        TaskStatus.pending(),
      );
      mockReadRepo.findById.mockResolvedValue(task);

      const query = new GetTaskByIdQuery('task-abc');
      await handler.execute(query);

      expect(mockReadRepo.findById).toHaveBeenCalledTimes(1);
      // The argument must be a TaskId whose value equals the query id string
      const [calledWith] = mockReadRepo.findById.mock.calls[0] as [TaskId];
      expect(calledWith).toBeInstanceOf(TaskId);
      expect(calledWith.value).toBe('task-abc');
    });

    it('maps a PENDING aggregate to a TaskReadModel DTO', async () => {
      const task = Task.reconstitute(
        new TaskId('task-pending'),
        'Pending task',
        TaskStatus.pending(),
      );
      mockReadRepo.findById.mockResolvedValue(task);

      const result = await handler.execute(
        new GetTaskByIdQuery('task-pending'),
      );

      expect(result).toEqual({
        id: 'task-pending',
        title: 'Pending task',
        status: 'PENDING',
      });
    });

    it('maps an IN_PROGRESS aggregate to a TaskReadModel DTO', async () => {
      const task = Task.reconstitute(
        new TaskId('task-wip'),
        'WIP task',
        TaskStatus.inProgress(),
      );
      mockReadRepo.findById.mockResolvedValue(task);

      const result = await handler.execute(new GetTaskByIdQuery('task-wip'));

      expect(result).toEqual({
        id: 'task-wip',
        title: 'WIP task',
        status: 'IN_PROGRESS',
      });
    });

    it('maps a DONE aggregate to a TaskReadModel DTO', async () => {
      const task = Task.reconstitute(
        new TaskId('task-done'),
        'Done task',
        TaskStatus.done(),
      );
      mockReadRepo.findById.mockResolvedValue(task);

      const result = await handler.execute(new GetTaskByIdQuery('task-done'));

      expect(result).toEqual({
        id: 'task-done',
        title: 'Done task',
        status: 'DONE',
      });
    });
  });

  // ── not-found path ─────────────────────────────────────────────────────────

  describe('not-found path', () => {
    it('returns null when the read repository returns null', async () => {
      mockReadRepo.findById.mockResolvedValue(null);

      const result = await handler.execute(
        new GetTaskByIdQuery('non-existent-id'),
      );

      expect(result).toBeNull();
    });

    it('still calls findById even when the task does not exist', async () => {
      mockReadRepo.findById.mockResolvedValue(null);

      await handler.execute(new GetTaskByIdQuery('missing'));

      expect(mockReadRepo.findById).toHaveBeenCalledTimes(1);
    });
  });

  // ── write port isolation ───────────────────────────────────────────────────

  describe('write port isolation', () => {
    it('accepts only one constructor argument — the read repository', () => {
      // Structural guard: if the handler ever injects a write port, this
      // direct instantiation test becomes the first to break (wrong arity).
      const isolatedHandler = new GetTaskByIdHandler(
        mockReadRepo as unknown as ITaskReadRepository,
      );

      expect(isolatedHandler).toBeDefined();
    });

    it('calls only findById on the read repository — no write port access', async () => {
      mockReadRepo.findById.mockResolvedValue(null);

      await handler.execute(new GetTaskByIdQuery('id-x'));

      // The mock only has one method; if a write port were injected the test
      // itself would fail to compile / bind it.
      expect(mockReadRepo.findById).toHaveBeenCalledTimes(1);
    });
  });
});
