import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.interface';

export abstract class AggregateRoot<Id> extends Entity<Id> {
  private _events: DomainEvent[] = [];

  protected addEvent(event: DomainEvent): void {
    this._events.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._events];
    this._events = [];
    return events;
  }
}
