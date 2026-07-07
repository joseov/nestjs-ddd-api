import 'reflect-metadata';
import { DataSource, EntityManager } from 'typeorm';
import { Task } from '../../domain/entities/task.aggregate';
import { TaskId } from '../../domain/value-objects/task-id.vo';
import { TaskStatus } from '../../domain/value-objects/task-status.vo';
import { TaskOrmEntity } from './entities/task.orm-entity';
import { TaskMapper } from './task.mapper';
import { TaskWriteRepository } from './task-write.repository';
import { TaskReadRepository } from './task-read.repository';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function buildOrmEntity(
  id: string,
  title: string,
  status: string,
): TaskOrmEntity {
  const entity = new TaskOrmEntity();
  entity.id = id;
  entity.title = title;
  entity.status = status;
  return entity;
}

function buildMockRepo(ormResult: TaskOrmEntity | null = null): {
  save: jest.Mock;
  findOne: jest.Mock;
} {
  return {
    save: jest.fn().mockResolvedValue(undefined),
    findOne: jest.fn().mockResolvedValue(ormResult),
  };
}

// ─── TaskWriteRepository ─────────────────────────────────────────────────────

describe('TaskWriteRepository', () => {
  let mockWriteRepo: { save: jest.Mock; findOne: jest.Mock };
  let mockReadRepo: { save: jest.Mock; findOne: jest.Mock };
  let mockWriteManager: { getRepository: jest.Mock };
  let mockReadManager: { getRepository: jest.Mock };
  let mockWriteDs: DataSource;
  let mockReadDs: DataSource;
  let mapper: TaskMapper;
  let repo: TaskWriteRepository;

  beforeEach(() => {
    mockWriteRepo = buildMockRepo();
    mockReadRepo = buildMockRepo();
    mockWriteManager = {
      getRepository: jest.fn().mockReturnValue(mockWriteRepo),
    };
    mockReadManager = {
      getRepository: jest.fn().mockReturnValue(mockReadRepo),
    };
    mockWriteDs = { manager: mockWriteManager } as unknown as DataSource;
    mockReadDs = { manager: mockReadManager } as unknown as DataSource;
    mapper = new TaskMapper();
    repo = new TaskWriteRepository(mockWriteDs, mockReadDs, mapper);
  });

  // ── save ──────────────────────────────────────────────────────────────────────

  describe('save', () => {
    it('calls save on the ORM repository obtained from the passed manager', async () => {
      const task = Task.reconstitute(
        new TaskId('save-uuid-1'),
        'A task',
        TaskStatus.pending(),
      );
      const repoSpy = buildMockRepo();
      const mockManager = {
        getRepository: jest.fn().mockReturnValue(repoSpy),
      } as unknown as EntityManager;

      await repo.save(task, mockManager);

      expect(repoSpy.save).toHaveBeenCalledTimes(1);
    });

    it('saves the ORM entity produced by the mapper — not the raw aggregate', async () => {
      const task = Task.reconstitute(
        new TaskId('save-uuid-2'),
        'Map verify',
        TaskStatus.done(),
      );
      const repoSpy = buildMockRepo();
      const mockManager = {
        getRepository: jest.fn().mockReturnValue(repoSpy),
      } as unknown as EntityManager;

      await repo.save(task, mockManager);

      const [savedArg] = repoSpy.save.mock.calls[0] as [TaskOrmEntity];
      expect(savedArg).toBeInstanceOf(TaskOrmEntity);
      expect(savedArg.id).toBe('save-uuid-2');
      expect(savedArg.title).toBe('Map verify');
      expect(savedArg.status).toBe('DONE');
    });

    it('routes through the cast manager — NEVER touches the read DataSource', async () => {
      const task = Task.reconstitute(
        new TaskId('save-uuid-3'),
        'Isolation test',
        TaskStatus.pending(),
      );
      const repoSpy = buildMockRepo();
      const mockManager = {
        getRepository: jest.fn().mockReturnValue(repoSpy),
      } as unknown as EntityManager;

      await repo.save(task, mockManager);

      // Manager from argument must be used — NOT readDs
      expect(
        (mockManager as unknown as { getRepository: jest.Mock }).getRepository,
      ).toHaveBeenCalledWith(TaskOrmEntity);
      expect(mockReadManager.getRepository).not.toHaveBeenCalled();
    });
  });

  // ── findById (transactional read) ─────────────────────────────────────────────

  describe('findById', () => {
    it('queries through the passed manager repository — the only transactional-read path', async () => {
      const repoSpy = buildMockRepo();
      const mockManager = {
        getRepository: jest.fn().mockReturnValue(repoSpy),
      } as unknown as EntityManager;

      await repo.findById(new TaskId('find-uuid-1'), mockManager);

      expect(
        (mockManager as unknown as { getRepository: jest.Mock }).getRepository,
      ).toHaveBeenCalledWith(TaskOrmEntity);
    });

    it('NEVER touches the read DataSource in the write findById path', async () => {
      const repoSpy = buildMockRepo();
      const mockManager = {
        getRepository: jest.fn().mockReturnValue(repoSpy),
      } as unknown as EntityManager;

      await repo.findById(new TaskId('find-uuid-2'), mockManager);

      expect(mockReadManager.getRepository).not.toHaveBeenCalled();
    });

    it('returns null when the ORM repository returns null', async () => {
      const repoSpy = buildMockRepo(null);
      const mockManager = {
        getRepository: jest.fn().mockReturnValue(repoSpy),
      } as unknown as EntityManager;

      const result = await repo.findById(new TaskId('not-found'), mockManager);

      expect(result).toBeNull();
    });

    it('maps the found ORM entity to a Task aggregate via the mapper', async () => {
      const ormEntity = buildOrmEntity(
        'found-uuid-1',
        'Found task',
        'IN_PROGRESS',
      );
      const repoSpy = buildMockRepo(ormEntity);
      const mockManager = {
        getRepository: jest.fn().mockReturnValue(repoSpy),
      } as unknown as EntityManager;

      const result = await repo.findById(
        new TaskId('found-uuid-1'),
        mockManager,
      );

      expect(result).not.toBeNull();
      expect(result!.id.value).toBe('found-uuid-1');
      expect(result!.title).toBe('Found task');
      expect(result!.status.value).toBe('IN_PROGRESS');
    });

    it('passes the correct where clause to findOne', async () => {
      const repoSpy = buildMockRepo();
      const mockManager = {
        getRepository: jest.fn().mockReturnValue(repoSpy),
      } as unknown as EntityManager;

      await repo.findById(new TaskId('query-id'), mockManager);

      const [findOneArg] = repoSpy.findOne.mock.calls[0] as [
        { where: { id: string } },
      ];
      expect(findOneArg.where.id).toBe('query-id');
    });
  });
});

