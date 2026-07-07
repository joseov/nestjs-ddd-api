import { registerAs } from '@nestjs/config';
import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';

export class AppConfig {
  @IsString()
  @IsIn(['development', 'test', 'production'])
  nodeEnv: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;
}

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT ?? '3000', 10),
}));
