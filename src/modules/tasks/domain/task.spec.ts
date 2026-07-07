import * as fs from 'node:fs';
import * as path from 'node:path';

import { TaskId } from './value-objects/task-id.vo';
import { TaskStatus } from './value-objects/task-status.vo';
import { TaskCreated } from './events/task-created.event';
import { Task } from './entities/task.aggregate';
import { TaskDomainError } from './errors/task-domain.error';
import type { ITaskWriteRepository } from './repositories/i-task-write.repository';
import type { ITaskReadRepository } from './repositories/i-task-read.repository';
import {
  TASK_WRITE_REPOSITORY,
  TASK_READ_REPOSITORY,
} from './task-repository.tokens';

// ─── TaskId ──────────────────────────────────────────────────────────────────

describe('TaskId', () => {
  it('equals returns true when both wrap the same string value', () => {
    const id1 = new TaskId('abc-123');
    const id2 = new TaskId('abc-123');

    expect(id1.equals(id2)).toBe(true);
  });

  it('equals returns false when the wrapped values differ', () => {
    const id1 = new TaskId('abc-123');
    const id2 = new TaskId('xyz-999');

    expect(id1.equals(id2)).toBe(false);
  });

  it('exposes the underlying string via the value getter', () => {
    const id = new TaskId('test-uuid');

    expect(id.value).toBe('test-uuid');
  });
});

// ─── TaskStatus ───────────────────────────────────────────────────────────────

describe('TaskStatus', () => {
  it('two PENDING instances are equal', () => {
    expect(TaskStatus.pending().equals(TaskStatus.pending())).toBe(true);
  });

  it('PENDING and DONE are not equal', () => {
    expect(TaskStatus.pending().equals(TaskStatus.done())).toBe(false);
  });

  it('exposes the underlying value via the value getter', () => {
    expect(TaskStatus.pending().value).toBe('PENDING');
    expect(TaskStatus.done().value).toBe('DONE');
  });

  it('covers all permitted status values through factory methods', () => {
    expect(TaskStatus.pending().value).toBe('PENDING');
    expect(TaskStatus.inProgress().value).toBe('IN_PROGRESS');
    expect(TaskStatus.done().value).toBe('DONE');
  });

  it('IN_PROGRESS is not equal to DONE', () => {
    expect(TaskStatus.inProgress().equals(TaskStatus.done())).toBe(false);
  });
});

// ─── Task.create ──────────────────────────────────────────────────────────────

describe('Task.create', () => {
  const taskId = new TaskId('task-uuid-1');

  it('creates a task with the provided title and initial PENDING status', () => {
    const task = Task.create(taskId, 'Write unit tests');

    expect(task.title).toBe('Write unit tests');
    expect(task.status.value).toBe('PENDING');
  });

  it('records a TaskCreated domain event on creation', () => {
    const task = Task.create(taskId, 'Write unit tests');
    const events = task.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(TaskCreated);
  });

  it('TaskCreated event carries the task id and title', () => {
    const task = Task.create(taskId, 'My Task Title');
    const events = task.pullDomainEvents();
    const event = events[0] as TaskCreated;

    expect(event.taskId).toBe('task-uuid-1');
    expect(event.title).toBe('My Task Title');
    expect(event.occurredOn).toBeInstanceOf(Date);
  });

  it('pullDomainEvents drains and clears the event queue', () => {
    const task = Task.create(taskId, 'Queue drain test');

    task.pullDomainEvents(); // first drain
    const second = task.pullDomainEvents(); // queue must be empty now

    expect(second).toHaveLength(0);
  });

  it('task id is accessible via the inherited id getter', () => {
    const task = Task.create(taskId, 'Id getter test');

    expect(task.id.equals(taskId)).toBe(true);
  });

  it('throws TaskDomainError when title is an empty string', () => {
    expect(() => Task.create(taskId, '')).toThrow(TaskDomainError);
  });

  it('throws TaskDomainError when title contains only whitespace', () => {
    expect(() => Task.create(taskId, '   ')).toThrow(TaskDomainError);
  });

  it('two tasks created with the same id are considered equal', () => {
    const task1 = Task.create(new TaskId('same-id'), 'Title A');
    const task2 = Task.create(new TaskId('same-id'), 'Title B');

    expect(task1.equals(task2)).toBe(true);
  });

  it('two tasks created with different ids are not equal', () => {
    const task1 = Task.create(new TaskId('id-one'), 'Title');
    const task2 = Task.create(new TaskId('id-two'), 'Title');

    expect(task1.equals(task2)).toBe(false);
  });
});

// ─── Repository tokens ───────────────────────────────────────────────────────

describe('task repository tokens', () => {
  it('TASK_WRITE_REPOSITORY is a unique Symbol', () => {
    expect(typeof TASK_WRITE_REPOSITORY).toBe('symbol');
    expect(TASK_WRITE_REPOSITORY).not.toBe(TASK_READ_REPOSITORY);
  });

  it('TASK_READ_REPOSITORY is a unique Symbol', () => {
    expect(typeof TASK_READ_REPOSITORY).toBe('symbol');
  });
});

// ─── Structural: repository port shapes ──────────────────────────────────────

describe('ITaskWriteRepository structural contract', () => {
  it('is satisfied by an object implementing save and findById with required manager', () => {
    // Compile-time proof: TypeScript accepts this object literal only when it
    // satisfies ITaskWriteRepository. Arrow functions with no parameters are
    // valid because TS allows implementations to omit trailing parameters.
    const impl: ITaskWriteRepository = {
      save: () => Promise.resolve(),
      findById: () => Promise.resolve(null),
    };

    expect(impl).toBeDefined();
  });
});

describe('ITaskReadRepository structural contract', () => {
  it('is satisfied by an object implementing findById without a manager', () => {
    const impl: ITaskReadRepository = {
      findById: () => Promise.resolve(null),
    };

    expect(impl).toBeDefined();
  });
});

// ─── Import hygiene (static) ─────────────────────────────────────────────────

describe('Domain layer import hygiene', () => {
  const domainDir = path.join(__dirname);

  const sourceFiles = [
    'entities/task.aggregate.ts',
    'value-objects/task-id.vo.ts',
    'value-objects/task-status.vo.ts',
    'events/task-created.event.ts',
    'repositories/i-task-write.repository.ts',
    'repositories/i-task-read.repository.ts',
    'task-repository.tokens.ts',
    'errors/task-domain.error.ts',
  ];

  const bannedPatterns = [
    "from '@nestjs",
    'from "@nestjs',
    "from 'typeorm",
    'from "typeorm',
    "require('@nestjs",
    'require("@nestjs',
    "require('typeorm",
    'require("typeorm',
  ];

  it.each(sourceFiles)('"%s" has zero framework or ORM imports', (file) => {
    const content = fs.readFileSync(path.join(domainDir, file), 'utf-8');

    for (const banned of bannedPatterns) {
      expect(content).not.toContain(banned);
    }
  });
});