// ─── TaskReadRepository ───────────────────────────────────────────────────────

describe('TaskReadRepository', () => {
  let mockWriteRepo: { findOne: jest.Mock };
  let mockReadRepo: { findOne: jest.Mock };
  let mockWriteManager: { getRepository: jest.Mock };
  let mockReadManager: { getRepository: jest.Mock };
  let mockWriteDs: DataSource;
  let mockReadDs: DataSource;
  let mapper: TaskMapper;
  let repo: TaskReadRepository;

  beforeEach(() => {
    mockWriteRepo = { findOne: jest.fn().mockResolvedValue(null) };
    mockReadRepo = { findOne: jest.fn().mockResolvedValue(null) };
    mockWriteManager = {
      getRepository: jest.fn().mockReturnValue(mockWriteRepo),
    };
    mockReadManager = {
      getRepository: jest.fn().mockReturnValue(mockReadRepo),
    };
    mockWriteDs = { manager: mockWriteManager } as unknown as DataSource;
    mockReadDs = { manager: mockReadManager } as unknown as DataSource;
    mapper = new TaskMapper();
    repo = new TaskReadRepository(mockWriteDs, mockReadDs, mapper);
  });

  // ── findById ──────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('routes to the read DataSource — NEVER the write DataSource', async () => {
      await repo.findById(new TaskId('read-uuid-1'));

      expect(mockReadManager.getRepository).toHaveBeenCalledWith(TaskOrmEntity);
      expect(mockWriteManager.getRepository).not.toHaveBeenCalled();
    });

    it('returns null when the ORM repository returns null', async () => {
      const result = await repo.findById(new TaskId('not-found'));

      expect(result).toBeNull();
    });

    it('maps the found ORM entity to a Task aggregate via the mapper', async () => {
      const ormEntity = buildOrmEntity('r-found-uuid', 'Read task', 'PENDING');
      mockReadRepo.findOne.mockResolvedValue(ormEntity);

      const result = await repo.findById(new TaskId('r-found-uuid'));

      expect(result).not.toBeNull();
      expect(result!.id.value).toBe('r-found-uuid');
      expect(result!.title).toBe('Read task');
      expect(result!.status.value).toBe('PENDING');
    });

    it('NEVER touches the write DataSource even when a task is found', async () => {
      const ormEntity = buildOrmEntity(
        'r-found-uuid-2',
        'Another read task',
        'DONE',
      );
      mockReadRepo.findOne.mockResolvedValue(ormEntity);

      await repo.findById(new TaskId('r-found-uuid-2'));

      expect(mockWriteManager.getRepository).not.toHaveBeenCalled();
    });

    it('passes the correct where clause to findOne', async () => {
      await repo.findById(new TaskId('query-id'));

      const [findOneArg] = mockReadRepo.findOne.mock.calls[0] as [
        { where: { id: string } },
      ];
      expect(findOneArg.where.id).toBe('query-id');
    });
  });
});
