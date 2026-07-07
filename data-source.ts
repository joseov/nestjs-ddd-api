import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { TaskOrmEntity } from './src/modules/tasks/infrastructure/persistence/entities/task.orm-entity';

/**
 * TypeORM CLI entry point for migration commands (write DataSource only).
 *
 * Usage (after `nest build`):
 *   typeorm migration:run -d dist/data-source.js
 *
 * Entities are registered as an explicit class array — no glob patterns,
 * which break under nodenext / CJS + `nest build` (design D2).
 * Add new ORM entity classes here as they are introduced.
 *
 * synchronize is always false — schema is managed via migrations only.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_WRITE_HOST,
  port: parseInt(process.env.DB_WRITE_PORT ?? '5432', 10),
  username: process.env.DB_WRITE_USERNAME,
  password: process.env.DB_WRITE_PASSWORD,
  database: process.env.DB_WRITE_DATABASE,
  extra: {
    max: parseInt(process.env.DB_WRITE_POOL_SIZE ?? '10', 10),
  },
  entities: [TaskOrmEntity],
  synchronize: false,
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
});
