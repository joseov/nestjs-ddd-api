import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { HealthModule } from './shared/infrastructure/health/health.module';
import { PostsModule } from './modules/posts/posts.module';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    DatabaseModule,
    HealthModule,
    PostsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
