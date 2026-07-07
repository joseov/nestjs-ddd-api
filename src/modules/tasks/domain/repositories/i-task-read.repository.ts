import { Task } from '../entities/task.aggregate';
import { TaskId } from '../value-objects/task-id.vo';

// Read port for the tasks bounded context.
//
// No manager parameter — reads outside a write transaction always go through
// READ_DATA_SOURCE. Command handlers MUST NOT inject this interface; they use
// ITaskWriteRepository.findById (with a required manager) for transactional reads.
export interface ITaskReadRepository {
  findById(id: TaskId): Promise<Task | null>;
}
