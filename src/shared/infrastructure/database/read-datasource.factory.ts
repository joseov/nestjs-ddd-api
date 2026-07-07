import type { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { READ_DATA_SOURCE } from './tokens';

export async function buildReadDataSource(
  configService: ConfigService,
): Promise<DataSource> {
  const ds = new DataSource({
    type: 'postgres',
    host: configService.getOrThrow<string>('DB_READ_HOST'),
    port: configService.getOrThrow<number>('DB_READ_PORT'),
    username: configService.getOrThrow<string>('DB_READ_USERNAME'),
    password: configService.getOrThrow<string>('DB_READ_PASSWORD'),
    database: configService.getOrThrow<string>('DB_READ_DATABASE'),
    extra: { max: configService.getOrThrow<number>('DB_READ_POOL_SIZE') },
    entities: [],
    synchronize: false,
  });
  await ds.initialize();
  return ds;
}

export const readDataSourceProvider: FactoryProvider<DataSource> = {
  provide: READ_DATA_SOURCE,
  useFactory: buildReadDataSource,
  inject: [ConfigService],
};
