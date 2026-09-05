import 'reflect-metadata';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { UnitOfWork, TransactionContext } from './unit-of-work';
import { BaseRepository } from './base.repository';

// ---------------------------------------------------------------------------
// UnitOfWork
// ---------------------------------------------------------------------------

describe('UnitOfWork', () => {
  const mockManager = {} as EntityManager;

  let mockWriteDs: { transaction: jest.Mock };
  let uow: UnitOfWork;

  beforeEach(() => {
    mockWriteDs = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (m: EntityManager) => Promise<unknown>) =>
          cb(mockManager),
        ),
    };
    uow = new UnitOfWork(mockWriteDs as unknown as DataSource);
  });

  it('passes the write EntityManager as ctx.manager to the callback', async () => {
    let receivedManager: EntityManager | undefined;

    await uow.runInTransaction((ctx: TransactionContext) => {
      receivedManager = ctx.manager;
      return Promise.resolve();
    });

    expect(receivedManager).toBe(mockManager);
  });

  it('resolves with the value returned by the callback', async () => {
    const result = await uow.runInTransaction(() => Promise.resolve(42));

    expect(result).toBe(42);
  });

  it('rethrows the rejection and does NOT swallow it', async () => {
    const error = new Error('tx failed');
    mockWriteDs.transaction.mockRejectedValue(error);

    await expect(
      uow.runInTransaction(() => Promise.resolve(undefined)),
    ).rejects.toThrow('tx failed');
  });

  it('delegates to writeDs.transaction — does not call readDs', async () => {
    await uow.runInTransaction(() => Promise.resolve('ok'));

    expect(mockWriteDs.transaction).toHaveBeenCalledTimes(1);
  });

  it('propagates the rejection of the work callback itself', async () => {
    // The work callback rejects (not writeDs.transaction — the callback itself fails)
    const callbackError = new Error('callback rejected by business logic');

    await expect(
      uow.runInTransaction(() => Promise.reject(callbackError)),
    ).rejects.toThrow('callback rejected by business logic');
  });
});

// ---------------------------------------------------------------------------
// BaseRepository routing
// ---------------------------------------------------------------------------

class TestOrmEntity {}

class TestRepository extends BaseRepository<TestOrmEntity> {
  protected readonly entity = TestOrmEntity;

  public testWriteRepo(manager?: EntityManager): Repository<TestOrmEntity> {
    return this.writeRepo(manager);
  }

  public testReadRepo(): Repository<TestOrmEntity> {
    return this.readRepo();
  }
}

describe('BaseRepository', () => {
  const mockWriteRepoInstance = {} as Repository<TestOrmEntity>;
  const mockReadRepoInstance = {} as Repository<TestOrmEntity>;

  const mockWriteManager = {
    getRepository: jest.fn().mockReturnValue(mockWriteRepoInstance),
  };
  const mockReadManager = {
    getRepository: jest.fn().mockReturnValue(mockReadRepoInstance),
  };

  const mockWriteDs = { manager: mockWriteManager } as unknown as DataSource;
  const mockReadDs = { manager: mockReadManager } as unknown as DataSource;

  let repo: TestRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteManager.getRepository.mockReturnValue(mockWriteRepoInstance);
    mockReadManager.getRepository.mockReturnValue(mockReadRepoInstance);
    repo = new TestRepository(mockWriteDs, mockReadDs);
  });

  describe('writeRepo()', () => {
    it('uses writeDs.manager.getRepository when no manager is provided', () => {
      const result = repo.testWriteRepo();

      expect(mockWriteManager.getRepository).toHaveBeenCalledWith(
        TestOrmEntity,
      );
      expect(result).toBe(mockWriteRepoInstance);
    });

    it('uses the provided EntityManager instead of writeDs.manager', () => {
      const customGetRepository = jest
        .fn()
        .mockReturnValue(mockWriteRepoInstance);
      const customManager = {
        getRepository: customGetRepository,
      } as unknown as EntityManager;

      repo.testWriteRepo(customManager);

      expect(customGetRepository).toHaveBeenCalledWith(TestOrmEntity);
      expect(mockWriteManager.getRepository).not.toHaveBeenCalled();
    });
  });

  describe('readRepo()', () => {
    it('uses readDs.manager.getRepository', () => {
      const result = repo.testReadRepo();

      expect(mockReadManager.getRepository).toHaveBeenCalledWith(TestOrmEntity);
      expect(result).toBe(mockReadRepoInstance);
    });

    it('never touches writeDs', () => {
      repo.testReadRepo();

      expect(mockWriteManager.getRepository).not.toHaveBeenCalled();
    });
  });
});
