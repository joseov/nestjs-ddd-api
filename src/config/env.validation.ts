import 'reflect-metadata';
import { plainToInstance, Type } from 'class-transformer';
import { IsIn, IsInt, IsString, Max, Min, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsString()
  DB_WRITE_HOST: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_WRITE_PORT: number;

  @IsString()
  DB_WRITE_USERNAME: string;

  @IsString()
  DB_WRITE_PASSWORD: string;

  @IsString()
  DB_WRITE_DATABASE: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  DB_WRITE_POOL_SIZE: number;

  @IsString()
  DB_READ_HOST: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_READ_PORT: number;

  @IsString()
  DB_READ_USERNAME: string;

  @IsString()
  DB_READ_PASSWORD: string;

  @IsString()
  DB_READ_DATABASE: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  DB_READ_POOL_SIZE: number;
}

export function validateEnv(raw: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, raw, {
    enableImplicitConversion: false,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const message = errors
      .map((err) => {
        const constraints = Object.values(err.constraints ?? {}).join(', ');
        return `${err.property}: ${constraints}`;
      })
      .join('; ');

    throw new Error(`Environment validation failed — ${message}`);
  }

  return validated;
}
