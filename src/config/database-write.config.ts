import { registerAs } from '@nestjs/config';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class DatabaseWriteConfig {
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

export default registerAs('databaseWrite', () => ({
  host: process.env.DB_WRITE_HOST,
  port: parseInt(process.env.DB_WRITE_PORT ?? '5432', 10),
  username: process.env.DB_WRITE_USERNAME,
  password: process.env.DB_WRITE_PASSWORD,
  database: process.env.DB_WRITE_DATABASE,
  poolSize: parseInt(process.env.DB_WRITE_POOL_SIZE ?? '10', 10),
  connectTimeoutMs: process.env.DB_WRITE_CONNECT_TIMEOUT_MS
    ? parseInt(process.env.DB_WRITE_CONNECT_TIMEOUT_MS, 10)
    : undefined,
  idleTimeoutMs: process.env.DB_WRITE_IDLE_TIMEOUT_MS
    ? parseInt(process.env.DB_WRITE_IDLE_TIMEOUT_MS, 10)
    : undefined,
}));
