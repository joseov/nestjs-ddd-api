// Id must expose value equality so that two separately-hydrated entities with the
// same identifier (e.g. after a mapper round-trip) compare as equal.
// Convention: use a ValueObject subclass for every aggregate ID.
export abstract class Entity<Id extends { equals(other: Id): boolean }> {
  protected readonly _id: Id;

  constructor(id: Id) {
    this._id = id;
  }

  get id(): Id {
    return this._id;
  }

  equals(entity?: Entity<Id>): boolean {
    if (entity === undefined || entity === null) return false;
    if (!(entity instanceof Entity)) return false;
    return this._id.equals(entity._id);
  }
}
