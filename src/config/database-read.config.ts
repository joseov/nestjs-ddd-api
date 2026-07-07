import { registerAs } from '@nestjs/config';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class DatabaseReadConfig {
  @IsString()
  host: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  database: string;

  @IsInt()
  @Min(1)
  poolSize: number;

  /** Optional. Defaults to 5000 ms in the DataSource factory. @Min(1) because 0 means infinite wait. */
  @IsOptional()
  @IsInt()
  @Min(1)
  connectTimeoutMs?: number;

  /** Optional. Defaults to 30000 ms in the DataSource factory. @Min(0) because 0 disables idle eviction. */
  @IsOptional()
  @IsInt()
  @Min(0)
  idleTimeoutMs?: number;
}

export default registerAs('databaseRead', () => ({
  host: process.env.DB_READ_HOST,
  port: parseInt(process.env.DB_READ_PORT ?? '5432', 10),
  username: process.env.DB_READ_USERNAME,
  password: process.env.DB_READ_PASSWORD,
  database: process.env.DB_READ_DATABASE,
  poolSize: parseInt(process.env.DB_READ_POOL_SIZE ?? '5', 10),
  connectTimeoutMs: process.env.DB_READ_CONNECT_TIMEOUT_MS
    ? parseInt(process.env.DB_READ_CONNECT_TIMEOUT_MS, 10)
    : undefined,
  idleTimeoutMs: process.env.DB_READ_IDLE_TIMEOUT_MS
    ? parseInt(process.env.DB_READ_IDLE_TIMEOUT_MS, 10)
    : undefined,
}));
