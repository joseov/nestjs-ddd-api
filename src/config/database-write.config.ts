import { registerAs } from '@nestjs/config';
import { IsInt, IsString, Max, Min } from 'class-validator';

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
}

export default registerAs('databaseWrite', () => ({
  host: process.env.DB_WRITE_HOST,
  port: parseInt(process.env.DB_WRITE_PORT ?? '5432', 10),
  username: process.env.DB_WRITE_USERNAME,
  password: process.env.DB_WRITE_PASSWORD,
  database: process.env.DB_WRITE_DATABASE,
  poolSize: parseInt(process.env.DB_WRITE_POOL_SIZE ?? '10', 10),
}));
