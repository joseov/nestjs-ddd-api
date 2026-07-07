import { registerAs } from '@nestjs/config';
import { IsInt, IsString, Max, Min } from 'class-validator';

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
}

export default registerAs('databaseRead', () => ({
  host: process.env.DB_READ_HOST,
  port: parseInt(process.env.DB_READ_PORT ?? '5432', 10),
  username: process.env.DB_READ_USERNAME,
  password: process.env.DB_READ_PASSWORD,
  database: process.env.DB_READ_DATABASE,
  poolSize: parseInt(process.env.DB_READ_POOL_SIZE ?? '5', 10),
}));
