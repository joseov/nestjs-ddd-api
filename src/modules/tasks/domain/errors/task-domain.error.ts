// Domain invariant violation. Thrown when a Task invariant is broken
// (e.g. empty title). Keeps the domain free of framework error types.
export class TaskDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskDomainError';
  }
}
