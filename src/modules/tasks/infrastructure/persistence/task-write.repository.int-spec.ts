/**
 * Integration tests for TaskWriteRepository and TaskReadRepository.
 *
 * These tests require a live PostgreSQL connection.
 * They are NOT part of the default `pnpm test` suite (testRegex: *.spec.ts$).
 * Run with: pnpm run test:int
 *
 * Environment variables needed (or set DB_* to point at a local test DB):
 *   DB_WRITE_HOST, DB_WRITE_PORT, DB_WRITE_USERNAME, DB_WRITE_PASSWORD,
 *   DB_WRITE_DATABASE, DB_WRITE_POOL_SIZE
 *   (read-side uses same values for local dev — set DB_READ_* identically)
 *
 * The suite skips automatically when the database is unreachable.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Task } from '../../domain/entities/task.aggregate';
import { TaskId } from '../../domain/value-objects/task-id.vo';
import { TaskOrmEntity } from './entities/task.orm-entity';
import { TaskMapper } from './task.mapper';
import { TaskWriteRepository } from './task-write.repository';
import { TaskReadRepository } from './task-read.repository';

// ─── DataSource factory (test-only) ──────────────────────────────────────────

function buildTestDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_WRITE_HOST ?? 'localhost',
    port: parseInt(process.env.DB_WRITE_PORT ?? '5432', 10),
    username: process.env.DB_WRITE_USERNAME ?? 'postgres',
    password: process.env.DB_WRITE_PASSWORD ?? 'postgres',
    database: process.env.DB_WRITE_DATABASE ?? 'tasks_test',
    entities: [TaskOrmEntity],
    synchronize: true, // test-only: auto-create schema; use migrations in production
  });
}

// ─── Suite (skipped when DB is unavailable) ───────────────────────────────────

describe('TaskWriteRepository + TaskReadRepository (integration)', () => {
  let dataSource: DataSource;
  let mapper: TaskMapper;
  let writeRepo: TaskWriteRepository;
  let readRepo: TaskReadRepository;
  let available = true;

  beforeAll(async () => {
    dataSource = buildTestDataSource();
    try {
      await dataSource.initialize();
    } catch {
      available = false;
    }

    if (available) {
      mapper = new TaskMapper();
      writeRepo = new TaskWriteRepository(dataSource, dataSource, mapper);
      readRepo = new TaskReadRepository(dataSource, dataSource, mapper);
    }
  });

  afterEach(async () => {
    if (available) {
      await dataSource.getRepository(TaskOrmEntity).clear();
    }
  });

  afterAll(async () => {
    if (available && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  // Helper: skip individual tests when DB is unavailable
  function itIfAvailable(name: string, fn: () => Promise<void>): void {
    it(name, async () => {
      if (!available) {
        console.warn('Skipping integration test — database not available');
        return;
      }
      await fn();
    });
  }

  // ── save persists a row ─────────────────────────────────────────────────────

  itIfAvailable(
    'save persists a task row that can be retrieved via the raw repository',
    async () => {
      const taskId = new TaskId('int-uuid-1');
      const task = Task.create(taskId, 'Integration task');

      await dataSource.transaction(async (manager) => {
        await writeRepo.save(task, manager);
      });

      const raw = await dataSource
        .getRepository(TaskOrmEntity)
        .findOne({ where: { id: 'int-uuid-1' } });

      expect(raw).not.toBeNull();
      expect(raw!.title).toBe('Integration task');
      expect(raw!.status).toBe('PENDING');
    },
  );

  // ── findById round-trips ────────────────────────────────────────────────────

  itIfAvailable(
    'TaskReadRepository.findById round-trips through the read DataSource',
    async () => {
      const taskId = new TaskId('int-uuid-2');
      const task = Task.create(taskId, 'Round-trip task');

      await dataSource.transaction(async (manager) => {
        await writeRepo.save(task, manager);
      });

      const found = await readRepo.findById(taskId);

      expect(found).not.toBeNull();
      expect(found!.id.value).toBe('int-uuid-2');
      expect(found!.title).toBe('Round-trip task');
      expect(found!.status.value).toBe('PENDING');
    },
  );

  // ── TaskWriteRepository.findById sees uncommitted data in the same tx ────────

  itIfAvailable(
    'TaskWriteRepository.findById sees the row within the same transaction',
    async () => {
      const taskId = new TaskId('int-uuid-3');
      const task = Task.create(taskId, 'Transactional read');

      let foundInsideTx: Task | null = null;

      await dataSource.transaction(async (manager) => {
        await writeRepo.save(task, manager);
        // findById with the same manager must see the uncommitted row
        foundInsideTx = await writeRepo.findById(taskId, manager);
      });

      expect(foundInsideTx).not.toBeNull();
      expect(foundInsideTx!.id.value).toBe('int-uuid-3');
    },
  );

  // ── not-found returns null ──────────────────────────────────────────────────

  itIfAvailable(
    'TaskWriteRepository.findById returns null for a non-existent id',
    async () => {
      await dataSource.transaction(async (manager) => {
        const result = await writeRepo.findById(
          new TaskId('non-existent'),
          manager,
        );
        expect(result).toBeNull();
      });
    },
  );

  itIfAvailable(
    'TaskReadRepository.findById returns null for a non-existent id',
    async () => {
      const result = await readRepo.findById(new TaskId('non-existent-read'));
      expect(result).toBeNull();
    },
  );
});
