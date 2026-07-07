import { AggregateRoot } from '../../../../shared/domain';
import { TaskId } from '../value-objects/task-id.vo';
import { TaskStatus } from '../value-objects/task-status.vo';
import { TaskCreated } from '../events/task-created.event';
import { TaskDomainError } from '../errors/task-domain.error';

// Task aggregate root.
// Invariant: title must be a non-empty, non-whitespace string.
// Use Task.create to build a new task (emits TaskCreated).
// Use Task.reconstitute when rehydrating from persistence (no event).
export class Task extends AggregateRoot<TaskId> {
  private _title: string;
  private _status: TaskStatus;

  private constructor(id: TaskId, title: string, status: TaskStatus) {
    super(id);
    this._title = title;
    this._status = status;
  }

  // ── Factory: new task ──────────────────────────────────────────────────────

  static create(id: TaskId, title: string): Task {
    Task.assertNonEmptyTitle(title);
    const task = new Task(id, title, TaskStatus.pending());
    task.addEvent(new TaskCreated(id.value, title));
    return task;
  }

  // ── Factory: rehydrate from persistence ───────────────────────────────────

  static reconstitute(id: TaskId, title: string, status: TaskStatus): Task {
    return new Task(id, title, status);
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get title(): string {
    return this._title;
  }

  get status(): TaskStatus {
    return this._status;
  }

  // ── Invariant guard ───────────────────────────────────────────────────────

  private static assertNonEmptyTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new TaskDomainError('Task title must not be empty or whitespace');
    }
  }
}
