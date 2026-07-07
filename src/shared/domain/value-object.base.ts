export abstract class ValueObject<P extends object> {
  protected readonly props: P;

  constructor(props: P) {
    this.props = Object.freeze({ ...props });
  }

  equals(vo?: ValueObject<P>): boolean {
    if (vo === undefined || vo === null) return false;
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}
