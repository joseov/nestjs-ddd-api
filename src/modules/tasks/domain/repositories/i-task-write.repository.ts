import { Task } from '../entities/task.aggregate';
import { TaskId } from '../value-objects/task-id.vo';

// Write port for the tasks bounded context.
//
// The `manager` parameter is intentionally typed as `unknown` here so that the
// domain layer remains ORM-free. The infrastructure implementation casts it to
// EntityManager at the boundary — this keeps the domain/infra dependency rule
// intact while preserving the transactional-read contract described in D3.
//
// Rules:
//   save(task, manager?)  — persists via WRITE_DATA_SOURCE; manager is optional
//                           so the application layer can call it both inside and
//                           outside a UnitOfWork if needed.
//   findById(id, manager) — manager is REQUIRED; this method is only meaningful
//                           inside a write transaction (transactional-read path).
//                           For reads outside a transaction, use ITaskReadRepository.
export interface ITaskWriteRepository {
  save(task: Task, manager?: unknown): Promise<void>;
  findById(id: TaskId, manager: unknown): Promise<Task | null>;
}
