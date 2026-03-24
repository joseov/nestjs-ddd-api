import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infrastructure
import { PostOrmEntity } from './infrastructure/post.orm-entity';
import { PostRepository } from './infrastructure/post.repository';
import { PostsController } from './infrastructure/posts.controller';

// Command Handlers
import { CreatePostHandler } from './application/commands/create-post.handler';
import { UpdatePostHandler } from './application/commands/update-post.handler';
import { DeletePostHandler } from './application/commands/delete-post.handler';

// Query Handlers
import { FindPostsHandler } from './application/queries/find-posts.handler';

// Event Handlers
import { PostCreatedEventHandler } from './application/events/post-created.handler';

const CommandHandlers = [
  CreatePostHandler,
  UpdatePostHandler,
  DeletePostHandler,
];

const QueryHandlers = [FindPostsHandler];

const EventHandlers = [PostCreatedEventHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([PostOrmEntity])],
  controllers: [PostsController],
  providers: [
    {
      provide: 'IPostRepository',
      useClass: PostRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
})
export class PostsModule {}
