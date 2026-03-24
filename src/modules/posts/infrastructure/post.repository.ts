import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../domain/post.entity';
import { IPostRepository } from '../domain/post.repository.interface';
import { PostOrmEntity } from './post.orm-entity';

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(
    @InjectRepository(PostOrmEntity)
    private readonly ormRepository: Repository<PostOrmEntity>,
  ) {}

  async save(post: Post): Promise<void> {
    const ormEntity = this.toOrmEntity(post);
    await this.ormRepository.save(ormEntity);
  }

  async findById(id: string): Promise<Post | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    if (!ormEntity) {
      return null;
    }
    return this.toDomainEntity(ormEntity);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete({ id });
  }

  // Mappers
  private toOrmEntity(post: Post): PostOrmEntity {
    const ormEntity = new PostOrmEntity();
    ormEntity.id = post.id;
    ormEntity.content = post.content;
    ormEntity.authorId = post.authorId;
    ormEntity.createdAt = post.createdAt;
    ormEntity.updatedAt = post.updatedAt;
    return ormEntity;
  }

  private toDomainEntity(ormEntity: PostOrmEntity): Post {
    return Post.reconstitute(
      ormEntity.id,
      ormEntity.content,
      ormEntity.authorId,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }
}
