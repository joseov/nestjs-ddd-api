import type { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { WRITE_DATA_SOURCE } from './tokens';

export async function buildWriteDataSource(
  configService: ConfigService,
): Promise<DataSource> {
  const ds = new DataSource({
    type: 'postgres',
    host: configService.getOrThrow<string>('DB_WRITE_HOST'),
    port: configService.getOrThrow<number>('DB_WRITE_PORT'),
    username: configService.getOrThrow<string>('DB_WRITE_USERNAME'),
    password: configService.getOrThrow<string>('DB_WRITE_PASSWORD'),
    database: configService.getOrThrow<string>('DB_WRITE_DATABASE'),
    extra: { max: configService.getOrThrow<number>('DB_WRITE_POOL_SIZE') },
    entities: [],
    synchronize: false,
  });
  await ds.initialize();
  return ds;
}

export const writeDataSourceProvider: FactoryProvider<DataSource> = {
  provide: WRITE_DATA_SOURCE,
  useFactory: buildWriteDataSource,
  inject: [ConfigService],
};
