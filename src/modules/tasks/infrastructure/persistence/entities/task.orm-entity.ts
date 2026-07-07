import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * TypeORM ORM entity for the tasks table.
 *
 * TypeORM decorators (@Entity, @Column) live here, NOT in the domain aggregate.
 * The domain layer stays ORM-free (design D2, spec: ORM-Free Domain Entities).
 * TaskMapper bridges between this class and the Task aggregate.
 */
@Entity('tasks')
export class TaskOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  /**
   * Stores the TaskStatusValue string: 'PENDING' | 'IN_PROGRESS' | 'DONE'.
   * Length 20 comfortably fits the longest value ('IN_PROGRESS' = 11 chars).
   */
  @Column({ type: 'varchar', length: 20 })
  status: string;
}
