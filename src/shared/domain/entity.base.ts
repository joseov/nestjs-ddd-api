export abstract class Entity<Id> {
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
    return this._id === entity._id;
  }
}
