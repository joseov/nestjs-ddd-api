/**
 * Read-model (DTO) returned by GetTaskByIdQuery.
 *
 * A plain data object — not the domain aggregate. Per CQRS read-side
 * conventions the query side projects only what the caller needs so that
 * the presentation layer is never coupled to the domain model.
 *
 * Design decision (not-found behaviour): the handler returns null when no
 * task matches the requested ID. The presentation layer (controller) decides
 * the HTTP response semantics — typically a 404 Not Found.
 */
export interface TaskReadModel {
  id: string;
  title: string;
  /** String representation of TaskStatusValue: 'PENDING' | 'IN_PROGRESS' | 'DONE' */
  status: string;
}
