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

// Nested VO used to verify key-order-independent deep equality
interface NestedProps {
  inner: { x: number; y: number };
  label: string;
}

class NestedVO extends ValueObject<NestedProps> {
  constructor(props: NestedProps) {
    super(props);
  }
}

// VO holding a Date — Date has no enumerable own properties, so structural
// comparison must branch on Date explicitly instead of walking keys
interface IssuedProps {
  issuedAt: Date;
}

class IssuedVO extends ValueObject<IssuedProps> {
  constructor(props: IssuedProps) {
    super(props);
  }
}

// --- Entity ---

// UserId implements value equality so Entity<UserId>.equals delegates correctly
class UserId {
  constructor(public readonly value: string) {}

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
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

  // MINOR 6 — key-order independence (JSON.stringify is key-order sensitive; deepEqual must not be)
  it('should be equal when nested props carry the same values but different key insertion order', () => {
    const a = new NestedVO({ inner: { x: 1, y: 2 }, label: 'test' });
    // outer keys reversed, inner keys reversed — same values
    const b = new NestedVO({ label: 'test', inner: { y: 2, x: 1 } });

    expect(a.equals(b)).toBe(true);
  });

  it('should not be equal when Date props differ in value', () => {
    const a = new IssuedVO({ issuedAt: new Date('2020-01-01T00:00:00Z') });
    const b = new IssuedVO({ issuedAt: new Date('2025-12-31T00:00:00Z') });

    expect(a.equals(b)).toBe(false);
  });

  it('should be equal when Date props carry the same instant (separate instances)', () => {
    const a = new IssuedVO({ issuedAt: new Date('2020-01-01T00:00:00Z') });
    const b = new IssuedVO({ issuedAt: new Date('2020-01-01T00:00:00Z') });

    expect(a.equals(b)).toBe(true);
  });
});

describe('Entity', () => {
  // CRITICAL 2 — behavioral contract: two separately-hydrated entities with the same ID value must be equal.
  // This is the mapper/repository case: two round-trips through storage produce different object references.
  it('should be equal when ids represent the same value (separate instances)', () => {
    const a = new User(new UserId('abc'));
    const b = new User(new UserId('abc'));

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

  it('should inherit equals from Entity (value-based id comparison)', () => {
    const a = new UserAggregate(new UserId('same'));
    const b = new UserAggregate(new UserId('same'));

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
