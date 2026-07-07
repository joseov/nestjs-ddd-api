import { ValueObject } from '../../../../shared/domain';

export type TaskStatusValue = 'PENDING' | 'IN_PROGRESS' | 'DONE';

interface TaskStatusProps {
  readonly value: TaskStatusValue;
}

// Immutable value object that represents the lifecycle state of a Task.
// Factory methods (`pending`, `inProgress`, `done`) are the only way to
// obtain a valid instance — invalid string values are excluded at the
// type level via the TaskStatusValue union.
export class TaskStatus extends ValueObject<TaskStatusProps> {
  static pending(): TaskStatus {
    return new TaskStatus({ value: 'PENDING' });
  }

  static inProgress(): TaskStatus {
    return new TaskStatus({ value: 'IN_PROGRESS' });
  }

  static done(): TaskStatus {
    return new TaskStatus({ value: 'DONE' });
  }

  get value(): TaskStatusValue {
    return this.props.value;
  }
}
