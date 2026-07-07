import { ICommand } from '@nestjs/cqrs';

/**
 * Command to create a new task.
 *
 * Design decision (ID source): the caller supplies the task ID as a
 * caller-generated UUID. This keeps the handler deterministic (no UUID
 * generation to mock in tests), makes retries idempotent (same ID can be
 * resubmitted safely once idempotency checks are added), and allows the HTTP
 * presentation layer to return the ID in the 201 response without a separate
 * read query after the command resolves.
 */
export class CreateTaskCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly title: string,
  ) {}
}
