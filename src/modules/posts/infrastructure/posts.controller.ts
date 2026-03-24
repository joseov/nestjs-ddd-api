import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

// These commands/queries will be implemented in the Application layer next
import { CreatePostCommand } from '../application/commands/create-post.command';
import { UpdatePostCommand } from '../application/commands/update-post.command';
import { DeletePostCommand } from '../application/commands/delete-post.command';
import { FindPostsQuery } from '../application/queries/find-posts.query';
import type { PostDto } from '../application/queries/find-posts.handler';

class CreatePostDto {
  content: string;
  authorId: string;
}

class UpdatePostDto {
  content: string;
}

@Controller('posts')
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createPost(@Body() dto: CreatePostDto): Promise<void> {
    return this.commandBus.execute<CreatePostCommand, void>(
      new CreatePostCommand(dto.content, dto.authorId),
    );
  }

  @Get()
  async getPosts(): Promise<PostDto[]> {
    return this.queryBus.execute<FindPostsQuery, PostDto[]>(
      new FindPostsQuery(),
    );
  }

  @Patch(':id')
  async updatePost(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ): Promise<void> {
    return this.commandBus.execute<UpdatePostCommand, void>(
      new UpdatePostCommand(id, dto.content),
    );
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute<DeletePostCommand, void>(
      new DeletePostCommand(id),
    );
  }
}
