import 'reflect-metadata';
import { Task } from '../../domain/entities/task.aggregate';
import { TaskId } from '../../domain/value-objects/task-id.vo';
import { TaskStatus } from '../../domain/value-objects/task-status.vo';
import { TaskOrmEntity } from './entities/task.orm-entity';
import { TaskMapper } from './task.mapper';

// ─── TaskMapper ───────────────────────────────────────────────────────────────

describe('TaskMapper', () => {
  let mapper: TaskMapper;

  beforeEach(() => {
    mapper = new TaskMapper();
  });

  // ── toOrm ────────────────────────────────────────────────────────────────────

  describe('toOrm', () => {
    it('returns a TaskOrmEntity with the aggregate id, title, and PENDING status', () => {
      const task = Task.reconstitute(
        new TaskId('orm-uuid-1'),
        'Write tests',
        TaskStatus.pending(),
      );

      const orm = mapper.toOrm(task);

      expect(orm).toBeInstanceOf(TaskOrmEntity);
      expect(orm.id).toBe('orm-uuid-1');
      expect(orm.title).toBe('Write tests');
      expect(orm.status).toBe('PENDING');
    });

    it('maps DONE status to the ORM status string "DONE"', () => {
      const task = Task.reconstitute(
        new TaskId('orm-uuid-2'),
        'Finished work',
        TaskStatus.done(),
      );

      const orm = mapper.toOrm(task);

      expect(orm.status).toBe('DONE');
    });

    it('maps IN_PROGRESS status to the ORM status string "IN_PROGRESS"', () => {
      const task = Task.reconstitute(
        new TaskId('orm-uuid-3'),
        'WIP',
        TaskStatus.inProgress(),
      );

      const orm = mapper.toOrm(task);

      expect(orm.status).toBe('IN_PROGRESS');
    });
  });

  // ── toDomain ─────────────────────────────────────────────────────────────────

  describe('toDomain', () => {
    it('maps a TaskOrmEntity to a Task with matching id, title, and PENDING status', () => {
      const orm = new TaskOrmEntity();
      orm.id = 'dom-uuid-1';
      orm.title = 'Restored task';
      orm.status = 'PENDING';

      const task = mapper.toDomain(orm);

      expect(task.id.value).toBe('dom-uuid-1');
      expect(task.title).toBe('Restored task');
      expect(task.status.value).toBe('PENDING');
    });

    it('maps IN_PROGRESS ORM status to a TaskStatus of value IN_PROGRESS', () => {
      const orm = new TaskOrmEntity();
      orm.id = 'dom-uuid-2';
      orm.title = 'In progress task';
      orm.status = 'IN_PROGRESS';

      const task = mapper.toDomain(orm);

      expect(task.status.value).toBe('IN_PROGRESS');
    });

    it('maps DONE ORM status to a TaskStatus of value DONE', () => {
      const orm = new TaskOrmEntity();
      orm.id = 'dom-uuid-3';
      orm.title = 'Done task';
      orm.status = 'DONE';

      const task = mapper.toDomain(orm);

      expect(task.status.value).toBe('DONE');
    });

    it('throws when the persisted status string is not a known TaskStatusValue', () => {
      const orm = new TaskOrmEntity();
      orm.id = 'dom-uuid-bad';
      orm.title = 'Corrupted row';
      orm.status = 'INVALID_STATUS';

      // Guard against data corruption / schema drift: unknown persisted
      // status must fail loudly, never fall back to a default
      expect(() => mapper.toDomain(orm)).toThrow(
        'Unknown TaskStatus value: "INVALID_STATUS"',
      );
    });

    it('yields zero domain events — reconstitute never emits TaskCreated', () => {
      const orm = new TaskOrmEntity();
      orm.id = 'dom-uuid-4';
      orm.title = 'No events';
      orm.status = 'PENDING';

      const task = mapper.toDomain(orm);

      expect(task.pullDomainEvents()).toHaveLength(0);
    });
  });

  // ── round-trip ────────────────────────────────────────────────────────────────

  describe('toDomain(toOrm(task)) round-trip', () => {
    it('preserves id, title, and PENDING status', () => {
      const original = Task.reconstitute(
        new TaskId('rt-uuid-1'),
        'Round trip task',
        TaskStatus.pending(),
      );

      const restored = mapper.toDomain(mapper.toOrm(original));

      expect(restored.id.value).toBe(original.id.value);
      expect(restored.title).toBe(original.title);
      expect(restored.status.value).toBe(original.status.value);
    });

    it('preserves DONE status through the round-trip', () => {
      const original = Task.reconstitute(
        new TaskId('rt-uuid-2'),
        'Completed task',
        TaskStatus.done(),
      );

      const restored = mapper.toDomain(mapper.toOrm(original));

      expect(restored.status.value).toBe('DONE');
    });

    it('preserves IN_PROGRESS status through the round-trip', () => {
      const original = Task.reconstitute(
        new TaskId('rt-uuid-3'),
        'WIP task',
        TaskStatus.inProgress(),
      );

      const restored = mapper.toDomain(mapper.toOrm(original));

      expect(restored.status.value).toBe('IN_PROGRESS');
    });

    it('round-trip yields zero domain events (reconstitute path throughout)', () => {
      const original = Task.reconstitute(
        new TaskId('rt-uuid-4'),
        'No events round-trip',
        TaskStatus.inProgress(),
      );

      const restored = mapper.toDomain(mapper.toOrm(original));

      expect(restored.pullDomainEvents()).toHaveLength(0);
    });
  });
});
