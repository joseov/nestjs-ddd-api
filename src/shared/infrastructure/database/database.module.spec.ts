import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { DatabaseModule } from './database.module';

describe('DatabaseModule', () => {
  let writeDs: { destroy: jest.Mock };
  let readDs: { destroy: jest.Mock };
  let module: DatabaseModule;

  beforeEach(() => {
    writeDs = { destroy: jest.fn().mockResolvedValue(undefined) };
    readDs = { destroy: jest.fn().mockResolvedValue(undefined) };
    module = new DatabaseModule(
      writeDs as unknown as DataSource,
      readDs as unknown as DataSource,
    );
  });

  describe('onModuleDestroy', () => {
    it('destroys the write DataSource', async () => {
      await module.onModuleDestroy();

      expect(writeDs.destroy).toHaveBeenCalledTimes(1);
    });

    it('destroys the read DataSource', async () => {
      await module.onModuleDestroy();

      expect(readDs.destroy).toHaveBeenCalledTimes(1);
    });

    it('destroys both DataSources in a single lifecycle call', async () => {
      await module.onModuleDestroy();

      expect(writeDs.destroy).toHaveBeenCalled();
      expect(readDs.destroy).toHaveBeenCalled();
    });
  });

  describe('module metadata', () => {
    it('is registered as a global NestJS module', () => {
      // NestJS @Global() sets the '__module:global__' reflect-metadata key to true
      // (GLOBAL_MODULE_METADATA constant from @nestjs/common/constants.js).
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const isGlobal: boolean | undefined = Reflect.getMetadata(
        '__module:global__',
        DatabaseModule,
      );
      expect(isGlobal).toBe(true);
    });
  });
});
