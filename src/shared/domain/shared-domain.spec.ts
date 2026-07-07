import {
  AggregateRoot,
  DomainEvent,
  Entity,
  Mapper,
  ValueObject,
} from './index';

// --- ValueObject ---

interface MoneyProps {
  amount: number;
  currency: string;
}

class Money extends ValueObject<MoneyProps> {
  constructor(props: MoneyProps) {
    super(props);
  }
}

// --- Entity ---

class UserId {
  constructor(public readonly value: string) {}
}

class User extends Entity<UserId> {
  constructor(id: UserId) {
    super(id);
  }
}

// --- DomainEvent ---

class UserRegistered implements DomainEvent {
  readonly occurredOn: Date = new Date();
  constructor(public readonly userId: string) {}
}

// --- AggregateRoot ---

class UserAggregate extends AggregateRoot<UserId> {
  constructor(id: UserId) {
    super(id);
  }

  register(): void {
    this.addEvent(new UserRegistered(this._id.value));
  }
}

// --- Mapper (structural check only — no runtime test needed) ---

interface UserOrm {
  id: string;
}

class UserMapper implements Mapper<UserAggregate, UserOrm> {
  toDomain(orm: UserOrm): UserAggregate {
    return new UserAggregate(new UserId(orm.id));
  }
  toOrm(domain: UserAggregate): UserOrm {
    return { id: domain.id.value };
  }
}

// ─────────────────────────────────────────
// Tests
// ─────────────────────────────────────────

describe('ValueObject', () => {
  it('should be equal when props are structurally identical', () => {
    const a = new Money({ amount: 100, currency: 'USD' });
    const b = new Money({ amount: 100, currency: 'USD' });

    expect(a.equals(b)).toBe(true);
  });

  it('should not be equal when any prop differs', () => {
    const a = new Money({ amount: 100, currency: 'USD' });
    const b = new Money({ amount: 200, currency: 'USD' });

    expect(a.equals(b)).toBe(false);
  });

  it('should not be equal to undefined', () => {
    const a = new Money({ amount: 100, currency: 'USD' });

    expect(a.equals(undefined)).toBe(false);
  });
});

describe('Entity', () => {
  it('should be equal when ids are reference-equal', () => {
    const id = new UserId('abc');
    const a = new User(id);
    const b = new User(id);

    expect(a.equals(b)).toBe(true);
  });

  it('should not be equal when ids differ', () => {
    const a = new User(new UserId('abc'));
    const b = new User(new UserId('xyz'));

    expect(a.equals(b)).toBe(false);
  });

  it('should not be equal to undefined', () => {
    const a = new User(new UserId('abc'));

    expect(a.equals(undefined)).toBe(false);
  });

  it('should expose id via public getter', () => {
    const id = new UserId('abc');
    const user = new User(id);

    expect(user.id).toBe(id);
  });
});

describe('AggregateRoot', () => {
  it('should return domain events added via addEvent', () => {
    const aggregate = new UserAggregate(new UserId('1'));
    aggregate.register();

    const events = aggregate.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(UserRegistered);
  });

  it('should clear the event queue after pullDomainEvents is called', () => {
    const aggregate = new UserAggregate(new UserId('1'));
    aggregate.register();

    aggregate.pullDomainEvents();
    const second = aggregate.pullDomainEvents();

    expect(second).toHaveLength(0);
  });

  it('should accumulate multiple events before draining', () => {
    const aggregate = new UserAggregate(new UserId('1'));
    aggregate.register();
    aggregate.register();

    const events = aggregate.pullDomainEvents();

    expect(events).toHaveLength(2);
  });

  it('should inherit equals from Entity (id-based comparison)', () => {
    const id = new UserId('same');
    const a = new UserAggregate(id);
    const b = new UserAggregate(id);

    expect(a.equals(b)).toBe(true);
  });
});

describe('Mapper', () => {
  it('should round-trip: toDomain(toOrm(aggregate)).id equals original id', () => {
    const mapper = new UserMapper();
    const original = new UserAggregate(new UserId('round-trip'));

    const orm = mapper.toOrm(original);
    const restored = mapper.toDomain(orm);

    expect(restored.id.value).toBe(original.id.value);
  });
});

describe('DomainEvent contract', () => {
  it('should have an occurredOn date', () => {
    const event = new UserRegistered('u1');

    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
