// Structural deep-equality that sorts keys before comparing so that two objects
// built with the same properties in different insertion order are still equal.
// No third-party dependency — recursive traversal over plain object trees.
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  // Date has no enumerable own properties, so key-walking below would compare
  // any two Dates as vacuously equal — compare by instant instead
  if (a instanceof Date || b instanceof Date) {
    return (
      a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
    );
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const keysA = Object.keys(aObj).sort();
  const keysB = Object.keys(bObj).sort();

  if (keysA.length !== keysB.length) return false;

  return keysA.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(bObj, key) &&
      deepEqual(aObj[key], bObj[key]),
  );
}

export abstract class ValueObject<P extends object> {
  protected readonly props: P;

  constructor(props: P) {
    this.props = Object.freeze({ ...props });
  }

  equals(vo?: ValueObject<P>): boolean {
    if (vo === undefined || vo === null) return false;
    return deepEqual(this.props, vo.props);
  }
}
