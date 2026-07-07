import { ValueObject } from '../../../../shared/domain';

interface TaskIdProps {
  readonly value: string;
}

// Wraps a raw string identifier as a value object so that Task (AggregateRoot)
// gets value-equality for free: two TaskId instances carrying the same string
// are considered equal by ValueObject.equals, which satisfies the Entity<Id>
// constraint `Id extends { equals(other: Id): boolean }`.
export class TaskId extends ValueObject<TaskIdProps> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
