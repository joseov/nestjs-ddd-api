import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FindPostsQuery } from './find-posts.query';
import { PostOrmEntity } from '../../infrastructure/post.orm-entity';

// Optional: Define a Read DTO here to decouple entirely from OrmEntity shape
export class PostDto {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
}

@QueryHandler(FindPostsQuery)
export class FindPostsHandler implements IQueryHandler<FindPostsQuery> {
  // Notice we inject TypeORM directly here!
  // Queries bypass the Domain Layer for performance and simplicity.
  constructor(
    @InjectRepository(PostOrmEntity)
    private readonly repository: Repository<PostOrmEntity>,
  ) {}

  async execute(): Promise<PostDto[]> {
    const records = await this.repository.find({
      order: { createdAt: 'DESC' },
      take: 50, // simple hardcoded limit for demonstration
    });

    return records.map((record) => ({
      id: record.id,
      content: record.content,
      authorId: record.authorId,
      createdAt: record.createdAt,
    }));
  }
}
