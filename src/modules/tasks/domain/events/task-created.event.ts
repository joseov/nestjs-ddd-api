import type { DomainEvent } from '../../../../shared/domain';

// Raised by Task.create when a new task is successfully constructed.
// Plain class — zero framework imports — implements the shared DomainEvent
// contract so the application layer can publish it via EventBus after commit.
export class TaskCreated implements DomainEvent {
  readonly occurredOn: Date;

  constructor(
    public readonly taskId: string,
    public readonly title: string,
    occurredOn: Date = new Date(),
  ) {
    this.occurredOn = occurredOn;
  }
}
